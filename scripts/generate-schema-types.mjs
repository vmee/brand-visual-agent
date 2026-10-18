import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";
import { format } from "prettier";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const schemaDirectory = path.join(
  repositoryRoot,
  "packages/schemas/src/schemas",
);
const outputDirectory = path.join(
  repositoryRoot,
  "packages/schemas/src/generated",
);
const schemaFiles = [
  "design-spec.schema.json",
  "cli-result.schema.json",
  "manifest.schema.json",
  "quality-report.schema.json",
];

await mkdir(outputDirectory, { recursive: true });

for (const schemaFile of schemaFiles) {
  const schemaPath = path.join(schemaDirectory, schemaFile);
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const typeName = schema.title.replaceAll(/[^A-Za-z0-9]/g, "");
  const generated = await compile(schema, typeName, {
    bannerComment: "/* Generated from JSON Schema. Do not edit directly. */",
    style: { singleQuote: false },
  });
  const output = await format(generated, { parser: "typescript" });
  const outputName = schemaFile.replace(".schema.json", ".ts");
  await writeFile(path.join(outputDirectory, outputName), output, "utf8");
}
