import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mapAmcPayloadToManusRenderPackageV1, type AmcLivePayload } from "../src/mapAmcToManusRenderPackage";
import { validateAmcManusRenderPackageV1 } from "../src/validateAmcManusRenderPackage";

type CliArgs = {
  schemaPath: string;
  singlePayloadPath: string;
  comparativePayloadPath: string;
  outDir: string;
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

  const singleValidation = validateAmcManusRenderPackageV1(schema, singleMapped);
  const comparativeValidation = validateAmcManusRenderPackageV1(schema, comparativeMapped);
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
