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
app.listen(3060, "127.0.0.1", () =>
  console.log(
    "Synthetic local QA, memory persistence, fallback evidence, no provider calls: 3060"
  )
);
