import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import type { DesignSpec } from "@brand-visual/schemas";
import { BrandVisualError } from "./errors.js";

interface ComposeOptions {
  spec: DesignSpec;
  variantId: string;
  baseImageBytes: Uint8Array;
  workspaceRoot: string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  // 简易 CJK 自动换行算法：CJK 字符计 1 个字宽，ASCII 计 0.55 个字宽
  const lines: string[] = [];
  let currentLine = "";
  let currentWidth = 0;

  for (const char of text) {
    const charWidth = char.charCodeAt(0) > 255 ? fontSize : fontSize * 0.55;
    if (currentWidth + charWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
    } else {
      currentLine += char;
      currentWidth += charWidth;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

export async function composeArtwork(options: ComposeOptions): Promise<Buffer> {
  const { spec, baseImageBytes, workspaceRoot } = options;
  const canvasWidth = spec.canvas.width;
  const canvasHeight = spec.canvas.height;

  // 1. 调整底图尺寸填充满画布
  let basePipeline = sharp(baseImageBytes).resize(canvasWidth, canvasHeight, {
    fit: "cover",
    position: "center",
  });

  const composites: OverlayOptions[] = [];

  // 2. 按 zIndex 顺序遍历图层合成
  const sortedLayers = [...spec.layers].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  for (const layer of sortedLayers) {
    if (layer.visible === false) continue;

    // 2.1 Logo / 资产图片图层
    if (layer.type === "image" && layer.source && "assetId" in layer.source) {
      const assetDef = spec.assets.find(
        (a) => a.id === (layer.source as any).assetId,
      );
      if (!assetDef) {
        throw new BrandVisualError(
          "ASSET_MISSING",
          `未找到指定资产: ${(layer.source as any).assetId}`,
        );
      }
      const assetFullPath = path.resolve(workspaceRoot, assetDef.source);
      const assetRaw = await readFile(assetFullPath);

      const frameWidth = Math.round(layer.frame.width);
      const frameHeight = Math.round(layer.frame.height);

      const resizedAsset = await sharp(assetRaw)
        .resize(frameWidth, frameHeight, {
          fit: layer.constraints?.preserveAspectRatio ? "inside" : "fill",
        })
        .toBuffer();

      composites.push({
        input: resizedAsset,
        left: Math.round(layer.frame.x),
        top: Math.round(layer.frame.y),
      });
    }

    // 2.2 确定性 Shape 图层（半透明背板、遮罩卡片、圆角矩形）
    if (layer.type === "shape") {
      const frameWidth = Math.round(layer.frame.width);
      const frameHeight = Math.round(layer.frame.height);
      const fill = (layer.style as any)?.fill ?? "rgba(255, 255, 255, 0.85)";
      const borderRadius = (layer.style as any)?.borderRadius ?? 16;
      const opacity = typeof layer.opacity === "number" ? layer.opacity : 1;

      const shapeSvg = `
        <svg width="${frameWidth}" height="${frameHeight}" viewBox="0 0 ${frameWidth} ${frameHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${frameWidth}" height="${frameHeight}" rx="${borderRadius}" ry="${borderRadius}" fill="${fill}" opacity="${opacity}" />
        </svg>
      `;

      composites.push({
        input: Buffer.from(shapeSvg),
        left: Math.round(layer.frame.x),
        top: Math.round(layer.frame.y),
      });
    }

    // 2.3 确定性中文文本图层（带自动换行与行高）
    if (layer.type === "text" && layer.content) {
      const fontSize =
        typeof layer.style?.fontSize === "number" ? layer.style.fontSize : 64;
      const lineHeightMultiplier =
        typeof layer.style?.lineHeight === "number"
          ? layer.style.lineHeight
          : 1.25;
      const lineHeightPx = Math.round(fontSize * lineHeightMultiplier);
      const color = layer.style?.color ?? "#000000";
      const fontFamily =
        "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
      const frameWidth = Math.round(layer.frame.width);
      const frameHeight = Math.round(layer.frame.height);

      const lines = wrapText(layer.content, fontSize, frameWidth);

      const tspans = lines
        .map((line, idx) => {
          const y = fontSize + idx * lineHeightPx;
          return `<tspan x="0" y="${y}">${escapeXml(line)}</tspan>`;
        })
        .join("\n");

      const textSvg = `
        <svg width="${frameWidth}" height="${frameHeight}" viewBox="0 0 ${frameWidth} ${frameHeight}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .headline {
              font-family: ${fontFamily};
              font-size: ${fontSize}px;
              font-weight: ${layer.style?.fontWeight ?? 700};
              fill: ${color};
            }
          </style>
          <text class="headline">${tspans}</text>
        </svg>
      `;

      composites.push({
        input: Buffer.from(textSvg),
        left: Math.round(layer.frame.x),
        top: Math.round(layer.frame.y),
      });
    }
  }

  // 3. 执行最终合成
  return basePipeline.composite(composites).png().toBuffer();
}
