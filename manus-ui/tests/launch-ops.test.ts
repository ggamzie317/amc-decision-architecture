import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildLaunchOpsSummary,
  funnelStages,
} from "../server/launchOpsAnalytics";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { buildResearchSummary } from "../server/founderOpsAnalytics";
import { trackFounderOps } from "../server/founderOpsApi";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
} from "../server/founderAdminAuth";
import {
  handleAdminLaunchOps,
  handleAdminSubmissions,
  type ApiResponse,
} from "../server/vercelFounderOps";
import type {
  SubmissionRecord,
  UsageEventRecord,
} from "../server/founderOpsTypes";

const now = new Date("2026-09-24T12:00:00Z");
const date = (days: number, minutes = 0) =>
  new Date(+now - days * 86400000 + minutes * 60000).toISOString();
const answers = Object.fromEntries(
  Array.from({ length: 29 }, (_, i) => [String(i + 1), "PRIVATE ANSWER"])
);
async function fixture() {
  const store = new MemoryFounderOpsStore();
  for (let i = 0; i < 5; i++) {
    const row = await store.createSubmission(i % 2 ? "ko" : "en", true);
    const days = [1, 2, 10, 40, 0][i];
    const complete = i < 4;
    Object.assign(store.submissions.get(row.submissionId)!, {
      createdAt: date(days),
      updatedAt: date(days, complete ? 10 : 0),
      fullIntakeCompletedAt: complete ? date(days, 6) : null,
      caseType: i % 2 ? "Overseas Relocation" : "Entrepreneurship",
      answersJson: complete ? answers : {},
      researchUseConsent: i === 0,
      externalEvidenceMode: complete ? (i % 2 ? "fallback" : "live") : null,
      safetyMarginStructuredData: {
        band: ["strong", "developing", "weak", "unknown"][i],
      },
      structuralOutputJson: complete
        ? {
            currentStructuralPosture: {
              label: i % 2 ? "보존하며 검증" : "Stronger Transition Case",
            },
            changingPlays: Array.from({ length: i }, (_, n) => ({
              family: ["parallel-validation", "role-scope", "timing"][n],
            })),
          }
        : {},
    });
    for (const [n, [eventType]] of funnelStages.entries()) {
      if (!complete && n > 0) break;
      store.events.push({
        eventId: `${i}-${n}`,
        submissionId: row.submissionId,
        eventType,
        createdAt: date(days, n),
        metadataJson: {},
      });
    }
    if (complete) {
      store.events.push({
        eventId: `${i}-request`,
        submissionId: row.submissionId,
        eventType: "external_evidence_requested",
        createdAt: date(days, 3.5),
        metadataJson:
          i < 2
            ? {
                providerObservation: {
                  provider: "perplexity",
                  apiGeneration: "agent-api",
                  preset: "fast",
                  status: i ? "fallback" : "live",
                  reasonCode: i ? "provider_failure" : "live",
                  timedOut: !!i,
                  latencyMs: i ? 300 : 100,
                  completedAt: date(days, 3.7),
                },
              }
            : {},
      });
      store.events.push({
        eventId: `${i}-sync`,
        submissionId: row.submissionId,
        eventType:
          i % 2 ? "external_evidence_fallback" : "external_evidence_live",
        createdAt: date(days, 3.8),
        metadataJson: { derivedAnalysisSynced: true },
      });
    }
  }
  return store;
}
const summary = async (days: 7 | 30 | null = null) => {
  const data = await (await fixture()).readLaunchData();
  return buildLaunchOpsSummary(data.submissions, data.events, days, now);
};
afterEach(() => vi.unstubAllEnvs());

describe("Launch Ops aggregates", () => {
  it("counts unique journeys and intersection conversions, not repeated actions or invented visitors", async () => {
    const store = await fixture();
    store.events.push({ ...store.events[1], eventId: "repeat" });
    const data = await store.readLaunchData();
    const result = buildLaunchOpsSummary(
      data.submissions,
      data.events,
      null,
      now
    );
    expect(result.funnel.map(x => x.count)).toEqual([5, 4, 4, 4, 4, 4, 4]);
    expect(result.funnel[1]).toMatchObject({ previousRate: 80, startRate: 80 });
    expect(result.funnel[6]).toMatchObject({
      previousRate: 100,
      startRate: 80,
    });
    expect(result.cohortDescription).toContain(
      "Site visitors are not measured"
    );
  });
  it("uses created-journey cohorts for 7/30/all and excludes future/no-storage journeys", async () => {
    expect((await summary(7)).cohortSize).toBe(3);
    expect((await summary(30)).cohortSize).toBe(4);
    expect((await summary()).cohortSize).toBe(5);
    const data = await (await fixture()).readLaunchData();
    data.submissions[0].serviceStorageConsent = false;
    data.submissions[1].createdAt = date(-1);
    expect(
      buildLaunchOpsSummary(data.submissions, data.events, 7, now).cohortSize
    ).toBe(1);
  });
  it("returns unknown durations and null percentages when denominators are zero", () => {
    const result = buildLaunchOpsSummary([], [], 7, now);
    expect(
      result.funnel.every(
        x => x.count === 0 && x.startRate === null && x.previousRate === null
      )
    ).toBe(true);
    expect(result.quality).toMatchObject({
      averageCompletionMs: null,
      medianCompletionMs: null,
      completionTimeSamples: 0,
    });
    expect(result.research.percent).toBeNull();
    expect(result.evidence.livePercent).toBeNull();
    expect(result.lastPersistenceAt).toBeNull();
  });
  it("derives duration only from ordered intake events and labels inactivity conservatively", async () => {
    const result = await summary();
    expect(result.quality).toMatchObject({
      intakeCompletionRate: 100,
      dashboardReportRate: 100,
      reportPrintRate: 100,
      incomplete: 1,
      inactiveIncomplete: 0,
      completionTimeSamples: 4,
      averageCompletionMs: 60000,
      medianCompletionMs: 60000,
    });
  });
  it("reports case/posture/safety/changing/language distributions with multilingual posture normalization", async () => {
    const { patterns } = await summary();
    expect(patterns.caseType).toEqual({
      Entrepreneurship: 2,
      "Overseas Relocation": 2,
    });
    expect(patterns.posture).toEqual({
      "Stronger Transition Case": 2,
      "Preserve and Validate": 2,
    });
    expect(patterns.safetyMargin).toEqual({
      Strong: 1,
      Developing: 1,
      Constrained: 1,
      "Not Yet Established": 1,
    });
    expect(patterns.changingCount).toEqual({
      0: 1,
      1: 1,
      2: 1,
      3: 1,
      Unknown: 0,
    });
    expect(patterns.changingFamily).toEqual({
      "Parallel Validation": 3,
      "Role / Scope": 2,
      Timing: 1,
      Resource: 0,
      Pathway: 0,
    });
    expect(patterns.language).toEqual({ EN: 3, KR: 2, Unknown: 0 });
  });
  it("keeps historical provider telemetry unknown and distinguishes requests from persisted journeys", async () => {
    const { evidence } = await summary();
    expect(evidence).toMatchObject({
      requests: 4,
      liveRuns: 1,
      fallbackRuns: 1,
      unknownRuns: 2,
      liveJourneys: 2,
      fallbackJourneys: 2,
      livePercent: 50,
      fallbackPercent: 50,
      providerFailures: 1,
      timeouts: 1,
      averageLatencyMs: 200,
      recentLatencyMs: 100,
      recentLiveSuccess: date(1, 3.7),
    });
    const data = await (await fixture()).readLaunchData();
    data.events
      .filter(x => x.eventType === "external_evidence_requested")
      .forEach((x, i) => {
        x.metadataJson = {
          providerObservation: {
            provider: "perplexity",
            apiGeneration: "agent-api",
            status: "fallback",
            reasonCode:
              i % 2 ? "provider_not_configured" : "invalid_provider_response",
          },
        };
      });
    expect(
      buildLaunchOpsSummary(data.submissions, data.events, null, now).evidence
    ).toMatchObject({ invalidResponses: 2, missingConfiguration: 2 });
  });
  it("detects lifecycle, missing/stale derived state, answer shape, orphan and Changing problems without mutations", async () => {
    const data = await (await fixture()).readLaunchData();
    data.events.push({ ...data.events[0], eventId: "duplicate-start" });
    data.events.push({
      ...data.events[0],
      submissionId: "orphan",
      eventId: "orphan",
    });
    data.submissions[0].answersJson = { ...answers, "30": "extra" };
    data.submissions[1].answersJson = { "1": "short" };
    data.submissions[0].structuralOutputJson = {};
    data.submissions[0].jsonShapeErrors = ["external_evidence_json"];
    data.events = data.events.filter(
      x =>
        !(
          x.submissionId === data.submissions[0].submissionId &&
          x.eventType === "external_evidence_live"
        )
    );
    const before = JSON.stringify(data);
    const result = buildLaunchOpsSummary(
      data.submissions,
      data.events,
      null,
      now
    );
    expect(result.integrity).toEqual({
      suspiciousLifecycle: 1,
      completedAnswerCountMismatch: 2,
      completedMissingStructuralOutput: 1,
      liveMissingDerivedSync: 1,
      reportPrintMissingOrStaleDerived: 1,
      malformedJson: 1,
      finalChangingUnavailable: 1,
      orphanEvents: 1,
    });
    expect(JSON.stringify(data)).toBe(before);
  });
  it("flags missing and out-of-order stages without conversions above 100 percent", async () => {
    const data = await (await fixture()).readLaunchData();
    data.events = data.events.filter(
      x =>
        !(
          x.submissionId === data.submissions[0].submissionId &&
          x.eventType === "preview_started"
        )
    );
    data.events.find(x => x.eventType === "preview_completed")!.createdAt =
      date(2);
    const result = buildLaunchOpsSummary(
      data.submissions,
      data.events,
      null,
      now
    );
    expect(result.integrity.suspiciousLifecycle).toBe(1);
    expect(
      result.funnel.every(
        x => (x.startRate ?? 0) <= 100 && (x.previousRate ?? 0) <= 100
      )
    ).toBe(true);
  });
  it("separates operational cohorts from opt-in research and projects safe recent metadata", async () => {
    const store = await fixture();
    const data = await store.readLaunchData();
    const result = buildLaunchOpsSummary(
      data.submissions,
      data.events,
      null,
      now
    );
    expect(result.research).toEqual({
      consented: 1,
      completed: 4,
      percent: 25,
    });
    expect(
      buildResearchSummary(data.submissions, data.events).caseTypeDistribution
    ).toEqual({ Entrepreneurship: 1 });
    expect(JSON.stringify(result)).not.toContain("PRIVATE ANSWER");
    expect(result.recent[0]).not.toHaveProperty("answersJson");
  });
});

function recorder() {
  const state = {
    status: 200,
    body: undefined as any,
    headers: {} as Record<string, string>,
  };
  const response: ApiResponse = {
    status(code) {
      state.status = code;
      return response;
    },
    json(body) {
      state.body = body;
    },
    send(body) {
      state.body = body;
    },
    end() {},
    setHeader(key, value) {
      state.headers[key] = value;
    },
  };
  return { state, response };
}
const auth = () => {
  vi.stubEnv(
    "AMC_ADMIN_SESSION_SECRET",
    "test-session-secret-value-with-length"
  );
  return { cookie: `${ADMIN_COOKIE_NAME}=${createAdminSession()}` };
};
describe("Launch Ops privacy and provider event persistence", () => {
  it("requires authentication before reading aggregates", async () => {
    const store = await fixture();
    const read = vi.spyOn(store, "readLaunchData");
    const r = recorder();
    await handleAdminLaunchOps(
      { method: "GET", headers: {} },
      r.response,
      store
    );
    expect(r.state.status).toBe(401);
    expect(read).not.toHaveBeenCalled();
    expect(r.state.headers["Cache-Control"]).toBe("no-store");
  });
  it("serves authenticated aggregates, omits preview SHA and keeps list answers detail-only", async () => {
    const headers = auth();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "a".repeat(40));
    const store = await fixture();
    const r = recorder();
    await handleAdminLaunchOps(
      { method: "GET", headers, query: { window: "7" } },
      r.response,
      store
    );
    expect(r.state.body.windowDays).toBe(7);
    expect(r.state.body.configuration.preset).toBe("fast");
    expect(r.state.body.configuration).not.toHaveProperty("productionSha");
    await handleAdminSubmissions({ method: "GET", headers }, r.response, store);
    expect(JSON.stringify(r.state.body)).not.toContain("PRIVATE ANSWER");
    expect(r.state.body.submissions[0]).not.toHaveProperty(
      "structuralOutputJson"
    );
  });
  it("returns unavailable rather than fabricated zero metrics on database errors", async () => {
    const store = await fixture();
    vi.spyOn(store, "readLaunchData").mockRejectedValue(
      new Error("secret-host")
    );
    const r = recorder();
    await handleAdminLaunchOps(
      { method: "GET", headers: auth() },
      r.response,
      store
    );
    expect(r.state.body.backendAvailable).toBe(false);
    expect(r.state.body).not.toHaveProperty("funnel");
    expect(JSON.stringify(r.state.body)).not.toContain("secret-host");
  });
  it("annotates only a fresh matching request once, under service consent; never historical rows", async () => {
    const store = new MemoryFounderOpsStore();
    const row = await store.createSubmission("en", true);
    await store.addEvent(row.submissionId, "external_evidence_requested", {
      requestId: "new-request",
    });
    const before = structuredClone(store.submissions.get(row.submissionId));
    await store.annotateEvidenceRequest(row.submissionId, "wrong-id", {
      status: "live",
    });
    expect(store.events[0].metadataJson).not.toHaveProperty(
      "providerObservation"
    );
    await store.annotateEvidenceRequest(row.submissionId, "new-request", {
      status: "live",
    });
    await store.annotateEvidenceRequest(row.submissionId, "new-request", {
      status: "fallback",
    });
    expect(store.events[0].metadataJson.providerObservation).toEqual({
      status: "live",
    });
    expect(store.submissions.get(row.submissionId)).toEqual(before);
    store.events[0].metadataJson = { requestId: "old-request" };
    store.events[0].createdAt = new Date(Date.now() - 300000).toISOString();
    await store.annotateEvidenceRequest(row.submissionId, "old-request", {
      status: "live",
    });
    expect(store.events[0].metadataJson).not.toHaveProperty(
      "providerObservation"
    );
    store.events[0].createdAt = new Date().toISOString();
    store.submissions.get(row.submissionId)!.serviceStorageConsent = false;
    await store.annotateEvidenceRequest(row.submissionId, "old-request", {
      status: "live",
    });
    expect(store.events[0].metadataJson).not.toHaveProperty(
      "providerObservation"
    );
  });
  it("strips client-forged provider observation from the tracking API", async () => {
    const store = new MemoryFounderOpsStore();
    const row = await store.createSubmission("en", true);
    await trackFounderOps(
      {
        submissionId: row.submissionId,
        language: "en",
        serviceStorageConsent: true,
        eventType: "external_evidence_requested",
        metadata: {
          requestId: "test",
          providerObservation: { status: "live" },
        },
      },
      store
    );
    expect(store.events[0].metadataJson).toEqual({ requestId: "test" });
  });
});
