#!/usr/bin/env node

import { constants } from "node:fs";
import { access, readFile, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BrandVisualError,
  generateTask,
  reviseTask,
  validateTask,
} from "@brand-visual/core";
import { MockImageProvider } from "@brand-visual/provider-mock";
import {
  AGENT_ADAPTERS,
  getInstallStatus,
  installSkill,
  SkillInstallError,
  uninstallSkill,
  updateSkill,
  type AgentId,
  type InstallContext,
  type InstallScope,
} from "@brand-visual/installer";
import type { CliResult, DesignSpec } from "@brand-visual/schemas";
import {
  formatValidationErrors,
  SCHEMA_VERSION,
  validateCliResult,
  validateDesignSpec,
} from "@brand-visual/schemas";

const CLI_VERSION = "0.1.0";

interface ParsedArguments {
  command: string | undefined;
  subcommand: string | undefined;
  json: boolean;
  dryRun: boolean;
  options: Map<string, string>;
}

function parseArguments(argv: string[]): ParsedArguments {
  const command = argv[0];
  const subcommand = command === "skill" ? argv[1] : undefined;
  const options = new Map<string, string>();
  let json = false;
  let dryRun = false;
  for (
    let index = command === "skill" ? 2 : 1;
    index < argv.length;
    index += 1
  ) {
    const argument = argv[index];
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument?.startsWith("--")) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new BrandVisualError(
          "COMMAND_INVALID",
          `缺少参数值：${argument}`,
        );
      }
      options.set(argument.slice(2), value);
      index += 1;
      continue;
    }
    throw new BrandVisualError(
      "COMMAND_INVALID",
      `无法识别的参数：${argument ?? ""}`,
    );
  }
  return { command, subcommand, json, dryRun, options };
}

function requireOption(arguments_: ParsedArguments, key: string): string {
  const value = arguments_.options.get(key);
  if (!value)
    throw new BrandVisualError("COMMAND_INVALID", `缺少 --${key} 参数`);
  return value;
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== "..")
  );
}

async function resolveWorkspaceRoot(): Promise<string> {
  return realpath(process.cwd());
}

async function resolveExistingPath(
  workspaceRoot: string,
  input: string,
  allowOutsideWorkspace = false,
): Promise<string> {
  const candidate = await realpath(path.resolve(workspaceRoot, input));
  if (!allowOutsideWorkspace && !isWithin(workspaceRoot, candidate)) {
    throw new BrandVisualError(
      "PATH_OUTSIDE_WORKSPACE",
      "输入路径越过允许的工作目录",
      {
        details: { input },
      },
    );
  }
  return candidate;
}

async function nearestExistingPath(candidate: string): Promise<string> {
  let current = candidate;
  while (true) {
    try {
      await stat(current);
      return realpath(current);
    } catch {
      const parent = path.dirname(current);
      if (parent === current)
        throw new BrandVisualError("IO_ERROR", "无法解析输出路径");
      current = parent;
    }
  }
}

async function resolveOutputPath(
  workspaceRoot: string,
  input: string,
): Promise<string> {
  const candidate = path.resolve(workspaceRoot, input);
  const existingAncestor = await nearestExistingPath(candidate);
  if (
    !isWithin(workspaceRoot, candidate) ||
    !isWithin(workspaceRoot, existingAncestor)
  ) {
    throw new BrandVisualError(
      "PATH_OUTSIDE_WORKSPACE",
      "输出路径越过允许的工作目录",
      {
        details: { input },
      },
    );
  }
  return candidate;
}

function relativeResultPath(workspaceRoot: string, target: string): string {
  return path.relative(workspaceRoot, target).split(path.sep).join("/");
}

function success(
  command: string,
  status: "passed" | "completed" | "needs_review",
  data: Record<string, unknown>,
) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    command,
    status,
    data,
  } as const;
}

function failure(error: BrandVisualError) {
  return {
    schemaVersion: SCHEMA_VERSION,
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.details ? { details: error.details } : {}),
    },
  } as const;
}

function emit(result: CliResult): void {
  const validation = validateCliResult(result);
  if (!validation.valid) {
    process.stderr.write(
      `CLI result schema violation: ${JSON.stringify(formatValidationErrors(validation.errors))}\n`,
    );
    process.exitCode = 70;
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

async function isSkillPresent(workspaceRoot: string): Promise<boolean> {
  // 1. 项目本地目录
  const projectSkill = path.join(
    workspaceRoot,
    "skills/brand-visual-designer/SKILL.md",
  );
  try {
    await access(projectSkill, constants.R_OK);
    return true;
  } catch {}

  // 2. 已安装的用户全局技能目录 (~/.<agent>/skills/...)
  const home = homedir();
  const knownUserSkills = [
    path.join(home, ".codex/skills/brand-visual-designer/SKILL.md"),
    path.join(home, ".workbuddy/skills/brand-visual-designer/SKILL.md"),
    path.join(home, ".claude/skills/brand-visual-designer/SKILL.md"),
    path.join(home, ".cursor/skills/brand-visual-designer/SKILL.md"),
    path.join(home, ".gemini/skills/brand-visual-designer/SKILL.md"),
    path.join(home, ".config/opencode/skills/brand-visual-designer/SKILL.md"),
  ];

  for (const candidate of knownUserSkills) {
    try {
      await access(candidate, constants.R_OK);
      return true;
    } catch {}
  }

  // 3. 关联的安装源码目录 (跨机或全局安装时的相对路径)
  try {
    const cliSource = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../skills/brand-visual-designer/SKILL.md",
    );
    await access(cliSource, constants.R_OK);
    return true;
  } catch {}

  return false;
}

async function runDoctor(workspaceRoot: string) {
  const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
  const nodeSupported =
    (major === 22 && minor >= 12) || major === 24 || major >= 26;
  let workspaceWritable = true;
  try {
    await access(workspaceRoot, constants.W_OK);
  } catch {
    workspaceWritable = false;
  }
  const skillSourcePresent = await isSkillPresent(workspaceRoot);
  const checks = { nodeSupported, workspaceWritable, skillSourcePresent };
  if (Object.values(checks).some((value) => !value)) {
    throw new BrandVisualError("CONFIG_INVALID", "环境检查未通过", {
      details: checks,
    });
  }
  return success("doctor", "passed", {
    cliVersion: CLI_VERSION,
    nodeVersion: process.versions.node,
    provider: "mock",
    checks,
  });
}

async function runCapabilities() {
  const provider = new MockImageProvider();
  return success("capabilities", "passed", {
    cliVersion: CLI_VERSION,
    schemaVersions: { designSpec: SCHEMA_VERSION, result: SCHEMA_VERSION },
    provider: await provider.probe(),
  });
}

async function readDesignSpec(specPath: string): Promise<DesignSpec> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(specPath, "utf8"));
  } catch (error) {
    throw new BrandVisualError("SCHEMA_INVALID", "DesignSpec 不是有效 JSON", {
      cause: error,
    });
  }
  const validation = validateDesignSpec(value);
  if (!validation.valid) {
    throw new BrandVisualError("SCHEMA_INVALID", "DesignSpec 不符合 schema", {
      details: { errors: formatValidationErrors(validation.errors) },
    });
  }
  return value as DesignSpec;
}

async function runGenerate(arguments_: ParsedArguments, workspaceRoot: string) {
  const specPath = await resolveExistingPath(
    workspaceRoot,
    requireOption(arguments_, "spec"),
  );
  const spec = await readDesignSpec(specPath);
  const outputDirectory = await resolveOutputPath(
    workspaceRoot,
    spec.output.directory,
  );

  const baseImageOption = arguments_.options.get("base-image");
  const baseImagePath = baseImageOption
    ? await resolveExistingPath(workspaceRoot, baseImageOption, true)
    : undefined;

  const result = await generateTask({
    spec,
    provider: new MockImageProvider(),
    workspaceRoot,
    outputDirectory,
    baseImagePath,
  });
  return success("generate", result.status, {
    taskId: result.taskId,
    outputDirectory: relativeResultPath(workspaceRoot, result.outputDirectory),
    manifest: relativeResultPath(workspaceRoot, result.manifestPath),
    qualityReport: relativeResultPath(workspaceRoot, result.qualityReportPath),
    artifacts: result.artifacts.map((artifact) =>
      relativeResultPath(workspaceRoot, artifact),
    ),
  });
}

async function runRevise(arguments_: ParsedArguments, workspaceRoot: string) {
  const specPath = await resolveExistingPath(
    workspaceRoot,
    requireOption(arguments_, "spec"),
  );
  const spec = await readDesignSpec(specPath);
  const taskDirectory = await resolveExistingPath(
    workspaceRoot,
    requireOption(arguments_, "task"),
  );
  const patchPath = await resolveExistingPath(
    workspaceRoot,
    requireOption(arguments_, "patch"),
    true,
  );

  let patch: any;
  try {
    patch = JSON.parse(await readFile(patchPath, "utf8"));
  } catch (error) {
    throw new BrandVisualError("SCHEMA_INVALID", "Patch 不是有效 JSON", {
      cause: error,
    });
  }

  const result = await reviseTask({
    spec,
    taskDirectory,
    patch,
    workspaceRoot,
  });

  return success("revise", "completed", { ...result });
}

async function runValidate(arguments_: ParsedArguments, workspaceRoot: string) {
  const taskDirectory = await resolveExistingPath(
    workspaceRoot,
    requireOption(arguments_, "task"),
  );
  const result = await validateTask(taskDirectory);
  return success("validate", result.status, { ...result });
}

function parseAgent(input: string): AgentId {
  if (Object.hasOwn(AGENT_ADAPTERS, input)) return input as AgentId;
  throw new BrandVisualError("AGENT_UNSUPPORTED", `不支持的 Agent：${input}`);
}

function parseScope(input: string | undefined): InstallScope {
  if (!input || input === "project") return "project";
  if (input === "user") return "user";
  throw new BrandVisualError("COMMAND_INVALID", `不支持的安装作用域：${input}`);
}

async function createInstallContext(
  arguments_: ParsedArguments,
  workspaceRoot: string,
): Promise<InstallContext> {
  const sourceInput =
    arguments_.options.get("source") ?? "skills/brand-visual-designer";
  return {
    agent: parseAgent(requireOption(arguments_, "agent")),
    scope: parseScope(arguments_.options.get("scope")),
    projectRoot: workspaceRoot,
    homeRoot: homedir(),
    sourceDirectory: await resolveExistingPath(workspaceRoot, sourceInput),
    dryRun: arguments_.dryRun,
  };
}

async function runSkill(arguments_: ParsedArguments, workspaceRoot: string) {
  const context = await createInstallContext(arguments_, workspaceRoot);
  switch (arguments_.subcommand) {
    case "status":
      return success("skill status", "passed", {
        ...(await getInstallStatus(context)),
        adapter: AGENT_ADAPTERS[context.agent],
      });
    case "install":
      return success("skill install", "completed", {
        ...(await installSkill(context)),
        adapter: AGENT_ADAPTERS[context.agent],
      });
    case "update":
      return success("skill update", "completed", {
        ...(await updateSkill(context)),
        adapter: AGENT_ADAPTERS[context.agent],
      });
    case "uninstall":
      return success("skill uninstall", "completed", {
        ...(await uninstallSkill(context)),
        adapter: AGENT_ADAPTERS[context.agent],
      });
    default:
      throw new BrandVisualError(
        "COMMAND_INVALID",
        "支持的 skill 子命令：status、install、update、uninstall",
      );
  }
}

async function main(): Promise<void> {
  try {
    const arguments_ = parseArguments(process.argv.slice(2));
    if (arguments_.command === "--version") {
      process.stdout.write(`${CLI_VERSION}\n`);
      return;
    }
    if (!arguments_.json) {
      throw new BrandVisualError(
        "COMMAND_INVALID",
        "M1 CLI 要求显式使用 --json",
      );
    }
    const workspaceRoot = await resolveWorkspaceRoot();
    switch (arguments_.command) {
      case "doctor":
        emit(await runDoctor(workspaceRoot));
        break;
      case "capabilities":
        emit(await runCapabilities());
        break;
      case "generate":
        emit(await runGenerate(arguments_, workspaceRoot));
        break;
      case "revise":
        emit(await runRevise(arguments_, workspaceRoot));
        break;
      case "validate":
        emit(await runValidate(arguments_, workspaceRoot));
        break;
      case "version":
        emit(
          success("version", "passed", {
            cliVersion: CLI_VERSION,
            schemaVersion: SCHEMA_VERSION,
          }),
        );
        break;
      case "skill":
        emit(await runSkill(arguments_, workspaceRoot));
        break;
      default:
        throw new BrandVisualError(
          "COMMAND_INVALID",
          "支持的命令：doctor、capabilities、generate、validate、version、skill",
        );
    }
  } catch (error) {
    const normalized =
      error instanceof BrandVisualError
        ? error
        : error instanceof SkillInstallError
          ? new BrandVisualError(error.code, error.message, { cause: error })
          : new BrandVisualError("IO_ERROR", "发生未处理错误", {
              cause: error,
            });
    process.stderr.write(`[${normalized.code}] ${normalized.message}\n`);
    emit(failure(normalized));
    process.exitCode = process.exitCode || 1;
  }
}

void main();
