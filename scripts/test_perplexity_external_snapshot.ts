import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchExternalSnapshot } from "../src/perplexity/fetchExternalSnapshot";

type CliArgs = {
  intake?: string;
  caseSummary?: string;
  out?: string;
  model?: string;
  domainFilter: string[];
  lang: "ko" | "en" | "zh";
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    domainFilter: [],
    lang: "en",
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
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--lang" && next) {
      const lang = next.trim().toLowerCase();
      if (lang === "ko" || lang === "en" || lang === "zh") {
        args.lang = lang;
      }
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

function printHelp() {
  console.log("Test Perplexity external snapshot adapter");
  console.log("Usage:");
  console.log("  pnpm --dir manus-ui exec tsx ../scripts/test_perplexity_external_snapshot.ts [options]");
  console.log("Options:");
  console.log("  --intake <path>          Optional raw intake JSON path");
  console.log("  --case-summary <text>    Optional direct case summary override");
  console.log("  --out <path>             Optional output JSON file path");
  console.log("  --model <name>           Optional Perplexity model (default: PERPLEXITY_MODEL or sonar)");
  console.log("  --domain-filter <csv>    Optional search_domain_filter, e.g. reuters.com,bloomberg.com");
  console.log("  --lang <ko|en|zh>        Output language hint for summary/evidence text (default: en)");
}

function readJson(filePath: string): any {
  const text = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(text);
}

function resolveDefaultIntakePath(): string {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  return path.resolve(repoRoot, "examples", "amc_case_exit_package_vs_stay.json");
}

function buildCaseSummary(raw: any): string {
  const bits = [
    raw?.mainDecision,
    raw?.optionsUnderConsideration,
    raw?.forcedChoiceToday,
    raw?.nonNegotiable,
    raw?.biggestRisks,
    ...(Array.isArray(raw?.topPriorities) ? raw.topPriorities : []),
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return bits.join(" ");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const intakePath = args.intake ?? resolveDefaultIntakePath();
  const intake = readJson(intakePath);

  const caseSummary = args.caseSummary?.trim() || buildCaseSummary(intake);
  if (!caseSummary) {
    throw new Error("case summary is empty. Provide --case-summary or intake with decision fields.");
  }

  const response = await fetchExternalSnapshot(
    {
      caseSummary,
      optionsUnderConsideration: intake?.optionsUnderConsideration,
      location: intake?.location,
      currentRoleCompany: intake?.currentRoleCompany,
      reportLanguage: args.lang,
      asOfDate: new Date().toISOString().slice(0, 10),
    },
    {
      model: args.model,
      searchDomainFilter: args.domainFilter,
    },
  );

  const output = {
    request: {
      intakePath,
      model: args.model ?? process.env.PERPLEXITY_MODEL ?? "sonar",
      domainFilter: args.domainFilter,
      lang: args.lang,
    },
    response,
  };

  const text = JSON.stringify(output, null, 2);

  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, `${text}\n`, "utf-8");
    console.log(`Wrote output: ${args.out}`);
  }

  console.log(text);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Perplexity external snapshot test failed.");
  console.error(`ERROR: ${message}`);
  process.exit(1);
});
