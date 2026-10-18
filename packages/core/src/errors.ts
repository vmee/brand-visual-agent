export type ErrorCode =
  | "CONFIG_INVALID"
  | "SCHEMA_INVALID"
  | "ASSET_MISSING"
  | "CAPABILITY_UNSUPPORTED"
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "RENDER_FAILED"
  | "QUALITY_FAILED"
  | "IO_ERROR"
  | "PATH_OUTSIDE_WORKSPACE"
  | "OUTPUT_CONFLICT"
  | "COMMAND_INVALID";

export class BrandVisualError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "BrandVisualError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}
