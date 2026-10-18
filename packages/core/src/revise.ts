import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DesignSpec } from "@brand-visual/schemas";
import { BrandVisualError } from "./errors.js";
import { composeArtwork } from "./composer.js";

export interface ReviseTaskOptions {
  spec: DesignSpec;
  taskDirectory: string;
  patch: {
    operations: Array<{
      op: "replaceText" | "updateStyle" | "moveLayer" | "setVisibility";
      layerId: string;
      value: any;
    }>;
  };
  workspaceRoot: string;
}

export interface ReviseTaskResult {
  taskId: string;
  status: "completed";
  revisedArtifacts: string[];
}

export async function reviseTask(
  options: ReviseTaskOptions,
): Promise<ReviseTaskResult> {
  const { spec, taskDirectory, patch, workspaceRoot } = options;

  // 1. 克隆 spec 并在内存中应用图层微调操作（零重绘底图）
  const updatedSpec: DesignSpec = JSON.parse(JSON.stringify(spec));

  for (const operation of patch.operations) {
    const targetLayer = updatedSpec.layers.find(
      (layer) => layer.id === operation.layerId,
    );
    if (!targetLayer) {
      throw new BrandVisualError(
        "SCHEMA_INVALID",
        `修订失败：未找到目标图层 ${operation.layerId}`,
      );
    }

    switch (operation.op) {
      case "replaceText":
        targetLayer.content = String(operation.value);
        break;
      case "updateStyle":
        targetLayer.style = {
          ...(targetLayer.style ?? {}),
          ...operation.value,
        };
        break;
      case "moveLayer":
        targetLayer.frame = {
          ...(targetLayer.frame ?? {}),
          ...operation.value,
        };
        break;
      case "setVisibility":
        targetLayer.visible = Boolean(operation.value);
        break;
      default:
        throw new BrandVisualError(
          "COMMAND_INVALID",
          `不支持的操作类型: ${(operation as any).op}`,
        );
    }
  }

  // 2. 遍历现有 variants，复用现有底图秒级重新排版
  const revisedArtifacts: string[] = [];

  for (const variant of updatedSpec.variants) {
    // 优先读取未被排版污染的原始纯净底图
    const rawImagePath = path.join(
      taskDirectory,
      `raw-backgrounds/${variant.id}.png`,
    );
    const originalImagePath = path.join(
      taskDirectory,
      `variants/${variant.id}.png`,
    );
    let baseImageBytes: Buffer;
    try {
      baseImageBytes = await readFile(rawImagePath);
    } catch {
      try {
        baseImageBytes = await readFile(originalImagePath);
      } catch {
        throw new BrandVisualError(
          "IO_ERROR",
          `无法读取变体底图: ${rawImagePath}`,
        );
      }
    }

    const composedBytes = await composeArtwork({
      spec: updatedSpec,
      variantId: variant.id,
      baseImageBytes,
      workspaceRoot,
    });

    await writeFile(originalImagePath, composedBytes);
    revisedArtifacts.push(`variants/${variant.id}.png`);

    const specPath = path.join(taskDirectory, `specs/${variant.id}.json`);
    await writeFile(
      specPath,
      Buffer.from(
        `${JSON.stringify({ ...updatedSpec, variants: [variant] }, null, 2)}\n`,
        "utf8",
      ),
    );
    revisedArtifacts.push(`specs/${variant.id}.json`);
  }

  return {
    taskId: spec.task.id,
    status: "completed",
    revisedArtifacts,
  };
}
