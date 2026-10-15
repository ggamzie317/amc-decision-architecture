import { describe, expect, it } from "vitest";
import { initialV2State, type V2State } from "../client/src/data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../client/src/data/externalIntelligenceV2";
import { v2ComparisonKey } from "../client/src/data/v2EvidenceComparison";
import { buildV2EvidenceRequest } from "../client/src/data/v2ExternalEvidenceClient";
import {
  v2AreasForCase,
  v2MissingGroups,
  v2PickEvidence,
  v2ShouldRetryTopic,
  v2StoreEvidence,
  v2WithCaseType,
  v2WithoutPending,
} from "../client/src/data/v2EvidenceFlow";

type Block = ExternalIntelligenceV2["evidenceBlocks"][number];
const block = (patch: Partial<Block>): Block => ({
  area: "compensation",
  dimension: "Compensation",
  headline: "Pay range published",
  direction: "mixed",
  fact: "The published range is wide.",
  whyItMatters: "Compare it with your floor.",
  sourceLabel: "Source",
  sourceUrl: "https://example.org/pay",
  provenance: "EXTERNAL_EVIDENCE",
  ...patch,
});
const snapshot = (language: "en" | "ko", patch: Partial<ExternalIntelligenceV2> = {}): ExternalIntelligenceV2 => ({
  status: "live",
  generatedAt: "2026-10-15T00:00:00.000Z",
  caseType: "General Career Reconfiguration",
  evidenceBlocks: [block(language === "ko" ? { dimension: "보상", fact: "공개된 범위가 넓습니다." } : {})],
  metrics: [],
  opportunitySignals: [],
  frictionSignals: [],
  uncertainties: ["u"],
  implication: "i",
  ...patch,
});

describe("saved comparisons survive a language toggle (M7)", () => {
  it("keys by source and area, not by translated dimension or fact", () => {
    const en = block({});
    const ko = block({ dimension: "보상", fact: "공개된 범위가 넓습니다." });
    expect(v2ComparisonKey(en, "en")).toBe(v2ComparisonKey(ko, "ko"));
  });
  it("still separates different sources and different areas", () => {
    const base = block({});
    expect(v2ComparisonKey(base, "en")).not.toBe(v2ComparisonKey(block({ sourceUrl: "https://example.org/other" }), "en"));
    expect(v2ComparisonKey(base, "en")).not.toBe(v2ComparisonKey(block({ area: "requiredSkills", dimension: "Required skills" }), "en"));
  });
  it("falls back to the dimension for blocks without an area", () => {
    const noArea = block({ area: undefined });
    expect(v2ComparisonKey(noArea, "en")).toBe(JSON.stringify(["https://example.org/pay", "Compensation"]));
  });
});

describe("case-type change drops topic picks from the old family (H4)", () => {
  const withPicks = (caseType: V2State["caseType"], externalAreas: string[]): V2State => ({
    ...initialV2State("en"),
    caseType,
    externalAreas: externalAreas as V2State["externalAreas"],
    publicSearchTarget: "Product manager",
    targetGeography: "Seoul",
  });
  it("filters areas through the new case family", () => {
    expect(v2AreasForCase(["customerDemand", "compensation"] as V2State["externalAreas"], "Entrepreneurship"))
      .toEqual(["customerDemand"]);
  });
  it("keeps the search request valid after switching family", () => {
    const before = withPicks("Entrepreneurship", ["customerDemand", "pricing"]);
    const after = v2WithCaseType(before, "General Career Reconfiguration");
    expect(after.caseType).toBe("General Career Reconfiguration");
    expect(after.externalAreas).toEqual([]);
    expect(after.publicSearchTarget).toBeUndefined();
    // With old-family picks kept, the request would be rejected (null).
    expect(buildV2EvidenceRequest({ ...before, caseType: "General Career Reconfiguration", publicSearchTarget: undefined })).toBeNull();
    expect(buildV2EvidenceRequest({ ...after, publicSearchTarget: "Product manager" })).not.toBeNull();
  });
  it("keeps picks that are valid in both families untouched", () => {
    const state = withPicks("General Career Reconfiguration", ["compensation"]);
    expect(v2WithCaseType(state, "Industry Transition").externalAreas).toEqual(["compensation"]);
  });
});

describe("translation snapshots never go stale (H3) and pending topics are marked (M5)", () => {
  const empty = { en: null, ko: null } as Record<"en" | "ko", ExternalIntelligenceV2 | null>;
  it("stores the translation under the other language", () => {
    const stored = v2StoreEvidence(empty, "ko", { ...snapshot("ko"), translation: snapshot("en") });
    expect(stored.ko?.evidenceBlocks[0].dimension).toBe("보상");
    expect(stored.en?.evidenceBlocks[0].dimension).toBe("Compensation");
    expect(stored.ko?.translation).toBeUndefined();
  });
  it("clears an older translation when the new merge has none", () => {
    const old = { ko: snapshot("ko"), en: snapshot("en", { evidenceBlocks: [] }) };
    const stored = v2StoreEvidence(old, "ko", snapshot("ko"));
    expect(stored.en).toBeNull();
  });
  it("sets pendingAreas while topics run and removes it when they finish", () => {
    const running = v2StoreEvidence(empty, "en", { ...snapshot("en"), translation: snapshot("ko") }, ["hiringDemand"]);
    expect(running.en?.pendingAreas).toEqual(["hiringDemand"]);
    expect(running.ko?.pendingAreas).toEqual(["hiringDemand"]);
    const done = v2StoreEvidence(running, "en", running.en!);
    expect(done.en && "pendingAreas" in done.en).toBe(false);
  });
  it("never accepts pendingAreas from a response", () => {
    const fromServer = { ...snapshot("en", { pendingAreas: ["x"] }), translation: snapshot("ko", { pendingAreas: ["x"] }) };
    const clean = v2WithoutPending(fromServer);
    expect("pendingAreas" in clean).toBe(false);
    expect(clean.translation && "pendingAreas" in clean.translation).toBe(false);
  });
});

describe("snapshot choice prefers usable evidence (L5)", () => {
  it("picks a live research-language snapshot over an unavailable UI-language one", () => {
    const live = snapshot("ko");
    const unavailable = { ...snapshot("en"), status: "unavailable" as const, evidenceBlocks: [] };
    expect(v2PickEvidence({ en: unavailable, ko: live }, "en", "ko")).toBe(live);
  });
  it("prefers the UI language when both are live and falls back to anything otherwise", () => {
    const en = snapshot("en"), ko = snapshot("ko");
    expect(v2PickEvidence({ en, ko }, "en", "ko")).toBe(en);
    const unavailable = { ...snapshot("en"), status: "unavailable" as const };
    expect(v2PickEvidence({ en: unavailable, ko: null }, "en", "ko")).toBe(unavailable);
    expect(v2PickEvidence({ en: null, ko: null }, "en", "ko")).toBeNull();
  });
});

describe("automatic topic retry only for transient failures (L4)", () => {
  const failed = { status: "unavailable" as const };
  it("retries timeouts, 429, transient 5xx and empty results", () => {
    expect(v2ShouldRetryTopic(null, failed)).toBe(true);
    expect(v2ShouldRetryTopic({ status: 429, reason: null }, failed)).toBe(true);
    expect(v2ShouldRetryTopic({ status: 503, reason: "provider_failure" }, failed)).toBe(true);
    expect(v2ShouldRetryTopic({ status: 200, reason: "live" }, failed)).toBe(true);
  });
  it("does not retry permanent failures or live results", () => {
    expect(v2ShouldRetryTopic({ status: 503, reason: "provider_not_configured" }, failed)).toBe(false);
    expect(v2ShouldRetryTopic({ status: 400, reason: "malformed_request" }, failed)).toBe(false);
    expect(v2ShouldRetryTopic({ status: 200, reason: "live" }, { status: "live" })).toBe(false);
  });
});

describe("search again re-requests only missing topics (M8)", () => {
  it("lists only the topic groups without a live result", () => {
    expect(v2MissingGroups([snapshot("en"), undefined, snapshot("en"), undefined])).toEqual([1, 3]);
    expect(v2MissingGroups([snapshot("en")])).toEqual([]);
  });
});
