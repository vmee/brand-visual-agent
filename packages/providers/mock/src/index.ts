import type {
  GeneratedImage,
  ImageProvider,
  ProviderCapabilities,
} from "@brand-visual/core";
import type { DesignSpec } from "@brand-visual/schemas";

// Valid 1x1 transparent PNG. It is deliberately marked as Mock in every result and manifest.
const MOCK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3Zk9WQAAAABJRU5ErkJggg==",
  "base64",
);

export class MockImageProvider implements ImageProvider {
  async probe(): Promise<ProviderCapabilities> {
    return {
      id: "mock",
      snapshotId: "mock-m1-v1",
      mock: true,
      verifiedAt: "2026-10-18T00:00:00.000Z",
      generate: true,
      edit: false,
      outputFormats: ["png"],
    };
  }

  async generate(spec: DesignSpec, variantId: string): Promise<GeneratedImage> {
    return {
      bytes: MOCK_PNG,
      mimeType: "image/png",
      extension: "png",
      metadata: {
        mock: true,
        taskId: spec.task.id,
        variantId,
        note: "Protocol fixture only; not a deliverable visual",
      },
    };
  }
}
