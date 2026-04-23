import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mapAmcPayloadToManusRenderPackageV1, type AmcLivePayload } from "../src/mapAmcToManusRenderPackage";

type CliArgs = {
  schemaPath: string;
  singlePayloadPath: string;
  comparativePayloadPath: string;
  outDir: string;
};

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function parseArgs(argv: string[]): CliArgs {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");

  const args: CliArgs = {
    schemaPath: path.resolve(repoRoot, "schemas", "amc_manus_render.schema.json"),
    singlePayloadPath: path.resolve(repoRoot, "manus-ui", "output", "amc_docx_payload_batch9_single_baseline.json"),
    comparativePayloadPath: path.resolve(
      repoRoot,
      "manus-ui",
      "output",
      "amc_docx_payload_batch9_comparative_baseline.json",
    ),
    outDir: path.resolve(repoRoot, "output", "manus_render_contract_v1"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--schema" && next) {
      args.schemaPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token === "--single" && next) {
      args.singlePayloadPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token === "--comparative" && next) {
      args.comparativePayloadPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token === "--out-dir" && next) {
      args.outDir = path.resolve(next);
      i += 1;
      continue;
    }
  }

  return args;
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function resolveRef(rootSchema: any, ref: string): any {
  if (!ref.startsWith("#/")) {
    throw new Error(`Unsupported $ref '${ref}'`);
  }
  const parts = ref.slice(2).split("/");
  let cursor = rootSchema;
  for (const part of parts) {
    cursor = cursor?.[part];
  }
  if (!cursor) {
    throw new Error(`Could not resolve $ref '${ref}'`);
  }
  return cursor;
}

function validateNode(value: any, schemaNode: any, rootSchema: any, pathKey: string, errors: string[]): void {
  if (!schemaNode) {
    return;
  }
  if (schemaNode.$ref) {
    validateNode(value, resolveRef(rootSchema, schemaNode.$ref), rootSchema, pathKey, errors);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(schemaNode, "const") && value !== schemaNode.const) {
    errors.push(`${pathKey}: expected const '${schemaNode.const}', got '${String(value)}'`);
    return;
  }

  if (schemaNode.enum && Array.isArray(schemaNode.enum) && !schemaNode.enum.includes(value)) {
    errors.push(`${pathKey}: value '${String(value)}' not in enum`);
    return;
  }

  const type = schemaNode.type;
  if (type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${pathKey}: expected object`);
      return;
    }
    const required = Array.isArray(schemaNode.required) ? schemaNode.required : [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${pathKey}: missing required key '${key}'`);
      }
    }
    const properties = schemaNode.properties || {};
    if (schemaNode.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          errors.push(`${pathKey}: unexpected key '${key}'`);
        }
      }
    }
    for (const [key, child] of Object.entries(properties)) {
      if (key in value) {
        validateNode((value as any)[key], child, rootSchema, `${pathKey}.${key}`, errors);
      }
    }
    return;
  }

  if (type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${pathKey}: expected array`);
      return;
    }
    if (typeof schemaNode.minItems === "number" && value.length < schemaNode.minItems) {
      errors.push(`${pathKey}: minItems ${schemaNode.minItems} violated`);
    }
    if (typeof schemaNode.maxItems === "number" && value.length > schemaNode.maxItems) {
      errors.push(`${pathKey}: maxItems ${schemaNode.maxItems} violated`);
    }
    if (schemaNode.items) {
      value.forEach((item: any, index: number) => {
        validateNode(item, schemaNode.items, rootSchema, `${pathKey}[${index}]`, errors);
      });
    }
    return;
  }

  if (type === "string") {
    if (typeof value !== "string") {
      errors.push(`${pathKey}: expected string`);
      return;
    }
    if (typeof schemaNode.minLength === "number" && value.length < schemaNode.minLength) {
      errors.push(`${pathKey}: minLength ${schemaNode.minLength} violated`);
    }
    return;
  }

  if (type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`${pathKey}: expected number`);
      return;
    }
    if (typeof schemaNode.minimum === "number" && value < schemaNode.minimum) {
      errors.push(`${pathKey}: minimum ${schemaNode.minimum} violated`);
    }
    if (typeof schemaNode.maximum === "number" && value > schemaNode.maximum) {
      errors.push(`${pathKey}: maximum ${schemaNode.maximum} violated`);
    }
    return;
  }

  if (type === "boolean" && typeof value !== "boolean") {
    errors.push(`${pathKey}: expected boolean`);
  }
}

function validateAgainstSchema(schema: any, instance: any): ValidationResult {
  const errors: string[] = [];
  validateNode(instance, schema, schema, "$", errors);
  return { valid: errors.length === 0, errors };
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const schema = readJson(args.schemaPath);
  const singleSource = readJson(args.singlePayloadPath) as AmcLivePayload;
  const comparativeSource = readJson(args.comparativePayloadPath) as AmcLivePayload;

  const singleMapped = mapAmcPayloadToManusRenderPackageV1(singleSource, {
    reportId: "amc-manus-single-v1",
    language: "en",
    templateBaselinePath: "templates/AMC_Strategic_Career_Decision_Template_v3_4_working.docx",
  });
  const comparativeMapped = mapAmcPayloadToManusRenderPackageV1(comparativeSource, {
    reportId: "amc-manus-comparative-v1",
    language: "en",
    templateBaselinePath: "templates/AMC_Strategic_Career_Decision_Template_v3_4_working.docx",
  });

  const singleOutPath = path.join(args.outDir, "amc_manus_render_single_generated_v1.json");
  const comparativeOutPath = path.join(args.outDir, "amc_manus_render_comparative_generated_v1.json");
  const validationOutPath = path.join(args.outDir, "validation_summary_v1.json");

  writeJson(singleOutPath, singleMapped);
  writeJson(comparativeOutPath, comparativeMapped);

  const singleValidation = validateAgainstSchema(schema, singleMapped);
  const comparativeValidation = validateAgainstSchema(schema, comparativeMapped);
  const summary = {
    schemaPath: args.schemaPath,
    generatedAt: new Date().toISOString(),
    single: {
      source: args.singlePayloadPath,
      output: singleOutPath,
      valid: singleValidation.valid,
      errors: singleValidation.errors,
    },
    comparative: {
      source: args.comparativePayloadPath,
      output: comparativeOutPath,
      valid: comparativeValidation.valid,
      errors: comparativeValidation.errors,
    },
  };
  writeJson(validationOutPath, summary);

  console.log(`Generated: ${singleOutPath}`);
  console.log(`Generated: ${comparativeOutPath}`);
  console.log(`Validation summary: ${validationOutPath}`);
  console.log(`Single valid: ${singleValidation.valid}`);
  console.log(`Comparative valid: ${comparativeValidation.valid}`);
  if (!singleValidation.valid) {
    for (const error of singleValidation.errors) {
      console.error(`SINGLE ERROR: ${error}`);
    }
  }
  if (!comparativeValidation.valid) {
    for (const error of comparativeValidation.errors) {
      console.error(`COMPARATIVE ERROR: ${error}`);
    }
  }

  return singleValidation.valid && comparativeValidation.valid ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });

