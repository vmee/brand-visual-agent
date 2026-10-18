import type { DesignSpec } from "@brand-visual/schemas";

export interface ProviderCapabilities {
  id: string;
  snapshotId: string;
  mock: boolean;
  verifiedAt: string;
  generate: boolean;
  edit: boolean;
  outputFormats: string[];
}

export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: "image/png";
  extension: "png";
  metadata: Record<string, unknown>;
}

export interface ImageProvider {
  probe(): Promise<ProviderCapabilities>;
  generate(spec: DesignSpec, variantId: string): Promise<GeneratedImage>;
}
