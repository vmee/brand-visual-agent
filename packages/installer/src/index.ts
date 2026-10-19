import { createHash, randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  lstat,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export const SKILL_NAME = "brand-visual-designer";
const INSTALL_MANIFEST = ".brand-visual-install.json";
const INSTALLER_VERSION = "0.1.0";

export type AgentId =
  "codex" | "claude-code" | "cursor" | "gemini-cli" | "opencode" | "workbuddy";
export type InstallScope = "project" | "user";
export type InstallState =
  "not_installed" | "installed" | "update_available" | "modified" | "conflict";

export interface AgentAdapter {
  id: AgentId;
  displayName: string;
  projectSkillRoot: string;
  userSkillRoot: string;
  discoveryCommand: string;
  officialDocumentation: string;
  verifiedAt: string;
}

export const AGENT_ADAPTERS: Readonly<Record<AgentId, AgentAdapter>> = {
  codex: {
    id: "codex",
    displayName: "Codex CLI",
    projectSkillRoot: ".codex/skills",
    userSkillRoot: ".codex/skills",
    discoveryCommand: "codex exec",
    officialDocumentation: "https://developers.openai.com/blog/eval-skills",
    verifiedAt: "2026-10-18",
  },
  "claude-code": {
    id: "claude-code",
    displayName: "Claude Code",
    projectSkillRoot: ".claude/skills",
    userSkillRoot: ".claude/skills",
    discoveryCommand: "claude /skills",
    officialDocumentation: "https://code.claude.com/docs/en/skills",
    verifiedAt: "2026-10-18",
  },
  cursor: {
    id: "cursor",
    displayName: "Cursor",
    projectSkillRoot: ".cursor/skills",
    userSkillRoot: ".cursor/skills",
    discoveryCommand: "Cursor Settings > Rules > Skills",
    officialDocumentation: "https://cursor.com/help/customization/skills",
    verifiedAt: "2026-10-18",
  },
  "gemini-cli": {
    id: "gemini-cli",
    displayName: "Gemini CLI",
    projectSkillRoot: ".gemini/skills",
    userSkillRoot: ".gemini/skills",
    discoveryCommand: "gemini skills list",
    officialDocumentation: "https://geminicli.com/docs/cli/using-agent-skills/",
    verifiedAt: "2026-10-18",
  },
  opencode: {
    id: "opencode",
    displayName: "OpenCode",
    projectSkillRoot: ".opencode/skills",
    userSkillRoot: ".config/opencode/skills",
    discoveryCommand: "opencode run",
    officialDocumentation: "https://opencode.ai/docs/skills",
    verifiedAt: "2026-10-18",
  },
  workbuddy: {
    id: "workbuddy",
    displayName: "Tencent WorkBuddy",
    projectSkillRoot: ".workbuddy/skills",
    userSkillRoot: ".workbuddy/skills",
    discoveryCommand: "WorkBuddy Desktop > Skills",
    officialDocumentation: "https://workbuddy.ai/docs/skills",
    verifiedAt: "2026-10-18",
  },
};

export class SkillInstallError extends Error {
  readonly code:
    | "AGENT_UNSUPPORTED"
    | "SKILL_SOURCE_INVALID"
    | "INSTALL_CONFLICT"
    | "INSTALL_MODIFIED"
    | "INSTALL_NOT_FOUND";

  constructor(code: SkillInstallError["code"], message: string) {
    super(message);
    this.name = "SkillInstallError";
    this.code = code;
  }
}

interface InstallManifest {
  manifestVersion: 1;
  installerVersion: string;
  skillName: string;
  agent: AgentId;
  scope: InstallScope;
  sourceHash: string;
  installedAt: string;
  files: Record<string, string>;
}

export interface InstallContext {
  agent: AgentId;
  scope: InstallScope;
  projectRoot: string;
  homeRoot: string;
  sourceDirectory: string;
  dryRun?: boolean;
}

export interface InstallStatus {
  agent: AgentId;
  scope: InstallScope;
  state: InstallState;
  targetDirectory: string;
  sourceHash: string | null;
  installedHash: string | null;
  reason?: string;
}

export interface InstallResult extends InstallStatus {
  operation: "install" | "update" | "uninstall";
  changed: boolean;
  dryRun: boolean;
}

function adapterFor(agent: string): AgentAdapter {
  const adapter = AGENT_ADAPTERS[agent as AgentId];
  if (!adapter) {
    throw new SkillInstallError(
      "AGENT_UNSUPPORTED",
      `不支持的 Agent：${agent}`,
    );
  }
  return adapter;
}

export function resolveInstallTarget(context: InstallContext): string {
  const adapter = adapterFor(context.agent);
  const root =
    context.scope === "project" ? context.projectRoot : context.homeRoot;
  const skillRoot =
    context.scope === "project"
      ? adapter.projectSkillRoot
      : adapter.userSkillRoot;
  return path.resolve(root, skillRoot, SKILL_NAME);
}

async function exists(target: string): Promise<boolean> {
  try {
    await lstat(target);
    return true;
  } catch {
    return false;
  }
}

async function findSymlinkTraversal(
  root: string,
  target: string,
): Promise<string | null> {
  const relative = path.relative(root, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`)) return target;

  let current = root;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    try {
      if ((await lstat(current)).isSymbolicLink()) return current;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  return null;
}

async function collectFiles(
  root: string,
  options: { excludeManifest?: boolean } = {},
): Promise<string[]> {
  const files: string[] = [];
  async function visit(directory: string, prefix: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === ".DS_Store") continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new SkillInstallError(
          "SKILL_SOURCE_INVALID",
          `Skill 中不允许符号链接：${relative}`,
        );
      }
      if (entry.isDirectory()) {
        await visit(absolute, relative);
      } else if (
        entry.isFile() &&
        !(options.excludeManifest && relative === INSTALL_MANIFEST)
      ) {
        files.push(relative);
      } else if (!entry.isFile()) {
        throw new SkillInstallError(
          "SKILL_SOURCE_INVALID",
          `Skill 中包含不支持的文件类型：${relative}`,
        );
      }
    }
  }
  await visit(root, "");
  return files.sort();
}

async function hashFiles(
  root: string,
  files: readonly string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const relative of files) {
    const content = await readFile(path.join(root, relative));
    result[relative] = createHash("sha256").update(content).digest("hex");
  }
  return result;
}

function aggregateHash(files: Record<string, string>): string {
  const hash = createHash("sha256");
  for (const [relative, digest] of Object.entries(files).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    hash.update(relative).update("\0").update(digest).update("\0");
  }
  return hash.digest("hex");
}

async function inspectSource(sourceDirectory: string): Promise<{
  files: string[];
  hashes: Record<string, string>;
  hash: string;
}> {
  let metadata;
  try {
    metadata = await lstat(sourceDirectory);
  } catch (error) {
    throw new SkillInstallError(
      "SKILL_SOURCE_INVALID",
      `Skill 源目录不存在：${sourceDirectory}`,
    );
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new SkillInstallError(
      "SKILL_SOURCE_INVALID",
      "Skill 源必须是普通目录",
    );
  }
  const files = await collectFiles(sourceDirectory);
  if (!files.includes("SKILL.md")) {
    throw new SkillInstallError(
      "SKILL_SOURCE_INVALID",
      "Skill 源目录缺少 SKILL.md",
    );
  }
  const hashes = await hashFiles(sourceDirectory, files);
  return { files, hashes, hash: aggregateHash(hashes) };
}

function sameRecord(
  expected: Record<string, string>,
  actual: Record<string, string>,
): boolean {
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  return (
    expectedKeys.length === actualKeys.length &&
    expectedKeys.every(
      (key, index) =>
        key === actualKeys[index] && expected[key] === actual[key],
    )
  );
}

async function readManifest(target: string): Promise<InstallManifest | null> {
  try {
    const parsed = JSON.parse(
      await readFile(path.join(target, INSTALL_MANIFEST), "utf8"),
    ) as Partial<InstallManifest>;
    if (
      parsed.manifestVersion !== 1 ||
      parsed.skillName !== SKILL_NAME ||
      typeof parsed.sourceHash !== "string" ||
      !parsed.files ||
      typeof parsed.files !== "object"
    ) {
      return null;
    }
    return parsed as InstallManifest;
  } catch {
    return null;
  }
}

export async function getInstallStatus(
  context: InstallContext,
): Promise<InstallStatus> {
  adapterFor(context.agent);
  const source = await inspectSource(context.sourceDirectory);
  const targetDirectory = resolveInstallTarget(context);
  const symlink = await findSymlinkTraversal(
    context.scope === "project" ? context.projectRoot : context.homeRoot,
    targetDirectory,
  );
  if (symlink) {
    return {
      agent: context.agent,
      scope: context.scope,
      state: "conflict",
      targetDirectory,
      sourceHash: source.hash,
      installedHash: null,
      reason: `安装路径经过符号链接：${symlink}`,
    };
  }
  if (!(await exists(targetDirectory))) {
    return {
      agent: context.agent,
      scope: context.scope,
      state: "not_installed",
      targetDirectory,
      sourceHash: source.hash,
      installedHash: null,
    };
  }
  const metadata = await lstat(targetDirectory);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    return {
      agent: context.agent,
      scope: context.scope,
      state: "conflict",
      targetDirectory,
      sourceHash: source.hash,
      installedHash: null,
      reason: "目标不是本安装器管理的普通目录",
    };
  }
  const manifest = await readManifest(targetDirectory);
  if (
    !manifest ||
    manifest.agent !== context.agent ||
    manifest.scope !== context.scope
  ) {
    return {
      agent: context.agent,
      scope: context.scope,
      state: "conflict",
      targetDirectory,
      sourceHash: source.hash,
      installedHash: manifest?.sourceHash ?? null,
      reason: "目标目录不包含匹配的安装清单",
    };
  }
  let actualFiles: string[];
  let actualHashes: Record<string, string>;
  try {
    actualFiles = await collectFiles(targetDirectory, {
      excludeManifest: true,
    });
    actualHashes = await hashFiles(targetDirectory, actualFiles);
  } catch {
    return {
      agent: context.agent,
      scope: context.scope,
      state: "modified",
      targetDirectory,
      sourceHash: source.hash,
      installedHash: manifest.sourceHash,
      reason: "安装目录包含不安全的文件类型",
    };
  }
  if (!sameRecord(manifest.files, actualHashes)) {
    return {
      agent: context.agent,
      scope: context.scope,
      state: "modified",
      targetDirectory,
      sourceHash: source.hash,
      installedHash: manifest.sourceHash,
      reason: "安装副本已被修改或包含额外文件",
    };
  }
  return {
    agent: context.agent,
    scope: context.scope,
    state:
      source.hash === manifest.sourceHash ? "installed" : "update_available",
    targetDirectory,
    sourceHash: source.hash,
    installedHash: manifest.sourceHash,
  };
}

async function prepareCopy(
  context: InstallContext,
  target: string,
): Promise<string> {
  const source = await inspectSource(context.sourceDirectory);
  const temporary = `${target}.tmp-${randomUUID()}`;
  await mkdir(temporary, { recursive: false });
  try {
    for (const relative of source.files) {
      const destination = path.join(temporary, relative);
      const sourceFile = path.join(context.sourceDirectory, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(
        destination,
        await readFile(sourceFile),
      );
      const fileStat = await stat(sourceFile);
      await chmod(destination, fileStat.mode);
    }
    const manifest: InstallManifest = {
      manifestVersion: 1,
      installerVersion: INSTALLER_VERSION,
      skillName: SKILL_NAME,
      agent: context.agent,
      scope: context.scope,
      sourceHash: source.hash,
      installedAt: new Date().toISOString(),
      files: source.hashes,
    };
    await writeFile(
      path.join(temporary, INSTALL_MANIFEST),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { flag: "wx" },
    );
    return temporary;
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

function asResult(
  status: InstallStatus,
  operation: InstallResult["operation"],
  changed: boolean,
  dryRun: boolean,
): InstallResult {
  return { ...status, operation, changed, dryRun };
}

export async function installSkill(
  context: InstallContext,
): Promise<InstallResult> {
  const status = await getInstallStatus(context);
  if (status.state === "installed") {
    return asResult(status, "install", false, Boolean(context.dryRun));
  }
  if (status.state !== "not_installed") {
    throw new SkillInstallError(
      status.state === "modified" ? "INSTALL_MODIFIED" : "INSTALL_CONFLICT",
      status.reason ?? `当前状态不允许安装：${status.state}`,
    );
  }
  if (context.dryRun) {
    return asResult(status, "install", true, true);
  }
  await mkdir(path.dirname(status.targetDirectory), { recursive: true });
  const temporary = await prepareCopy(context, status.targetDirectory);
  try {
    await rename(temporary, status.targetDirectory);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return asResult(await getInstallStatus(context), "install", true, false);
}

export async function updateSkill(
  context: InstallContext,
): Promise<InstallResult> {
  const status = await getInstallStatus(context);
  if (status.state === "installed") {
    return asResult(status, "update", false, Boolean(context.dryRun));
  }
  if (status.state === "not_installed") {
    throw new SkillInstallError("INSTALL_NOT_FOUND", "Skill 尚未安装");
  }
  if (status.state !== "update_available") {
    throw new SkillInstallError(
      status.state === "modified" ? "INSTALL_MODIFIED" : "INSTALL_CONFLICT",
      status.reason ?? `当前状态不允许更新：${status.state}`,
    );
  }
  if (context.dryRun) {
    return asResult(status, "update", true, true);
  }
  const temporary = await prepareCopy(context, status.targetDirectory);
  const backup = `${status.targetDirectory}.backup-${randomUUID()}`;
  let movedOriginal = false;
  try {
    await rename(status.targetDirectory, backup);
    movedOriginal = true;
    await rename(temporary, status.targetDirectory);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (movedOriginal) {
      if (await exists(status.targetDirectory)) {
        await rm(status.targetDirectory, { recursive: true, force: true });
      }
      if (await exists(backup)) await rename(backup, status.targetDirectory);
    }
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return asResult(await getInstallStatus(context), "update", true, false);
}

export async function uninstallSkill(
  context: InstallContext,
): Promise<InstallResult> {
  const status = await getInstallStatus(context);
  if (status.state === "not_installed") {
    return asResult(status, "uninstall", false, Boolean(context.dryRun));
  }
  if (status.state !== "installed" && status.state !== "update_available") {
    throw new SkillInstallError(
      status.state === "modified" ? "INSTALL_MODIFIED" : "INSTALL_CONFLICT",
      status.reason ?? `当前状态不允许卸载：${status.state}`,
    );
  }
  if (context.dryRun) {
    return asResult(status, "uninstall", true, true);
  }
  await rm(status.targetDirectory, { recursive: true, force: false });
  return asResult(
    {
      ...status,
      state: "not_installed",
      installedHash: null,
    },
    "uninstall",
    true,
    false,
  );
}
