import {
  Ajv2020,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import cliResultSchema from "./schemas/cli-result.schema.json" with { type: "json" };
import designSpecSchema from "./schemas/design-spec.schema.json" with { type: "json" };
import manifestSchema from "./schemas/manifest.schema.json" with { type: "json" };
import qualityReportSchema from "./schemas/quality-report.schema.json" with { type: "json" };

export type { CliResult } from "./generated/cli-result.js";
export type { DesignSpec } from "./generated/design-spec.js";
export type { Manifest } from "./generated/manifest.js";
export type { QualityReport } from "./generated/quality-report.js";

export const SCHEMA_VERSION = "1.0.0-draft" as const;

const ajv = new Ajv2020({ allErrors: true, strict: true });

const validators = {
  cliResult: ajv.compile(cliResultSchema),
  designSpec: ajv.compile(designSpecSchema),
  manifest: ajv.compile(manifestSchema),
  qualityReport: ajv.compile(qualityReportSchema),
} satisfies Record<string, ValidateFunction>;

export const schemas = {
  cliResult: cliResultSchema,
  designSpec: designSpecSchema,
  manifest: manifestSchema,
  qualityReport: qualityReportSchema,
};

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

function runValidation(
  validator: ValidateFunction,
  value: unknown,
): ValidationResult {
  const valid = validator(value);
  return {
    valid,
    errors: valid ? [] : structuredClone(validator.errors ?? []),
  };
}

export function validateCliResult(value: unknown): ValidationResult {
  return runValidation(validators.cliResult, value);
}

export function validateDesignSpec(value: unknown): ValidationResult {
  return runValidation(validators.designSpec, value);
}

export function validateManifest(value: unknown): ValidationResult {
  return runValidation(validators.manifest, value);
}

export function validateQualityReport(value: unknown): ValidationResult {
  return runValidation(validators.qualityReport, value);
}

export function formatValidationErrors(
  errors: ErrorObject[],
): Array<Record<string, unknown>> {
  return errors.map((error) => ({
    instancePath: error.instancePath,
    keyword: error.keyword,
    message: error.message ?? "schema validation failed",
    params: error.params,
  }));
}
