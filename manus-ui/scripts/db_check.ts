import { inspectFounderOpsDatabase } from "../server/founderOpsHealth";

async function main() {
  if (!String(process.env.DATABASE_URL || "").trim()) {
    throw new Error("DATABASE_URL is required.");
  }
  const result = await inspectFounderOpsDatabase();
  console.log(`Database: ${result.database}`);
  console.log(`Schema: ${result.schema}`);
  console.log(`Submission storage: ${result.submissionStorage}`);
  console.log(`Usage events: ${result.usageEvents}`);
  if (result.missing.length) {
    console.log(`Missing schema items: ${result.missing.join(", ")}`);
  }
  if (result.database !== "connected" || result.schema !== "ready") {
    process.exitCode = 1;
    return;
  }
  console.log("AMC founder operations database check passed.");
}

main().catch(error => {
  const reason =
    error instanceof Error && error.message === "DATABASE_URL is required."
      ? error.message
      : "database check error.";
  console.error(`AMC founder operations database check failed: ${reason}`);
  process.exitCode = 1;
});
