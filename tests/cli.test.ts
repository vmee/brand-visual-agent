import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  validateCliResult,
  validateManifest,
  validateQualityReport,
} from "@brand-visual/schemas";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const cliPath = path.join(repositoryRoot, "packages/cli/dist/index.js");
const fixturePath = path.join(
  repositoryRoot,
  "tests/fixtures/m1/design-spec.json",
);
const temporaryDirectories: string[] = [];

async function createWorkspace(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "brand-visual-m1-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function createWorkspaceWithSkill(): Promise<string> {
  const directory = await createWorkspace();
  const target = path.join(directory, "skills/brand-visual-designer");
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(repositoryRoot, "skills/brand-visual-designer"), target, {
    recursive: true,
  });
  return directory;
}

function runCli(cwd: string, ...arguments_: string[]) {
  const result = spawnSync(process.execPath, [cliPath, ...arguments_], {
    cwd,
    encoding: "utf8",
  });
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  return {
    ...result,
    lines,
    json: lines.length === 1 ? JSON.parse(lines[0]!) : undefined,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true })),
  );
});

describe("brand-visual CLI", () => {
  it("reports a passing doctor result", () => {
    const result = runCli(repositoryRoot, "doctor", "--json");
    expect(result.status).toBe(0);
    expect(result.lines).toHaveLength(1);
    expect(result.json.ok).toBe(true);
    expect(validateCliResult(result.json).valid).toBe(true);
  });

  it("reports mock capabilities without an API key", () => {
    const result = runCli(repositoryRoot, "capabilities", "--json");
    expect(result.status).toBe(0);
    expect(result.json.data.provider).toMatchObject({
      id: "mock",
      mock: true,
      generate: true,
      edit: false,
    });
  });

  it("reports its version in machine-readable form", () => {
    const result = runCli(repositoryRoot, "version", "--json");
    expect(result.status).toBe(0);
    expect(result.json).toMatchObject({
      ok: true,
      command: "version",
      data: { cliVersion: "0.1.0" },
    });
  });

  it("installs, reports, and safely uninstalls a project skill", async () => {
    const workspace = await createWorkspaceWithSkill();
    const installed = runCli(
      workspace,
      "skill",
      "install",
      "--agent",
      "codex",
      "--scope",
      "project",
      "--json",
    );
    expect(installed.status).toBe(0);
    expect(installed.json).toMatchObject({
      ok: true,
      command: "skill install",
      data: { state: "installed", changed: true },
    });

    const status = runCli(
      workspace,
      "skill",
      "status",
      "--agent",
      "codex",
      "--json",
    );
    expect(status.json).toMatchObject({
      ok: true,
      data: {
        state: "installed",
        adapter: { projectSkillRoot: ".codex/skills" },
      },
    });

    const uninstalled = runCli(
      workspace,
      "skill",
      "uninstall",
      "--agent",
      "codex",
      "--json",
    );
    expect(uninstalled.status).toBe(0);
    expect(uninstalled.json.data).toMatchObject({
      state: "not_installed",
      changed: true,
    });
  });

  it("generates and validates the M1 fixture", async () => {
    const workspace = await createWorkspace();
    await writeFile(
      path.join(workspace, "design-spec.json"),
      await readFile(fixturePath),
    );

    const generated = runCli(
      workspace,
      "generate",
      "--spec",
      "design-spec.json",
      "--json",
    );
    expect(generated.status).toBe(0);
    expect(generated.lines).toHaveLength(1);
    expect(generated.json).toMatchObject({
      ok: true,
      command: "generate",
      status: "needs_review",
    });
    expect(validateCliResult(generated.json).valid).toBe(true);

    const taskDirectory = path.join(workspace, "outputs/m1-mock-task");
    const manifest = JSON.parse(
      await readFile(path.join(taskDirectory, "manifest.json"), "utf8"),
    );
    const quality = JSON.parse(
      await readFile(path.join(taskDirectory, "quality-report.json"), "utf8"),
    );
    expect(validateManifest(manifest).valid).toBe(true);
    expect(validateQualityReport(quality).valid).toBe(true);
    expect(manifest.provider).toEqual({
      id: "mock",
      mock: true,
      capabilitySnapshotId: "mock-m1-v1",
    });

    const validated = runCli(
      workspace,
      "validate",
      "--task",
      "outputs/m1-mock-task",
      "--json",
    );
    expect(validated.status).toBe(0);
    expect(validated.json).toMatchObject({
      ok: true,
      command: "validate",
      status: "needs_review",
    });
  });

  it("fails invalid JSON without creating an output directory", async () => {
    const workspace = await createWorkspace();
    await writeFile(path.join(workspace, "invalid.json"), "{not-json", "utf8");
    const result = runCli(
      workspace,
      "generate",
      "--spec",
      "invalid.json",
      "--json",
    );
    expect(result.status).not.toBe(0);
    expect(result.json).toMatchObject({
      ok: false,
      error: { code: "SCHEMA_INVALID" },
    });
  });

  it("rejects an output path outside the workspace", async () => {
    const workspace = await createWorkspace();
    const spec = JSON.parse(await readFile(fixturePath, "utf8"));
    spec.output.directory = "../escape";
    await writeFile(
      path.join(workspace, "design-spec.json"),
      JSON.stringify(spec),
      "utf8",
    );
    const result = runCli(
      workspace,
      "generate",
      "--spec",
      "design-spec.json",
      "--json",
    );
    expect(result.status).not.toBe(0);
    expect(result.json).toMatchObject({
      ok: false,
      error: { code: "PATH_OUTSIDE_WORKSPACE" },
    });
  });

  it("detects a modified artifact", async () => {
    const workspace = await createWorkspace();
    await writeFile(
      path.join(workspace, "design-spec.json"),
      await readFile(fixturePath),
    );
    expect(
      runCli(workspace, "generate", "--spec", "design-spec.json", "--json")
        .status,
    ).toBe(0);
    await writeFile(
      path.join(workspace, "outputs/m1-mock-task/variants/warm-editorial.png"),
      "tampered",
    );
    const result = runCli(
      workspace,
      "validate",
      "--task",
      "outputs/m1-mock-task",
      "--json",
    );
    expect(result.status).not.toBe(0);
    expect(result.json).toMatchObject({
      ok: false,
      error: { code: "QUALITY_FAILED" },
    });
  });
});
