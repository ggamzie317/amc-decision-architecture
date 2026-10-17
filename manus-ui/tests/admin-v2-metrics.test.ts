/**
 * Founder admin metrics for V2 journeys (owner decision 3, 2026-10-17) and
 * test-record tagging (owner decision 4). Audited production numbers before
 * this change: Preview Completed 23.9%, previewToFullIntake 353.8%, integrity
 * suspiciousLifecycle 32 / liveMissingDerivedSync 24 /
 * reportPrintMissingOrStaleDerived 13, evidence unknownRuns 32, preset "fast".
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LaunchOps from "../client/src/components/LaunchOps";
import { adminQuery } from "../client/src/pages/AmcAdmin";
import { buildLaunchOpsSummary } from "../server/launchOpsAnalytics";
import { buildOperationsSummary } from "../server/founderOpsAnalytics";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { buildSubmissionsCsv, trackFounderOps } from "../server/founderOpsApi";
import {
  KNOWN_TEST_SUBMISSION_IDS,
  TEST_PERIOD_END,
  isTestRecord,
} from "../server/testRecords";
import { ADMIN_COOKIE_NAME, createAdminSession } from "../server/founderAdminAuth";
import {
  handleAdminExport,
  handleAdminLaunchOps,
  handleAdminSubmission,
  handleAdminSubmissions,
  handleAdminSummary,
  type ApiResponse,
} from "../server/vercelFounderOps";
import {
  projectInteractiveMetadata,
  projectInteractivePatch,
  v2Identity,
} from "../shared/interactivePrivacy";

// Journeys created before TEST_PERIOD_END are test records by definition, so
// these tests run on a clock after it (only Date is faked; timers stay real).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T00:00:00.000Z"));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("pre-launch test period (owner decision 2026-10-17)", () => {
  it("every journey created before the cutoff is a test record", () => {
    expect(TEST_PERIOD_END).toBe("2026-10-17T15:00:00.000Z");
    expect(isTestRecord({ submissionId: "AMC-20260828-AAAAAAAA", createdAt: "2026-08-28T03:00:00.000Z", structuralOutputJson: {} })).toBe(true);
    expect(isTestRecord({ submissionId: "AMC-20261017-BBBBBBBB", createdAt: "2026-10-17T14:59:59.000Z", structuralOutputJson: {} })).toBe(true);
  });
  it("after the cutoff only ?test=1 journeys or listed ids are tests", () => {
    expect(isTestRecord({ submissionId: "AMC-20261017-CCCCCCCC", createdAt: "2026-10-17T15:00:00.000Z", structuralOutputJson: {} })).toBe(false);
    expect(isTestRecord({ submissionId: "AMC-20261020-DDDDDDDD", createdAt: "2026-10-20T00:00:00.000Z", structuralOutputJson: { testRun: true } })).toBe(true);
  });
  it("a row without createdAt falls back to the other rules", () => {
    expect(isTestRecord({ submissionId: "AMC-20261020-EEEEEEEE", structuralOutputJson: {} })).toBe(false);
  });
});
(globalThis as any).React = React;

const summaryOutput = {
  ...v2Identity,
  completedIntakeQuestionCount: 8,
  baselineBands: { financialRoom: "developing" },
  currentStructuralPosture: { label: "Protect and Reconfigure" },
  safetyMargin: { band: "developing" },
  changingPlays: [{ family: "timing" }],
  decisionSwitchCount: 2,
  externalEvidenceStatus: "live",
};

/** Mirrors AmcInteractiveV2.tsx track(). */
function v2Body(
  eventType: string,
  patch: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
  testRun = false
) {
  return {
    eventType,
    language: "en",
    serviceStorageConsent: true,
    metadata: projectInteractiveMetadata({ ...v2Identity, ...metadata }),
    patch: projectInteractivePatch({
      ...patch,
      language: "en",
      caseType: "Entrepreneurship",
      serviceStorageConsent: true,
      researchUseConsent: false,
      structuralOutputJson: {
        ...v2Identity,
        ...((patch.structuralOutputJson as object) || {}),
        ...(testRun ? { testRun: true } : {}),
      },
    }),
    ...extra,
  };
}

/**
 * A complete V2 journey as the page records it: no preview_completed, no
 * derivedAnalysisSynced, the report opened before dashboard_generated (it
 * waits for every evidence topic), print after it.
 */
async function v2Journey(
  store: MemoryFounderOpsStore,
  options: { evidence?: "live" | "fallback"; testRun?: boolean; stopAfter?: string } = {}
) {
  const evidence = options.evidence ?? "live";
  const steps: Array<[string, Record<string, unknown>, Record<string, unknown>]> = [
    ["preview_started", { currentStage: "preview_started" }, {}],
    ["full_intake_started", { currentStage: "full_intake_started" }, {}],
    [
      "full_intake_completed",
      {
        currentStage: "full_intake_completed",
        fullIntakeCompletedAt: new Date().toISOString(),
        structuralOutputJson: { ...summaryOutput, externalEvidenceStatus: "unavailable" },
      },
      {},
    ],
    ["external_evidence_requested", {}, { externalEvidenceMode: "checking" }],
    ["detailed_report_opened", { currentStage: "detailed_report_opened" }, {}],
    [
      `external_evidence_${evidence}`,
      {
        externalEvidenceMode: evidence,
        structuralOutputJson: { ...summaryOutput, externalEvidenceStatus: evidence === "live" ? "live" : "unavailable" },
      },
      { externalEvidenceMode: evidence === "live" ? "live" : "unverified" },
    ],
    [
      "dashboard_generated",
      {
        currentStage: "dashboard_generated",
        reportGeneratedAt: new Date().toISOString(),
        externalEvidenceMode: evidence,
        structuralOutputJson: { ...summaryOutput, externalEvidenceStatus: evidence === "live" ? "live" : "unavailable" },
      },
      {},
    ],
    ["print_save_clicked", { currentStage: "print_save_clicked", printSaveClickedAt: new Date().toISOString() }, {}],
  ];
  let id = "";
  for (const [type, patch, metadata] of steps) {
    const result = await trackFounderOps(
      v2Body(type, patch, metadata, id ? { submissionId: id } : { newSubmission: true }, options.testRun),
      store
    );
    expect(result).toMatchObject({ ok: true, stored: true });
    id = (result as { submissionId: string }).submissionId;
    if (type === options.stopAfter) break;
  }
  return id;
}

/** Re-stamps a journey's events one minute apart, in recorded order. */
function stamp(store: MemoryFounderOpsStore, id: string, startMinutesAgo = 120) {
  const start = Date.now() - startMinutesAgo * 60_000;
  store.events
    .filter(event => event.submissionId === id)
    .forEach((event, i) => {
      event.createdAt = new Date(start + i * 60_000).toISOString();
    });
}

/** A historical legacy MVP journey (no identity), with derived sync markers. */
async function legacyJourney(store: MemoryFounderOpsStore, previewCompleted = true) {
  const row = await store.createSubmission("ko", true);
  const types = [
    "preview_started",
    ...(previewCompleted ? ["preview_completed"] : []),
    "full_intake_started",
    "full_intake_completed",
    "dashboard_generated",
  ];
  for (const type of types) await store.addEvent(row.submissionId, type as never);
  stamp(store, row.submissionId, 600);
  return row.submissionId;
}

async function mixedStore() {
  const store = new MemoryFounderOpsStore();
  const v2 = [] as string[];
  for (let i = 0; i < 4; i++) {
    const id = await v2Journey(store, { evidence: i === 3 ? "fallback" : "live" });
    stamp(store, id, 200 - i * 20);
    v2.push(id);
  }
  const legacy = [await legacyJourney(store), await legacyJourney(store, false)];
  return { store, v2, legacy };
}

const launch = async (store: MemoryFounderOpsStore) => {
  const data = await store.readLaunchData();
  return buildLaunchOpsSummary(data.submissions, data.events, null);
};

function recorder() {
  const state = { status: 200, body: undefined as any, headers: {} as Record<string, string> };
  const response: ApiResponse = {
    status(code) { state.status = code; return response; },
    json(body) { state.body = body; },
    send(body) { state.body = body; },
    end() {},
    setHeader(key, value) { state.headers[key] = value; },
  };
  return { state, response };
}
const auth = () => {
  vi.stubEnv("AMC_ADMIN_SESSION_SECRET", "test-session-secret-value-with-length");
  return { cookie: `${ADMIN_COOKIE_NAME}=${createAdminSession()}` };
};
const allRates = (stages: Array<{ previousRate: number | null; startRate: number | null }>) =>
  stages.flatMap(stage => [stage.previousRate ?? 0, stage.startRate ?? 0]);

describe("A1 · funnel per experience", () => {
  it("builds the primary V2 funnel without Preview Completed and keeps legacy separate", async () => {
    const { store } = await mixedStore();
    const result = await launch(store);
    expect(result.funnel.map(stage => stage.key)).toEqual([
      "preview_started",
      "full_intake_started",
      "full_intake_completed",
      "dashboard_generated",
      "detailed_report_opened",
      "print_save_clicked",
    ]);
    expect(result.funnel.map(stage => stage.count)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(result.funnel.every(stage => stage.startRate === 100)).toBe(true);
    expect(result.experienceCounts).toEqual({ v2: 4, legacy: 2 });
    expect(result.legacyFunnel.map(stage => stage.key)).toContain("preview_completed");
    expect(result.legacyFunnel.map(stage => stage.count)).toEqual([2, 1, 2, 2, 2, 0, 0]);
    expect(Math.max(...allRates(result.funnel), ...allRates(result.legacyFunnel))).toBeLessThanOrEqual(100);
  });
  it("keeps every operations-summary rate at or below 100% (was previewToFullIntake 353.8%)", async () => {
    const { store } = await mixedStore();
    const data = await store.readLaunchData();
    const summary = buildOperationsSummary(data.submissions, data.events);
    // Event counts: 6 full-intake starts over 1 preview completion was 600%.
    expect(summary.totals.previewCompletions).toBe(1);
    expect(summary.totals.fullIntakeStarts).toBe(6);
    // V2 journeys pass the preview gate at preview_started.
    expect(summary.rates.previewToFullIntake).toBe(100);
    for (const value of Object.values(summary.rates)) expect(value).toBeLessThanOrEqual(100);
    expect(summary.rates.externalEvidenceLive).toBe(75);
    // Repeated searches in one journey do not inflate the live rate.
    const id = data.submissions.find(row => row.structuralOutputJson.experienceVersion === "interactive-v2")!.submissionId;
    const repeat = data.events.filter(e => e.submissionId === id && e.eventType === "external_evidence_live");
    const again = buildOperationsSummary(data.submissions, [...data.events, ...repeat, ...repeat]);
    expect(again.rates.externalEvidenceLive).toBe(75);
  });
});

describe("A2 · integrity for V2 journeys", () => {
  it("does not flag healthy V2 journeys with legacy-only checks", async () => {
    const { store } = await mixedStore();
    const { integrity } = await launch(store);
    // Legacy row without preview_completed is still flagged (legacy rule kept).
    expect(integrity).toMatchObject({
      suspiciousLifecycle: 1,
      completedAnswerCountMismatch: 2, // the two legacy rows have no answers
      completedMissingStructuralOutput: 2, // legacy rows only
      liveMissingDerivedSync: 0,
      reportPrintMissingOrStaleDerived: 0,
      v2DashboardWithoutIntakeCompleted: 0,
      v2CompletedMissingStructuralOutput: 0,
      v2PrintBeforeDashboard: 0,
      orphanEvents: 0,
    });
  });
  it("flags a broken V2 journey with V2 checks", async () => {
    const { store, v2 } = await mixedStore();
    // Journey 0: full_intake_completed missing; journey 1: print before
    // dashboard; journey 2: stored structural output lost its projection.
    const drop = store.events.findIndex(e => e.submissionId === v2[0] && e.eventType === "full_intake_completed");
    store.events.splice(drop, 1);
    store.submissions.get(v2[0])!.fullIntakeCompletedAt = null;
    const print = store.events.find(e => e.submissionId === v2[1] && e.eventType === "print_save_clicked")!;
    print.createdAt = new Date(Date.parse(print.createdAt) - 3 * 3_600_000).toISOString();
    store.submissions.get(v2[2])!.structuralOutputJson = { ...v2Identity };
    const { integrity } = await launch(store);
    expect(integrity.v2DashboardWithoutIntakeCompleted).toBe(1);
    expect(integrity.v2PrintBeforeDashboard).toBe(1);
    expect(integrity.v2CompletedMissingStructuralOutput).toBe(1);
    // Lifecycle: legacy no-preview row + journeys 0 and 1.
    expect(integrity.suspiciousLifecycle).toBe(3);
    expect(integrity.liveMissingDerivedSync).toBe(0);
    expect(integrity.reportPrintMissingOrStaleDerived).toBe(0);
  });
  it("still applies the derived-sync checks to legacy live rows", async () => {
    const store = new MemoryFounderOpsStore();
    const id = await legacyJourney(store);
    store.submissions.get(id)!.externalEvidenceMode = "live";
    await store.addEvent(id, "external_evidence_requested");
    await store.addEvent(id, "detailed_report_opened");
    expect((await launch(store)).integrity).toMatchObject({
      liveMissingDerivedSync: 1,
      reportPrintMissingOrStaleDerived: 1,
    });
  });
});

describe("A3 · V2 external evidence from journey events", () => {
  it("counts requests, live and fallback results and the latest live event", async () => {
    const { store, v2 } = await mixedStore();
    const { evidence } = await launch(store);
    const lastLive = store.events
      .filter(e => e.eventType === "external_evidence_live")
      .map(e => e.createdAt)
      .sort()
      .at(-1);
    expect(evidence.v2).toEqual({
      requests: 4,
      requestJourneys: 4,
      liveResults: 3,
      fallbackResults: 1,
      livePercent: 75,
      liveJourneys: 3,
      fallbackOnlyJourneys: 1,
      liveJourneyPercent: 75,
      recentLiveEvent: lastLive,
      recentFallbackEvent: store.events.find(e => e.submissionId === v2[3] && e.eventType === "external_evidence_fallback")!.createdAt,
      diagnosticsRecorded: false,
    });
    // V2 requests carry no provider observation and are not "unknown" runs.
    expect(evidence).toMatchObject({ requests: 0, unknownRuns: 0, liveRuns: 0, recentLiveSuccess: null });
  });
});

describe("A4 · configuration shows the V2 search preset", () => {
  it("reports PERPLEXITY_V2_AGENT_PRESET (default medium), not the legacy preset, and no secrets", async () => {
    const headers = auth();
    vi.stubEnv("PERPLEXITY_AGENT_PRESET", "fast");
    vi.stubEnv("PERPLEXITY_API_KEY", "pplx-secret-value");
    const { store } = await mixedStore();
    let r = recorder();
    await handleAdminLaunchOps({ method: "GET", headers }, r.response, store);
    expect(r.state.body.configuration).toMatchObject({ preset: "medium", presetLabel: "V2 search preset" });
    expect(JSON.stringify(r.state.body)).not.toContain("pplx-secret-value");
    vi.stubEnv("PERPLEXITY_V2_AGENT_PRESET", "high");
    r = recorder();
    await handleAdminLaunchOps({ method: "GET", headers }, r.response, store);
    expect(r.state.body.configuration.preset).toBe("high");
  });
});

describe("B1 · testRun tag survives projection", () => {
  it("keeps only testRun: true through client and server projection", async () => {
    expect(projectInteractivePatch({ structuralOutputJson: { ...v2Identity, testRun: true } }).structuralOutputJson.testRun).toBe(true);
    for (const value of [false, "true", 1, "1", { yes: true }, null])
      expect(projectInteractivePatch({ structuralOutputJson: { ...v2Identity, testRun: value } }).structuralOutputJson).not.toHaveProperty("testRun");
    // Unknown keys are still dropped.
    const projected = projectInteractivePatch({ structuralOutputJson: { ...v2Identity, testRun: true, testLabel: "x", rawText: "PRIVATE" } });
    expect(projected.structuralOutputJson).not.toHaveProperty("testLabel");
    expect(projected.structuralOutputJson).not.toHaveProperty("rawText");
  });
  it("is stored by the server route and kept across later events of the journey", async () => {
    const store = new MemoryFounderOpsStore();
    const id = await v2Journey(store, { testRun: true });
    expect(store.submissions.get(id)!.structuralOutputJson.testRun).toBe(true);
    // A follow-up simulator event (empty patch) keeps the tag.
    await trackFounderOps({ ...v2Body("simulator_opened"), submissionId: id }, store);
    expect(store.submissions.get(id)!.structuralOutputJson.testRun).toBe(true);
    // A forged non-boolean from a client is not stored.
    const other = await v2Journey(store, { stopAfter: "preview_started" });
    await trackFounderOps(
      { ...v2Body("full_intake_started"), submissionId: other, patch: { structuralOutputJson: { ...v2Identity, testRun: "yes" } } },
      store
    );
    expect(store.submissions.get(other)!.structuralOutputJson).not.toHaveProperty("testRun");
  });
});

describe("B2 · known test ids and the testRun flag", () => {
  it("lists exactly the five audited test journeys", () => {
    expect(KNOWN_TEST_SUBMISSION_IDS).toEqual([
      "AMC-20261015-B71A3311",
      "AMC-20261015-185EC4AC",
      "AMC-20261016-4F0934D5",
      "AMC-20261016-1B435E00",
      "AMC-20261017-557E5D38",
    ]);
  });
  it("tags a record by known id or by testRun === true, nothing else", () => {
    const row = (submissionId: string, structuralOutputJson: Record<string, unknown> = {}) => ({ submissionId, structuralOutputJson });
    expect(isTestRecord(row("AMC-20261016-4F0934D5"))).toBe(true);
    expect(isTestRecord(row("AMC-20261017-AAAAAAAA", { ...v2Identity, testRun: true }))).toBe(true);
    expect(isTestRecord(row("AMC-20261017-AAAAAAAA", { ...v2Identity, testRun: "true" }))).toBe(false);
    expect(isTestRecord(row("AMC-20261017-AAAAAAAA", { ...v2Identity }))).toBe(false);
  });
});

/** Mixed store with one known-id test row and one testRun-tagged journey. */
async function storeWithTests() {
  const { store, v2, legacy } = await mixedStore();
  const tagged = await v2Journey(store, { testRun: true });
  stamp(store, tagged, 30);
  // Re-key one V2 journey to a known test id (as in production data).
  const known = KNOWN_TEST_SUBMISSION_IDS[4];
  const row = store.submissions.get(v2[0])!;
  store.submissions.delete(v2[0]);
  store.submissions.set(known, { ...row, submissionId: known });
  store.events.forEach(event => {
    if (event.submissionId === v2[0]) event.submissionId = known;
  });
  return { store, known, tagged, v2, legacy };
}

describe("B3 · excludeTests on every aggregate and the CSV; isTest on list/detail", () => {
  it("launch: parameter absent includes tests, excludeTests=1 removes them (and their events)", async () => {
    const headers = auth();
    const { store } = await storeWithTests();
    let r = recorder();
    await handleAdminLaunchOps({ method: "GET", headers }, r.response, store);
    expect(r.state.body.cohortSize).toBe(7);
    expect(r.state.body.testRecords).toEqual({ count: 2, excluded: false });
    expect(r.state.body.recent.filter((x: { isTest: boolean }) => x.isTest)).toHaveLength(2);
    r = recorder();
    await handleAdminLaunchOps({ method: "GET", headers, query: { excludeTests: "1" } }, r.response, store);
    expect(r.state.body.cohortSize).toBe(5);
    expect(r.state.body.funnel[0].count).toBe(3);
    expect(r.state.body.evidence.v2.requests).toBe(3);
    expect(r.state.body.integrity.orphanEvents).toBe(0);
    expect(r.state.body.testRecords).toEqual({ count: 2, excluded: true });
    expect(r.state.body.recent.some((x: { isTest: boolean }) => x.isTest)).toBe(false);
  });
  it("summary and research summary honour excludeTests", async () => {
    const headers = auth();
    const { store, tagged } = await storeWithTests();
    store.submissions.get(tagged)!.researchUseConsent = true;
    const get = async (query: Record<string, string>) => {
      const r = recorder();
      await handleAdminSummary({ method: "GET", headers, query }, r.response, store);
      return r.state.body;
    };
    expect((await get({})).totals.submissions).toBe(7);
    expect((await get({ excludeTests: "1" })).totals.submissions).toBe(5);
    expect((await get({ excludeTests: "1" })).testRecords).toEqual({ count: 2, excluded: true });
    expect((await get({ mode: "research" })).totals.submissions).toBe(1);
    expect((await get({ mode: "research", excludeTests: "1" })).totals.submissions).toBe(0);
  });
  it("CSV carries is_test and excludeTests drops test rows", async () => {
    const headers = auth();
    const { store, known, tagged } = await storeWithTests();
    let r = recorder();
    await handleAdminExport({ method: "GET", headers, query: {} }, r.response, store);
    const lines = String(r.state.body).trim().split("\r\n");
    const header = lines[0].replace(/^﻿/, "").split(",");
    const column = header.indexOf('"is_test"');
    expect(column).toBeGreaterThan(-1);
    expect(lines).toHaveLength(8);
    const flag = (id: string) => lines.find(line => line.includes(id))!.split(",")[column];
    expect(flag(known)).toBe('"true"');
    expect(flag(tagged)).toBe('"true"');
    expect(lines.filter(line => line.split(",")[column] === '"false"')).toHaveLength(5);
    r = recorder();
    await handleAdminExport({ method: "GET", headers, query: { excludeTests: "1" } }, r.response, store);
    const filtered = String(r.state.body).trim().split("\r\n");
    expect(filtered).toHaveLength(6);
    expect(String(r.state.body)).not.toContain(known);
    expect(String(r.state.body)).not.toContain(tagged);
    expect(buildSubmissionsCsv([], true).split(",")).toContain('"is_test"');
  });
  it("submissions list and detail expose isTest", async () => {
    const headers = auth();
    const { store, known, tagged, legacy } = await storeWithTests();
    let r = recorder();
    await handleAdminSubmissions({ method: "GET", headers }, r.response, store);
    const byId = new Map(r.state.body.submissions.map((x: { submissionId: string; isTest: boolean }) => [x.submissionId, x.isTest]));
    expect(byId.get(known)).toBe(true);
    expect(byId.get(tagged)).toBe(true);
    expect(byId.get(legacy[0])).toBe(false);
    expect(r.state.body.testRecords).toEqual({ count: 2, excluded: false });
    r = recorder();
    await handleAdminSubmissions({ method: "GET", headers, query: { excludeTests: "1" } }, r.response, store);
    expect(r.state.body.submissions).toHaveLength(5);
    for (const [id, expected] of [[known, true], [tagged, true], [legacy[0], false]] as const) {
      r = recorder();
      await handleAdminSubmission({ method: "GET", headers, query: { id } }, r.response, store);
      expect(r.state.body.isTest).toBe(expected);
    }
  });
});

describe("admin UI", () => {
  it("shows the V2 funnel first, legacy collapsed, V2 evidence, the V2 preset label and TEST badges", async () => {
    const { store } = await storeWithTests();
    const data = await store.readLaunchData();
    const summary = {
      ...buildLaunchOpsSummary(data.submissions, data.events, null),
      testRecords: { count: 2, excluded: false },
      configuration: { preset: "medium", presetLabel: "V2 search preset", provider: "Perplexity Agent API", launchMode: "FREE PUBLIC" },
    };
    const html = renderToStaticMarkup(React.createElement(LaunchOps, { data: summary, openDetail: () => {} }));
    expect(html).toContain("Launch funnel · V2");
    expect(html).toContain("V2 search preset</dt><dd");
    expect(html).not.toContain("Current preset");
    const legacy = html.indexOf("Legacy MVP / V1 funnel (retired)");
    expect(legacy).toBeGreaterThan(html.indexOf("Launch funnel · V2"));
    // Preview Completed appears only inside the collapsed legacy funnel.
    expect(html.indexOf("<span>Preview Completed</span>")).toBeGreaterThan(legacy);
    expect(html).toContain("External Evidence health · V2");
    expect(html).toContain("not recorded for V2");
    expect(html.match(/>TEST</g)).toHaveLength(2);
  });
  it("sends excludeTests=1 by default from every aggregate call and the CSV export", () => {
    expect(adminQuery({ window: "7" }, true)).toBe("window=7&excludeTests=1");
    expect(adminQuery({ mode: "research" }, false)).toBe("mode=research");
    const root = path.basename(process.cwd()) === "manus-ui" ? process.cwd() : path.join(process.cwd(), "manus-ui");
    const source = fs.readFileSync(path.join(root, "client/src/pages/AmcAdmin.tsx"), "utf8");
    expect(source).toContain("const [excludeTests, setExcludeTests] = useState(true);");
    expect(source).toContain("테스트 기록 제외 / Exclude test records");
    for (const endpoint of ["/api/amc/admin/summary?${adminQuery(", "/api/amc/admin/launch?${adminQuery("])
      expect(source).toContain(endpoint);
    expect(source.match(/\/api\/amc\/admin\/summary\?\$\{adminQuery\(/g)).toHaveLength(2);
    // Submissions list and CSV export share `query`, which carries the flag.
    expect(source).toContain('if (excludeTests) params.set("excludeTests", "1");');
    expect(source).toContain("/api/amc/admin/submissions?${query}");
    expect(source).toMatch(/\/api\/amc\/admin\/export\?mode=.*&\$\{query\}/);
  });
});
