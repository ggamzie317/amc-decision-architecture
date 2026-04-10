import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeExternalLayerContractV1 } from "../src/perplexity/externalLayerContract";
import { fetchExternalSnapshot } from "../src/perplexity/fetchExternalSnapshot";

type CliArgs = {
  intake?: string;
  caseSummary?: string;
  providerResponse?: string;
  out: string;
  model?: string;
  domainFilter: string[];
  lang: "ko" | "en" | "zh";
  asOfDate: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const args: CliArgs = {
    intake: path.resolve(repoRoot, "examples", "amc_case_exit_package_single.json"),
    out: path.resolve(repoRoot, "output", "external_layer_contract_latest.json"),
    domainFilter: [],
    lang: "en",
    asOfDate: new Date().toISOString().slice(0, 10),
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--intake" && next) {
      args.intake = next;
      i += 1;
      continue;
    }
    if (token === "--case-summary" && next) {
      args.caseSummary = next;
      i += 1;
      continue;
    }
    if (token === "--provider-response" && next) {
      args.providerResponse = next;
      i += 1;
      continue;
    }
    if (token === "--out" && next) {
      args.out = next;
      i += 1;
      continue;
    }
    if (token === "--model" && next) {
      args.model = next;
      i += 1;
      continue;
    }
    if (token === "--domain-filter" && next) {
      args.domainFilter = next
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--lang" && next) {
      const lang = next.trim().toLowerCase();
      if (lang === "ko" || lang === "en" || lang === "zh") {
        args.lang = lang;
      } else {
        throw new Error(`Invalid --lang value: ${next}`);
      }
      i += 1;
      continue;
    }
    if (token === "--as-of-date" && next) {
      args.asOfDate = next.trim();
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
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
  console.log("Emit AMC external-layer contract-v1 JSON from Perplexity-oriented input");
  console.log("Usage:");
  console.log("  pnpm --dir manus-ui exec tsx ../scripts/emit_perplexity_external_layer.ts [options]");
  console.log("Options:");
  console.log("  --provider-response <path>  Transform provider-style JSON (contract object, snapshot, or response.snapshot)");
  console.log("  --intake <path>             Intake JSON path for live Perplexity path (default: examples/amc_case_exit_package_single.json)");
  console.log("  --case-summary <text>       Optional explicit case summary for live path");
  console.log("  --out <path>                Contract-v1 output JSON path (default: output/external_layer_contract_latest.json)");
  console.log("  --model <name>              Optional Perplexity model override");
  console.log("  --domain-filter <csv>       Optional search domains (reuters.com,bloomberg.com)");
  console.log("  --lang <ko|en|zh>           Output language hint for live path (default: en)");
  console.log("  --as-of-date <YYYY-MM-DD>   As-of date for live path prompt (default: today)");
  console.log("  --dry-run                   Print contract JSON only; do not write file");
  console.log("Environment:");
  console.log("  PERPLEXITY_API_KEY          Required for live Perplexity path");
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function assertPathExists(filePath: string, label: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function buildCaseSummary(raw: any): string {
  return [
    raw?.mainDecision,
    raw?.optionsUnderConsideration,
    raw?.forcedChoiceToday,
    raw?.nonNegotiable,
    raw?.biggestRisks,
    ...(Array.isArray(raw?.topPriorities) ? raw.topPriorities : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

async function buildContractFromLiveFetch(args: CliArgs): Promise<ReturnType<typeof normalizeExternalLayerContractV1>> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY is required for live Perplexity fetch mode");
  }
  if (!args.intake) {
    throw new Error("--intake is required when --provider-response is not provided");
  }

  assertPathExists(args.intake, "Intake file");
  const intake = readJson(args.intake);
  const caseSummary = args.caseSummary?.trim() || buildCaseSummary(intake);
  if (!caseSummary) {
    throw new Error("Case summary is empty; provide --case-summary or richer intake");
  }

  const response = await fetchExternalSnapshot(
    {
      caseSummary,
      optionsUnderConsideration: intake?.optionsUnderConsideration,
      location: intake?.location,
      currentRoleCompany: intake?.currentRoleCompany,
      reportLanguage: args.lang,
      asOfDate: args.asOfDate,
    },
    {
      model: args.model,
      searchDomainFilter: args.domainFilter,
    },
  );

  return normalizeExternalLayerContractV1(response.snapshot);
}

async function main(): Promise<number> {
  try {
    const args = parseArgs(process.argv.slice(2));
    const outPath = path.resolve(args.out);

    const contract = args.providerResponse
      ? normalizeExternalLayerContractV1(readJson(path.resolve(args.providerResponse)))
      : await buildContractFromLiveFetch(args);

    const text = `${JSON.stringify(contract, null, 2)}\n`;
    if (args.dryRun) {
      process.stdout.write(text);
      return 0;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, text, "utf-8");
    console.log(`Emitted contract-v1 external layer JSON: ${outPath}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to emit external-layer contract JSON.");
    console.error(`ERROR: ${message}`);
    return 1;
  }
}

main().then((code) => process.exit(code));
