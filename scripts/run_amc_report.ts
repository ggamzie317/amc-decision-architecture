import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateAmcReport } from "../src/generateAmcReport";

type CliArgs = {
  intake: string;
  template: string;
  out: string;
  payload: string;
  python: string;
  strictUndeclared: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultTemplate =
    process.env.AMC_TEMPLATE_PATH ||
    path.resolve(scriptDir, "..", "templates", "AMC_Strategic_Career_Decision_Template_v3_3.docx");

  const args: CliArgs = {
    intake: "examples/amc_sample_single.json",
    template: defaultTemplate,
    out: "output/AMC_Report_Runner.docx",
    payload: "output/amc_docx_payload_latest.json",
    python: "python3",
    strictUndeclared: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--intake" && next) {
      args.intake = next;
      i += 1;
      continue;
    }
    if (token === "--template" && next) {
      args.template = next;
      i += 1;
      continue;
    }
    if (token === "--out" && next) {
      args.out = next;
      i += 1;
      continue;
    }
    if (token === "--payload" && next) {
      args.payload = next;
      i += 1;
      continue;
    }
    if (token === "--python" && next) {
      args.python = next;
      i += 1;
      continue;
    }
    if (token === "--strict-undeclared") {
      args.strictUndeclared = true;
      continue;
    }
    if (token === "-h" || token === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp(): void {
  console.log("AMC report runner");
  console.log("Usage:");
  console.log("  pnpm --dir manus-ui exec tsx ../scripts/run_amc_report.ts [options]");
  console.log("Options:");
  console.log("  --intake <path>    Raw intake JSON path (default: examples/amc_sample_single.json)");
  console.log("  --template <path>  DOCX template path (default: $AMC_TEMPLATE_PATH or repo templates/v3_3 path)");
  console.log("  --out <path>       Output DOCX path (default: output/AMC_Report_Runner.docx)");
  console.log("  --payload <path>   Intermediate flat payload JSON path (default: output/amc_docx_payload_latest.json)");
  console.log("  --python <bin>     Python executable for merge_docx.py (default: python3)");
  console.log("  --strict-undeclared  Fail render if undeclared template variables remain");
}

function readJson(filePath: string): any {
  const text = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(text);
}

function assertPathExists(filePath: string, label: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));

    assertPathExists(args.intake, "Intake file");
    assertPathExists(args.template, "Template file");

    const rawIntake = readJson(args.intake);

    const result = generateAmcReport(rawIntake, {
      templatePath: args.template,
      outPath: args.out,
      payloadPath: args.payload,
      pythonBin: args.python,
      strictUndeclared: args.strictUndeclared,
    });

    const summary = {
      reportType: result.docxPayload.meta.reportType,
      generatedAt: result.docxPayload.meta.generatedAt,
      caseType: result.docxPayload.meta.caseType,
      sectionCount: result.docxPayload.reportPayload.sections.length,
    };

    console.log("AMC report generation succeeded.");
    console.log(`TEMPLATE: ${args.template}`);
    console.log(`INTAKE: ${args.intake}`);
    console.log(`PAYLOAD: ${result.payloadPath}`);
    console.log(`DOCX: ${result.outPath}`);
    console.log(`SUMMARY: ${JSON.stringify(summary)}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AMC report generation failed.");
    console.error(`ERROR: ${message}`);
    return 1;
  }
}

const isDirectRun = (() => {
  const thisPath = fileURLToPath(import.meta.url);
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return path.resolve(thisPath) === entry;
})();

if (isDirectRun) {
  process.exit(main());
}
