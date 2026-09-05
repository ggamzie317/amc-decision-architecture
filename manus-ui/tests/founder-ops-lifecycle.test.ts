import { describe, expect, it } from "vitest";

import {
  createFounderOpsJourneyTracker,
  type TrackJourneyInput,
} from "../client/src/data/amcFounderOps";
import {
  buildFounderOpsDerivedPatch,
  founderOpsDerivedFingerprint,
} from "../client/src/data/amcFounderOpsDerived";
import {
  buildProductApplicationV3,
  buildUnavailableFifwm,
  type ProductApplicationBuildInput,
  type StructuralStrength,
} from "../client/src/data/amcProductApplicationV3";
import type { ExternalSnapshot } from "../client/src/data/customerLanguageFirewall";
import { trackFounderOps } from "../server/founderOpsApi";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";

const ACTIVE_ID_KEY = "amc_launch_v3_active_submission_id";
const LEGACY_ID_KEY = "amc_launch_v3_submission_id";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function createStoreBackedTracker(
  store: MemoryFounderOpsStore,
  sessionStorage: MemoryStorage,
  legacyStorage = new MemoryStorage(),
) {
  return createFounderOpsJourneyTracker({
    getSessionStorage: () => sessionStorage,
    getLegacyStorage: () => legacyStorage,
    fetcher: async (_url, init) => {
      const body = JSON.parse(String(init.body)) as Parameters<typeof trackFounderOps>[0];
      const result = await trackFounderOps(body, store);
      return { json: async () => result };
    },
  });
}

function journeyEvent(
  eventType: TrackJourneyInput["eventType"],
  patch: Record<string, unknown> = {},
): TrackJourneyInput {
  return {
    eventType,
    language: "en",
    serviceStorageConsent: true,
    patch,
  };
}

function allAnswers(prefix: string) {
  return Object.fromEntries(
    Array.from({ length: 29 }, (_, index) => [index + 1, `${prefix} answer ${index + 1}`]),
  );
}

function externalSnapshot(
  status: ExternalSnapshot["status"],
  confidence: ExternalSnapshot["confidence"],
): ExternalSnapshot {
  return {
    status,
    confidence,
    generatedAtLabel: `${status}-snapshot`,
    externalSignals: [],
    sourceNotes: [],
    uncertaintyNotes: [],
    implication: `${status} implication`,
  };
}

function productInput(
  externalValidation: StructuralStrength,
  safetyMargin: StructuralStrength = "strong",
): ProductApplicationBuildInput {
  const source = externalValidation === "unknown" ? "unavailable" : "live-external-evidence";
  const financialRoom = safetyMargin === "developing" ? "developing" : "strong";
  const downsideExposure = safetyMargin === "developing" ? "moderate" : "low";
  const safetyMarginInputs = {
    financialRoom: { band: financialRoom, source: "current-user-structured" as const },
    reversibility: { band: "strong" as const, source: "current-user-structured" as const },
    downsideExposure: { band: downsideExposure, source: "current-user-structured" as const },
  };
  return {
    language: "en",
    caseType: "Entrepreneurship",
    optionA: "Remain employed",
    optionB: "Build the venture",
    answers: { 14: "Paid demand", 19: "Six months runway", 20: "Return path", 21: "Capped downside" },
    fifwm: buildUnavailableFifwm("en"),
    fifwmSource: "unavailable",
    safetyMarginInputs,
    structuralSignals: {
      externalValidation: { band: externalValidation, source },
      internalReadiness: { band: "unknown", source: "unavailable" },
      safetyMargin: { band: safetyMargin, source: "current-user-structured" },
      reversibility: { band: "strong", source: "current-user-structured" },
      optionBSupport: { band: "unknown", source: "unavailable" },
      structuralRisk: { band: "low", source: "current-user-structured" },
      constraintLoad: { band: "unknown", source: "unavailable" },
      missingPointImpact: { band: "unknown", source: "unavailable" },
    },
    missingPoint: "Repeatable paid demand",
    missingPointWhy: "Demand must be observed before commitment.",
    primaryRisk: "Demand",
    primaryRiskMeaning: "Demand may not repeat.",
    decisionConditions: ["Three paid pilots", "Runway remains intact"],
    validationFocus: "Paid demand",
    externalImplication: `${externalValidation} market evidence`,
    plan: [
      { period: "30", title: "Test", action: "Run pilots", output: "Paid evidence" },
      { period: "60", title: "Learn", action: "Review repeats", output: "Repeat signal" },
      { period: "90", title: "Decide", action: "Apply switch", output: "Decision" },
    ],
  };
}

function derivedPatch(
  externalValidation: StructuralStrength,
  status: ExternalSnapshot["status"],
  safetyMargin: StructuralStrength = "strong",
) {
  const input = productInput(externalValidation, safetyMargin);
  return buildFounderOpsDerivedPatch({
    productApplication: buildProductApplicationV3(input),
    externalSnapshot: externalSnapshot(status, status === "live" ? "high" : "low"),
    language: "en",
    caseType: input.caseType,
    missingPoint: input.missingPoint,
    decisionConditions: input.decisionConditions,
    primaryRisk: { name: input.primaryRisk, meaning: input.primaryRiskMeaning },
    comparisonRows: [{ dimension: "runway", optionA: "protected", optionB: "tested" }],
    internalSignals: [{ label: "readiness", value: "unknown" }],
  });
}

describe("Founder Ops journey lifecycle", () => {
  it("keeps consecutive journeys isolated and leaves the first journey byte-for-byte unchanged", async () => {
    const store = new MemoryFounderOpsStore();
    const sessionStorage = new MemoryStorage();
    const track = createStoreBackedTracker(store, sessionStorage);

    await track({ ...journeyEvent("preview_started"), newSubmission: true });
    const journeyA = sessionStorage.getItem(ACTIVE_ID_KEY)!;
    await track(journeyEvent("full_intake_completed", { answersJson: allAnswers("Journey A") }));
    await track(journeyEvent("dashboard_generated", { structuralOutputJson: { changingPlays: [] } }));
    await track(journeyEvent("detailed_report_opened"));
    await track(journeyEvent("print_save_clicked"));
    const journeyASnapshot = await store.getSubmission(journeyA);

    await track({ ...journeyEvent("preview_started"), newSubmission: true });
    const journeyB = sessionStorage.getItem(ACTIVE_ID_KEY)!;
    await track(journeyEvent("full_intake_completed", { answersJson: allAnswers("Journey B") }));
    await track(journeyEvent("dashboard_generated", { structuralOutputJson: { changingPlays: [{ family: "resource" }] } }));

    expect(journeyB).not.toBe(journeyA);
    expect(store.submissions).toHaveLength(2);
    expect(await store.getSubmission(journeyA)).toEqual(journeyASnapshot);
    expect((await store.getSubmission(journeyB))?.submission.answersJson).toEqual(allAnswers("Journey B"));
  });

  it("resumes one active journey after refresh without duplicating preview_started", async () => {
    const store = new MemoryFounderOpsStore();
    const sessionStorage = new MemoryStorage();
    const firstPage = createStoreBackedTracker(store, sessionStorage);
    await firstPage({ ...journeyEvent("preview_started"), newSubmission: true });
    const activeId = sessionStorage.getItem(ACTIVE_ID_KEY);

    const refreshedPage = createStoreBackedTracker(store, sessionStorage);
    await refreshedPage({ ...journeyEvent("preview_started"), newSubmission: true });
    await refreshedPage(journeyEvent("full_intake_started"));

    expect(store.submissions).toHaveLength(1);
    expect(sessionStorage.getItem(ACTIVE_ID_KEY)).toBe(activeId);
    expect((await store.getSubmission(activeId!))?.events.map(event => event.eventType)).toEqual([
      "preview_started",
      "full_intake_started",
    ]);
  });

  it("ignores and removes a legacy localStorage ID in a new browser session", async () => {
    const store = new MemoryFounderOpsStore();
    const historical = await store.createSubmission("en", true);
    const historicalSnapshot = await store.getSubmission(historical.submissionId);
    const sessionStorage = new MemoryStorage();
    const legacyStorage = new MemoryStorage();
    legacyStorage.setItem(LEGACY_ID_KEY, historical.submissionId);

    const track = createStoreBackedTracker(store, sessionStorage, legacyStorage);
    await track({ ...journeyEvent("preview_started"), newSubmission: true });

    expect(sessionStorage.getItem(ACTIVE_ID_KEY)).not.toBe(historical.submissionId);
    expect(legacyStorage.getItem(LEGACY_ID_KEY)).toBeNull();
    expect(await store.getSubmission(historical.submissionId)).toEqual(historicalSnapshot);
  });

  it("serializes a completed journey and the next journey without cross-writing events", async () => {
    const store = new MemoryFounderOpsStore();
    const sessionStorage = new MemoryStorage();
    const track = createStoreBackedTracker(store, sessionStorage);
    await track({ ...journeyEvent("preview_started"), newSubmission: true });
    const firstId = sessionStorage.getItem(ACTIVE_ID_KEY)!;

    const completed = track(journeyEvent("dashboard_generated", { caseType: "First" }));
    const nextPreview = track({ ...journeyEvent("preview_started", { caseType: "Second" }), newSubmission: true });
    const nextIntake = track(journeyEvent("full_intake_started"));
    await Promise.all([completed, nextPreview, nextIntake]);
    const secondId = sessionStorage.getItem(ACTIVE_ID_KEY)!;

    expect(secondId).not.toBe(firstId);
    expect((await store.getSubmission(firstId))?.events.map(event => event.eventType)).toEqual([
      "preview_started",
      "dashboard_generated",
    ]);
    expect((await store.getSubmission(secondId))?.events.map(event => event.eventType)).toEqual([
      "preview_started",
      "full_intake_started",
    ]);
  });

  it("does not fall back to an old journey when new-journey creation fails", async () => {
    const sessionStorage = new MemoryStorage();
    sessionStorage.setItem(ACTIVE_ID_KEY, "AMC-20260905-AAAAAAAA");
    sessionStorage.setItem("amc_launch_v3_active_journey_status", "completed");
    const requests: unknown[] = [];
    const track = createFounderOpsJourneyTracker({
      getSessionStorage: () => sessionStorage,
      getLegacyStorage: () => null,
      fetcher: async (_url, init) => {
        requests.push(JSON.parse(String(init.body)));
        throw new Error("network unavailable");
      },
    });

    await track({ ...journeyEvent("preview_started"), newSubmission: true });
    await track(journeyEvent("full_intake_started"));

    expect(requests).toHaveLength(1);
    expect(sessionStorage.getItem(ACTIVE_ID_KEY)).toBeNull();
  });

  it("forces a new row on the server even when a previous ID is supplied", async () => {
    const store = new MemoryFounderOpsStore();
    const historical = await store.createSubmission("en", true);
    const historicalSnapshot = await store.getSubmission(historical.submissionId);

    const result = await trackFounderOps({
      submissionId: historical.submissionId,
      newSubmission: true,
      language: "en",
      serviceStorageConsent: true,
      eventType: "preview_started",
      patch: { caseType: "New case" },
    }, store);

    expect(result.submissionId).not.toBe(historical.submissionId);
    expect(await store.getSubmission(historical.submissionId)).toEqual(historicalSnapshot);
    expect(store.submissions).toHaveLength(2);
  });
});

describe("Founder Ops final derived-state synchronization", () => {
  it("persists the recomputed posture and Changing plays after terminal live evidence", async () => {
    const store = new MemoryFounderOpsStore();
    const created = await trackFounderOps({
      language: "en",
      serviceStorageConsent: true,
      eventType: "preview_started",
      newSubmission: true,
    }, store);
    const initial = derivedPatch("unknown", "unverified", "developing");
    const final = derivedPatch("developing", "live", "developing");
    const answersJson = { 1: "Current case", 19: "Six months", 20: "Strong return", 21: "Capped" };
    expect(initial.structuralOutputJson.changingPlays).toHaveLength(1);
    expect(final.structuralOutputJson.changingPlays).toHaveLength(2);

    await trackFounderOps({
      submissionId: created.submissionId,
      language: "en",
      serviceStorageConsent: true,
      eventType: "dashboard_generated",
      patch: { ...initial, answersJson },
    }, store);
    await trackFounderOps({
      submissionId: created.submissionId,
      language: "en",
      serviceStorageConsent: true,
      eventType: "external_evidence_live",
      metadata: { derivedAnalysisSynced: true },
      patch: final,
    }, store);

    const persisted = await store.getSubmission(created.submissionId!);
    expect(persisted?.submission.structuralOutputJson).toEqual(final.structuralOutputJson);
    expect(persisted?.submission.externalEvidenceMode).toBe("live");
    expect(persisted?.submission.externalEvidenceJson).toEqual(final.externalEvidenceJson);
    expect(persisted?.submission.answersJson).toEqual(answersJson);
    expect(persisted?.events.at(-1)).toMatchObject({
      eventType: "external_evidence_live",
      metadataJson: { derivedAnalysisSynced: true },
    });
  });

  it("clears stale alternatives when the final current-case result has zero Changing plays", async () => {
    const store = new MemoryFounderOpsStore();
    const created = await trackFounderOps({
      language: "en",
      serviceStorageConsent: true,
      eventType: "preview_started",
      newSubmission: true,
    }, store);
    const provisional = derivedPatch("developing", "live");
    const final = derivedPatch("strong", "live");
    expect(provisional.structuralOutputJson.changingPlays).toHaveLength(1);
    expect(final.structuralOutputJson.changingPlays).toEqual([]);
    expect(final.alternativePath).toBeNull();

    await trackFounderOps({
      submissionId: created.submissionId,
      language: "en",
      serviceStorageConsent: true,
      eventType: "dashboard_generated",
      patch: provisional,
    }, store);
    await trackFounderOps({
      submissionId: created.submissionId,
      language: "en",
      serviceStorageConsent: true,
      eventType: "external_evidence_live",
      patch: final,
    }, store);

    const persisted = await store.getSubmission(created.submissionId!);
    expect(persisted?.submission.structuralOutputJson.changingPlays).toEqual([]);
    expect(persisted?.submission.alternativePath).toBeNull();
    expect(founderOpsDerivedFingerprint(final)).not.toBe(founderOpsDerivedFingerprint(provisional));
  });
});
