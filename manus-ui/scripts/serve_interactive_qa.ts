import { createJevScenarioHandler } from "../server/jevScenario.ts";
import { metrics } from "../server/jevScenarioContract.ts";
// Local synthetic QA only; no database credentials or provider requests are used.
import express from "express";
import path from "node:path";
const assets = path.resolve(import.meta.dirname, "../dist/public");
import { trackFounderOps } from "../server/founderOpsApi.ts";
import { MemoryFounderOpsStore } from "../server/founderOpsStore.ts";
import { buildFallbackSnapshot } from "../server/externalSnapshotService.ts";
const app = express(),
  store = new MemoryFounderOpsStore();
app.use(express.json());
app.post(
  "/api/amc/jev-scenario",
  createJevScenarioHandler({
    store,
    enabled: true,
    credential: () => "SYNTHETIC_TEST_ONLY",
    fetcher: async () =>
      new Response(
        JSON.stringify({
          model: "typesafe-ai/jev",
          provider_metadata: {
            gateway: {
              routing: {
                originalModelId: "typesafe-ai/jev",
                canonicalSlug: "typesafe-ai/jev",
                resolvedProvider: "typesafe-ai",
                finalProvider: "typesafe-ai",
              },
            },
          },
          answers: Object.fromEntries(
            metrics.map(k => [
              k,
              {
                type: "choice",
                choice: "medium",
                confidence: 0.7,
                probabilities: { low: 0.1, medium: 0.7, high: 0.2 },
              },
            ])
          ),
        })
      ),
  })
);
app.post("/api/amc/ops/track", async (req, res) =>
  res.json(await trackFounderOps(req.body, store))
);
app.post("/api/amc/external-snapshot", (req, res) =>
  res.json(buildFallbackSnapshot(req.body.language, "provider_not_configured"))
);
app.get("/qa-records", (_, res) =>
  res.json({
    submissions: Array.from(store.submissions.values()),
    events: store.events,
  })
);
app.use(express.static(assets));
app.get("*", (_, res) => res.sendFile(path.join(assets, "index.html")));
app.listen(Number(process.env.AMC_QA_PORT || 3060), "127.0.0.1", () =>
  console.log(
    "Synthetic local QA, memory persistence, fallback evidence, no provider calls: 3060"
  )
);
