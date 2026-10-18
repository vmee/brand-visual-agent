/* Generated from JSON Schema. Do not edit directly. */

export interface DesignSpec {
  schemaVersion: "1.0.0-draft";
  task: {
    id: string;
    intent: string;
    locale: string;
    requestedBy?: string;
    revisionOf?: string;
  };
  brand: {
    profile: string;
    requiredRules?: string[];
    facts?: string[];
  };
  canvas: {
    width: number;
    height: number;
    pixelRatio?: number;
    background: string;
    colorSpace?: string;
  };
  creative: {
    mode: string;
    brief: string;
    negativeConstraints?: string[];
    [k: string]: unknown;
  };
  assets: {
    id: string;
    role: string;
    source: string;
    sha256: string;
    protection:
      "exact" | "crop-only" | "reference-only" | "generative-edit-allowed";
    rightsReview: "approved" | "required" | "unknown";
  }[];
  layers: {
    id: string;
    type: "image" | "text" | "shape" | "group";
    zIndex: number;
    visible?: boolean;
    frame: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    content?: string;
    style?: {
      [k: string]: unknown;
    };
    source?: {
      [k: string]: unknown;
    };
    constraints?: {
      [k: string]: unknown;
    };
    opacity?: number;
    rotation?: number;
    blendMode?: string;
  }[];
  /**
   * @minItems 1
   */
  variants: [
    {
      id: string;
      [k: string]: unknown;
    },
    ...{
      id: string;
      [k: string]: unknown;
    }[],
  ];
  quality: {
    requiredChecks: string[];
    manualChecks: string[];
  };
  output: {
    directory: string;
    format: "png";
    separateVariantFiles: true;
  };
}
