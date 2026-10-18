import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest, QualityReport } from "@brand-visual/schemas";
import {
  formatValidationErrors,
  validateManifest,
  validateQualityReport,
} from "@brand-visual/schemas";
import { BrandVisualError } from "./errors.js";

export interface ValidateTaskResult {
  taskId: string;
  status: "passed" | "needs_review";
  checkedArtifacts: number;
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function validateTask(
  taskDirectory: string,
): Promise<ValidateTaskResult> {
  let manifest: Manifest;
  try {
    manifest = JSON.parse(
      await readFile(path.join(taskDirectory, "manifest.json"), "utf8"),
    );
  } catch (error) {
    throw new BrandVisualError("IO_ERROR", "无法读取任务 manifest", {
      cause: error,
    });
  }

  const manifestValidation = validateManifest(manifest);
  if (!manifestValidation.valid) {
    throw new BrandVisualError("SCHEMA_INVALID", "manifest 不符合 schema", {
      details: { errors: formatValidationErrors(manifestValidation.errors) },
    });
  }

  for (const artifact of manifest.artifacts) {
    let bytes: Uint8Array;
    try {
      bytes = await readFile(path.join(taskDirectory, artifact.path));
    } catch (error) {
      throw new BrandVisualError("ASSET_MISSING", "manifest 中的产物不存在", {
        cause: error,
        details: { path: artifact.path },
      });
    }
    if (sha256(bytes) !== artifact.sha256) {
      throw new BrandVisualError(
        "QUALITY_FAILED",
        "产物哈希与 manifest 不一致",
        {
          details: { path: artifact.path },
        },
      );
    }
  }

  const qualityReport = JSON.parse(
    await readFile(path.join(taskDirectory, "quality-report.json"), "utf8"),
  ) as QualityReport;
  const qualityValidation = validateQualityReport(qualityReport);
  if (!qualityValidation.valid) {
    throw new BrandVisualError(
      "SCHEMA_INVALID",
      "quality report 不符合 schema",
      {
        details: { errors: formatValidationErrors(qualityValidation.errors) },
      },
    );
  }

  return {
    taskId: manifest.taskId,
    status: qualityReport.status === "needs_review" ? "needs_review" : "passed",
    checkedArtifacts: manifest.artifacts.length,
  };
}
