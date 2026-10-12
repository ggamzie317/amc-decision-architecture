import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

async function main() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }
  const sql = postgres(connectionString, { max: 1, connect_timeout: 8 });
  try {
    for (const file of ["001_amc_founder_ops.sql", "002_amc_usage_event_contract.sql"]) {
      const migrationPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../db", file);
      await sql.file(migrationPath);
    }
    console.log("AMC founder operations migration applied successfully.");
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined);
  }
}

main().catch(error => {
  const reason =
    error instanceof Error && error.message === "DATABASE_URL is required."
      ? error.message
      : "database connection or migration error.";
  console.error(`AMC founder operations migration failed: ${reason}`);
  process.exitCode = 1;
});
