/* Generated from JSON Schema. Do not edit directly. */

export interface Manifest {
  schemaVersion: "1.0.0-draft";
  taskId: string;
  status: "completed" | "failed" | "needs_review";
  provider: {
    id: string;
    mock: boolean;
    capabilitySnapshotId: string;
  };
  createdAt: string;
  artifacts: {
    path: string;
    sha256: string;
    kind: "image" | "spec" | "quality-report" | "run-summary";
  }[];
}
