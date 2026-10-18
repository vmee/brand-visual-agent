import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateDesignSpec } from "@brand-visual/schemas";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

describe("DesignSpec schema", () => {
  it.each([
    "examples/design-spec.example.json",
    "tests/fixtures/m1/design-spec.json",
  ])("accepts %s", async (relativePath) => {
    const value = JSON.parse(
      await readFile(path.join(repositoryRoot, relativePath), "utf8"),
    );
    expect(validateDesignSpec(value)).toEqual({ valid: true, errors: [] });
  });

  it("rejects a missing schema version", async () => {
    const value = JSON.parse(
      await readFile(
        path.join(repositoryRoot, "tests/fixtures/m1/design-spec.json"),
        "utf8",
      ),
    );
    delete value.schemaVersion;
    const result = validateDesignSpec(value);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
