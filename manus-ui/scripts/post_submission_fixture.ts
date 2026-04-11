import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CliArgs = {
  baseUrl: string;
  fixturePath: string;
};

function parseArgs(argv: string[]): CliArgs {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultFixture = path.resolve(scriptDir, "..", "server", "fixtures", "amc_submission_handoff_single_example.json");
  const args: CliArgs = {
    baseUrl: "http://localhost:3000",
    fixturePath: defaultFixture,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--base" && next) {
      args.baseUrl = next;
      i += 1;
      continue;
    }
    if (token === "--fixture" && next) {
      args.fixturePath = next;
      i += 1;
      continue;
    }
  }
  return args;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.fixturePath)) {
    console.error(`Fixture not found: ${args.fixturePath}`);
    return 1;
  }

  const body = JSON.parse(fs.readFileSync(args.fixturePath, "utf-8"));
  const endpoint = `${args.baseUrl.replace(/\/$/, "")}/api/submissions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  console.log(`POST ${endpoint}`);
  console.log(`Status: ${response.status}`);
  console.log(JSON.stringify(payload, null, 2));
  return response.ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
