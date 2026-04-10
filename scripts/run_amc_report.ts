import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateAmcReport } from "../src/generateAmcReport";
import { toExternalSnapshotOverride, normalizeExternalLayerContractV1 } from "../src/perplexity/externalLayerContract";
import { resolvePerplexityExternalSnapshot } from "../src/perplexity/resolveAmcExternalSnapshot";

type CliArgs = {
  intake: string;
  template: string;
  out: string;
  payload: string;
  python: string;
  strictUndeclared: boolean;
  externalLayer?: string;
  lang?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const defaultTemplate =
    process.env.AMC_TEMPLATE_PATH ||
    path.resolve(repoRoot, "templates", "AMC_Strategic_Career_Decision_Template_v3_4_working.docx");

  const args: CliArgs = {
    intake: path.resolve(repoRoot, "examples", "amc_sample_single.json"),
    template: defaultTemplate,
    out: path.resolve(repoRoot, "output", "AMC_Report_Runner.docx"),
    payload: path.resolve(repoRoot, "output", "amc_docx_payload_latest.json"),
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
    if (token === "--comparative") {
      args.intake = path.resolve(repoRoot, "examples", "amc_sample_comparative.json");
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
    if (token === "--external-layer" && next) {
      args.externalLayer = next;
      i += 1;
      continue;
    }
    if (token === "--lang" && next) {
      args.lang = next;
      i += 1;
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
  console.log("  --intake <path>    Raw intake JSON path (default: repo examples/amc_sample_single.json)");
  console.log("  --comparative      Use repo examples/amc_sample_comparative.json");
  console.log("  --template <path>  DOCX template path (default: $AMC_TEMPLATE_PATH or repo templates/v3_4 working path)");
  console.log("  --out <path>       Output DOCX path (default: repo output/AMC_Report_Runner.docx)");
  console.log("  --payload <path>   Intermediate payload JSON path (default: repo output/amc_docx_payload_latest.json)");
  console.log("  --python <bin>     Python executable for merge_docx.py (default: python3)");
  console.log("  --strict-undeclared  Fail render if undeclared template variables remain");
  console.log("  --external-layer <path>  Optional contract-v1 external layer JSON (preferred automation hookup path)");
  console.log("  --lang <ko|en|zh>  Locale for fixed render strings (default: intake.lang or en)");
  console.log("Environment (optional external intelligence):");
  console.log("  AMC_ENABLE_PERPLEXITY_EXTERNAL=1    Enable Perplexity external snapshot override");
  console.log("  PERPLEXITY_API_KEY=<key>            Required when external override is enabled");
  console.log("  AMC_PERPLEXITY_DOMAIN_FILTER=<csv>  Optional domain filter (e.g. reuters.com,bloomberg.com)");
  console.log("  AMC_PERPLEXITY_LANG=<ko|en|zh>      Optional language hint for Perplexity summaries");
  console.log("  PERPLEXITY_MODEL=<name>             Optional model override (default: sonar)");
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

async function main(): Promise<number> {
  try {
    const args = parseArgs(process.argv.slice(2));

    assertPathExists(args.intake, "Intake file");
    assertPathExists(args.template, "Template file");

    const rawIntake = readJson(args.intake);
    let overrideSource: "contract_file" | "perplexity_live" | "internal" = "internal";
    let externalSnapshotOverride: ReturnType<typeof toExternalSnapshotOverride> | undefined;
    const integrationWarnings: string[] = [];

    if (args.externalLayer) {
      assertPathExists(args.externalLayer, "External layer file");
      try {
        const rawExternal = readJson(args.externalLayer);
        const normalized = normalizeExternalLayerContractV1(rawExternal);
        externalSnapshotOverride = toExternalSnapshotOverride(normalized);
        overrideSource = "contract_file";
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        integrationWarnings.push(
          `External layer file could not be normalized to contract v1 (${message}); using internal/perplexity fallback.`,
        );
      }
    }

    if (!externalSnapshotOverride) {
      const perplexityExternal = await resolvePerplexityExternalSnapshot(rawIntake, {});
      if (perplexityExternal.override) {
        externalSnapshotOverride = perplexityExternal.override;
        overrideSource = "perplexity_live";
      }
      integrationWarnings.push(...perplexityExternal.warnings);
    }

    const result = generateAmcReport(rawIntake, {
      templatePath: args.template,
      outPath: args.out,
      payloadPath: args.payload,
      pythonBin: args.python,
      strictUndeclared: args.strictUndeclared,
      locale: args.lang,
      externalSnapshotOverride,
      integrationWarnings,
    });

    const summary = {
      reportType: result.docxPayload.meta.reportType,
      generatedAt: result.docxPayload.meta.generatedAt,
      caseType: result.docxPayload.meta.caseType,
      sectionCount: result.docxPayload.reportPayload.sections.length,
      nativeMappingWarnings: Array.isArray(result.renderWarnings) ? result.renderWarnings.length : 0,
    };

    console.log("AMC report generation succeeded.");
    console.log(`TEMPLATE: ${args.template}`);
    console.log(`INTAKE: ${args.intake}`);
    console.log(`PAYLOAD: ${result.payloadPath}`);
    console.log(`DOCX: ${result.outPath}`);
    console.log(`SUMMARY: ${JSON.stringify(summary)}`);
    if (!process.env.CI && Array.isArray(result.renderWarnings) && result.renderWarnings.length > 0) {
      for (const warning of result.renderWarnings) {
        console.warn(`WARN: ${warning}`);
      }
    }
    if (!process.env.CI && overrideSource === "perplexity_live") {
      console.log("INFO: Perplexity live external snapshot override applied.");
    }
    if (!process.env.CI && overrideSource === "contract_file") {
      console.log("INFO: Contract external layer override applied from file.");
    }
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
  main().then((code) => process.exit(code));
}
