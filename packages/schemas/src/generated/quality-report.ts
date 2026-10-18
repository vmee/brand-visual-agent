/* Generated from JSON Schema. Do not edit directly. */

export interface QualityReport {
  schemaVersion: "1.0.0-draft";
  status: "passed" | "failed" | "needs_review";
  checks: {
    id: string;
    status: "passed" | "failed" | "needs_review";
    message?: string;
    evidence?: {
      [k: string]: unknown;
    };
  }[];
}
