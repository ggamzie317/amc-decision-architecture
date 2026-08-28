import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { build } from "esbuild";

const appRoot = path.resolve(import.meta.dirname, "..");
const serverRoot = path.join(appRoot, "server");
const cacheRoot = path.join(appRoot, "node_modules", ".cache");
await mkdir(cacheRoot, { recursive: true });
const outputRoot = await mkdtemp(path.join(cacheRoot, "amc-founder-ops-esm-"));
const entryPoints = [
  "founderAdminAuth.ts",
  "founderNotification.ts",
  "founderOpsAnalytics.ts",
  "founderOpsApi.ts",
  "founderOpsHealth.ts",
  "founderOpsStore.ts",
  "founderOpsTypes.ts",
  "vercelFounderOps.ts",
].map(file => path.join(serverRoot, file));

try {
  await build({
    entryPoints,
    outbase: serverRoot,
    outdir: outputRoot,
    bundle: false,
    format: "esm",
    platform: "node",
    packages: "external",
    logLevel: "silent",
  });

  const runtimeModule = await import(
    pathToFileURL(path.join(outputRoot, "vercelFounderOps.js")).href
  );
  if (typeof runtimeModule.handleAdminHealth !== "function") {
    throw new Error(
      "Founder Ops runtime module did not load expected exports."
    );
  }
  console.log("Founder Ops Vercel ESM import smoke passed.");
} finally {
  await rm(outputRoot, { recursive: true, force: true });
}
