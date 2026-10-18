import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DesignSpec,
  Manifest,
  QualityReport,
} from "@brand-visual/schemas";
import { SCHEMA_VERSION } from "@brand-visual/schemas";
import { BrandVisualError } from "./errors.js";
import type { ImageProvider } from "./provider.js";

interface GenerateTaskOptions {
  spec: DesignSpec;
  provider: ImageProvider;
  workspaceRoot: string;
  outputDirectory: string;
  now?: () => Date;
}

export interface GenerateTaskResult {
  taskId: string;
  status: "needs_review";
  outputDirectory: string;
  manifestPath: string;
  qualityReportPath: string;
  artifacts: string[];
}

function sha256(content: Uint8Array | string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(
  filePath: string,
  value: unknown,
): Promise<Uint8Array> {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  await writeFile(filePath, bytes);
  return bytes;
}

export async function generateTask(
  options: GenerateTaskOptions,
): Promise<GenerateTaskResult> {
  const { spec, provider, workspaceRoot, outputDirectory } = options;
  if (await pathExists(outputDirectory)) {
    throw new BrandVisualError("OUTPUT_CONFLICT", "输出目录已存在，拒绝覆盖", {
      details: {
        outputDirectory: path.relative(workspaceRoot, outputDirectory),
      },
    });
  }

  const temporaryRoot = path.join(workspaceRoot, ".brand-visual-cache", "runs");
  const temporaryDirectory = path.join(
    temporaryRoot,
    `${spec.task.id}-${randomUUID()}`,
  );
  const artifacts: Manifest["artifacts"] = [];

  try {
    await mkdir(path.join(temporaryDirectory, "variants"), { recursive: true });
    await mkdir(path.join(temporaryDirectory, "specs"), { recursive: true });
    await mkdir(path.join(temporaryDirectory, "logs"), { recursive: true });

    const capabilities = await provider.probe();
    if (!capabilities.generate) {
      throw new BrandVisualError(
        "CAPABILITY_UNSUPPORTED",
        "当前 Provider 不支持生成",
        {
          details: { provider: capabilities.id },
        },
      );
    }

    for (const variant of spec.variants) {
      const generated = await provider.generate(spec, variant.id);
      const imagePath = `variants/${variant.id}.${generated.extension}`;
      await writeFile(
        path.join(temporaryDirectory, imagePath),
        generated.bytes,
      );
      artifacts.push({
        path: imagePath,
        sha256: sha256(generated.bytes),
        kind: "image",
      });

      const variantSpec = { ...spec, variants: [variant] };
      const specPath = `specs/${variant.id}.json`;
      const specBytes = await writeJson(
        path.join(temporaryDirectory, specPath),
        variantSpec,
      );
      artifacts.push({
        path: specPath,
        sha256: sha256(specBytes),
        kind: "spec",
      });
    }

    const qualityReport: QualityReport = {
      schemaVersion: SCHEMA_VERSION,
      status: "needs_review",
      checks: [
        {
          id: "provider.mock",
          status: "needs_review",
          message: "M1 Mock Provider 产物仅用于验证协议，不是可交付视觉作品",
          evidence: {
            provider: capabilities.id,
            snapshotId: capabilities.snapshotId,
          },
        },
      ],
    };
    const qualityPath = "quality-report.json";
    const qualityBytes = await writeJson(
      path.join(temporaryDirectory, qualityPath),
      qualityReport,
    );
    artifacts.push({
      path: qualityPath,
      sha256: sha256(qualityBytes),
      kind: "quality-report",
    });

    const createdAt = (options.now ?? (() => new Date()))().toISOString();
    const runSummary = {
      schemaVersion: SCHEMA_VERSION,
      taskId: spec.task.id,
      provider: capabilities.id,
      mock: capabilities.mock,
      status: "needs_review",
      createdAt,
    };
    const summaryPath = "logs/run-summary.json";
    const summaryBytes = await writeJson(
      path.join(temporaryDirectory, summaryPath),
      runSummary,
    );
    artifacts.push({
      path: summaryPath,
      sha256: sha256(summaryBytes),
      kind: "run-summary",
    });

    const manifest: Manifest = {
      schemaVersion: SCHEMA_VERSION,
      taskId: spec.task.id,
      status: "needs_review",
      provider: {
        id: capabilities.id,
        mock: capabilities.mock,
        capabilitySnapshotId: capabilities.snapshotId,
      },
      createdAt,
      artifacts,
    };
    await writeJson(path.join(temporaryDirectory, "manifest.json"), manifest);

    await mkdir(path.dirname(outputDirectory), { recursive: true });
    await rename(temporaryDirectory, outputDirectory);

    return {
      taskId: spec.task.id,
      status: "needs_review",
      outputDirectory,
      manifestPath: path.join(outputDirectory, "manifest.json"),
      qualityReportPath: path.join(outputDirectory, qualityPath),
      artifacts: artifacts.map((artifact) =>
        path.join(outputDirectory, artifact.path),
      ),
    };
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    if (error instanceof BrandVisualError) throw error;
    throw new BrandVisualError("IO_ERROR", "生成 Mock 任务时发生 I/O 错误", {
      cause: error,
    });
  }
}
