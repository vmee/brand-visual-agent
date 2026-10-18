import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  AGENT_ADAPTERS,
  getInstallStatus,
  installSkill,
  resolveInstallTarget,
  SkillInstallError,
  uninstallSkill,
  updateSkill,
  type AgentId,
  type InstallContext,
} from "@brand-visual/installer";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceSkill = path.join(repositoryRoot, "skills/brand-visual-designer");
const temporaryDirectories: string[] = [];

async function fixture(agent: AgentId = "codex"): Promise<InstallContext> {
  const root = await mkdtemp(path.join(tmpdir(), "brand-visual-installer-"));
  temporaryDirectories.push(root);
  const sourceDirectory = path.join(root, "source", "brand-visual-designer");
  await mkdir(path.dirname(sourceDirectory), { recursive: true });
  await cp(sourceSkill, sourceDirectory, { recursive: true });
  return {
    agent,
    scope: "project",
    projectRoot: path.join(root, "project"),
    homeRoot: path.join(root, "home"),
    sourceDirectory,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true })),
  );
});

describe("skill installer", () => {
  it("uses the verified native path for all five adapters", async () => {
    expect(Object.keys(AGENT_ADAPTERS).sort()).toEqual([
      "claude-code",
      "codex",
      "cursor",
      "gemini-cli",
      "opencode",
    ]);
    const expected: Record<AgentId, string> = {
      codex: ".codex/skills/brand-visual-designer",
      "claude-code": ".claude/skills/brand-visual-designer",
      cursor: ".cursor/skills/brand-visual-designer",
      "gemini-cli": ".gemini/skills/brand-visual-designer",
      opencode: ".opencode/skills/brand-visual-designer",
    };
    for (const agent of Object.keys(AGENT_ADAPTERS) as AgentId[]) {
      const context = await fixture(agent);
      expect(
        path.relative(context.projectRoot, resolveInstallTarget(context)),
      ).toBe(expected[agent]);
      expect(AGENT_ADAPTERS[agent].officialDocumentation).toMatch(/^https:/);
      expect(AGENT_ADAPTERS[agent].verifiedAt).toBe("2026-10-18");
    }
  });

  it("installs idempotently, detects source changes, and updates", async () => {
    const context = await fixture();
    expect((await getInstallStatus(context)).state).toBe("not_installed");
    const installed = await installSkill(context);
    expect(installed).toMatchObject({ changed: true, state: "installed" });
    expect(
      await readFile(path.join(installed.targetDirectory, "SKILL.md")),
    ).toEqual(await readFile(path.join(context.sourceDirectory, "SKILL.md")));
    expect(await installSkill(context)).toMatchObject({
      changed: false,
      state: "installed",
    });

    await writeFile(
      path.join(context.sourceDirectory, "references", "m1-marker.md"),
      "M1 update\n",
    );
    expect((await getInstallStatus(context)).state).toBe("update_available");
    expect(await updateSkill(context)).toMatchObject({
      changed: true,
      state: "installed",
    });
  });

  it("does not overwrite an unowned directory", async () => {
    const context = await fixture();
    const target = resolveInstallTarget(context);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "SKILL.md"), "user content\n");
    await expect(installSkill(context)).rejects.toMatchObject({
      code: "INSTALL_CONFLICT",
    });
    expect(await readFile(path.join(target, "SKILL.md"), "utf8")).toBe(
      "user content\n",
    );
  });

  it("refuses a project install path that traverses a symlink", async () => {
    const context = await fixture();
    const outside = path.join(path.dirname(context.projectRoot), "outside");
    await mkdir(context.projectRoot, { recursive: true });
    await mkdir(outside, { recursive: true });
    await symlink(outside, path.join(context.projectRoot, ".codex"));
    await expect(installSkill(context)).rejects.toMatchObject({
      code: "INSTALL_CONFLICT",
    });
    expect(await getInstallStatus(context)).toMatchObject({
      state: "conflict",
      reason: expect.stringContaining("符号链接"),
    });
  });

  it("refuses to update or uninstall a modified installation", async () => {
    const context = await fixture();
    const installed = await installSkill(context);
    await writeFile(path.join(installed.targetDirectory, "notes.md"), "mine\n");
    expect((await getInstallStatus(context)).state).toBe("modified");
    await expect(updateSkill(context)).rejects.toBeInstanceOf(
      SkillInstallError,
    );
    await expect(uninstallSkill(context)).rejects.toMatchObject({
      code: "INSTALL_MODIFIED",
    });
    expect(
      await readFile(path.join(installed.targetDirectory, "notes.md")),
    ).toEqual(Buffer.from("mine\n"));
  });

  it("supports dry-run and removes only an intact owned copy", async () => {
    const context = { ...(await fixture()), dryRun: true };
    const preview = await installSkill(context);
    expect(preview).toMatchObject({ changed: true, dryRun: true });
    expect((await getInstallStatus(context)).state).toBe("not_installed");

    context.dryRun = false;
    await installSkill(context);
    const removed = await uninstallSkill(context);
    expect(removed).toMatchObject({
      changed: true,
      state: "not_installed",
    });
    expect((await getInstallStatus(context)).state).toBe("not_installed");
  });

  it("resolves user scope beneath an injected home directory", async () => {
    const context = await fixture("opencode");
    context.scope = "user";
    expect(path.relative(context.homeRoot, resolveInstallTarget(context))).toBe(
      ".config/opencode/skills/brand-visual-designer",
    );
  });
});
