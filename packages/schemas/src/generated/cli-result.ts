/* Generated from JSON Schema. Do not edit directly. */

export type CliResult =
  | {
      schemaVersion: "1.0.0-draft";
      ok: true;
      command: string;
      status: "passed" | "completed" | "needs_review";
      data: {
        [k: string]: unknown;
      };
    }
  | {
      schemaVersion: "1.0.0-draft";
      ok: false;
      error: {
        code: string;
        message: string;
        retryable: boolean;
        details?: {
          [k: string]: unknown;
        };
      };
    };
