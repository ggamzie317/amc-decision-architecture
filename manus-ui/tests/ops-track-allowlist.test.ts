import { describe, expect, it, vi } from "vitest";

import { trackFounderOps } from "../server/founderOpsApi";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import type { FounderOpsStore } from "../server/founderOpsTypes";
import { handleTrack, type ApiResponse } from "../server/vercelFounderOps";
import {
  projectInteractiveMetadata,
  projectInteractivePatch,
  v2Identity,
} from "../shared/interactivePrivacy";

const SECRET = "PRIVATE_CUSTOMER_PROSE";

// Mirrors AmcInteractiveV2.tsx track(): identity-tagged metadata and a
// projected patch (raw-text columns present but empty).
function v2Request(
  eventType: string,
  patch: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {},
  extra: Record<string, unknown> = {}
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
      },
    }),
    ...extra,
  };
}

const rawFieldCases: Array<[string, unknown]> = [
  ["answersJson", { 1: SECRET }],
  ["missingPoint", SECRET],
  ["alternativePath", SECRET],
  ["externalEvidenceConfidence", "high"],
  ["decisionConditionsJson", [SECRET]],
  ["externalEvidenceJson", { url: SECRET }],
  ["existingFifwmStructuredData", { reading: SECRET }],
];

async function snapshot(store: MemoryFounderOpsStore) {
  return structuredClone(await store.readLaunchData());
}

async function startedV2(store: MemoryFounderOpsStore) {
  const result = await trackFounderOps(
    v2Request("preview_started", {}, {}, { newSubmission: true }),
    store
  );
  expect(result).toMatchObject({ ok: true, stored: true });
  return result.submissionId!;
}

function responseRecorder() {
  const recorded: { statusCode: number; body: unknown } = {
    statusCode: 0,
    body: undefined,
  };
  const response: ApiResponse = {
    status(code) {
      recorded.statusCode = code;
      return response;
    },
    json(body) {
      recorded.body = body;
    },
    send() {},
    end() {},
    setHeader() {},
  };
  return { response, recorded };
}

describe("public ops track route allowlist", () => {
  describe.each(rawFieldCases)("raw-text field %s", (field, value) => {
    it("is refused on a new journey and nothing is stored", async () => {
      const store = new MemoryFounderOpsStore();
      const before = await snapshot(store);
      const body = v2Request("preview_started", {}, {}, { newSubmission: true });
      const result = await trackFounderOps(
        { ...body, patch: { ...body.patch, [field]: value } },
        store
      );
      expect(result).toEqual({
        ok: false,
        stored: false,
        reason: "raw_text_not_accepted",
      });
      expect(await snapshot(store)).toEqual(before);
      expect(store.submissions.size).toBe(0);
      expect(store.events).toHaveLength(0);
    });

    it("is refused on an existing journey and the row and events are unchanged", async () => {
      const store = new MemoryFounderOpsStore();
      const submissionId = await startedV2(store);
      const before = await snapshot(store);
      const body = v2Request("full_intake_completed", {}, {}, { submissionId });
      const result = await trackFounderOps(
        { ...body, patch: { ...body.patch, [field]: value } },
        store
      );
      expect(result).toEqual({
        ok: false,
        stored: false,
        reason: "raw_text_not_accepted",
      });
      expect(await snapshot(store)).toEqual(before);
    });
  });

  it("treats the empty raw-text shapes the V2 client sends as no content", async () => {
    const store = new MemoryFounderOpsStore();
    const body = v2Request("preview_started", {}, {}, { newSubmission: true });
    expect(body.patch).toMatchObject({
      answersJson: {},
      missingPoint: null,
      alternativePath: null,
      decisionConditionsJson: [],
      existingFifwmStructuredData: {},
      externalEvidenceJson: {},
      externalEvidenceConfidence: null,
    });
    expect(await trackFounderOps(body, store)).toMatchObject({
      ok: true,
      stored: true,
    });
  });

  it("refuses a request without an interactive identity marker", async () => {
    const store = new MemoryFounderOpsStore();
    const before = await snapshot(store);
    for (const request of [
      { patch: { currentStage: "preview_started" } },
      { metadata: { experienceVersion: "legacy" } },
      { patch: { structuralOutputJson: { experienceVersion: "interactive-v3" } } },
      {},
    ])
      expect(
        await trackFounderOps(
          {
            language: "en",
            serviceStorageConsent: true,
            eventType: "preview_started",
            newSubmission: true,
            ...request,
          },
          store
        )
      ).toEqual({ ok: false, stored: false, reason: "unsupported_client" });
    expect(await snapshot(store)).toEqual(before);
  });

  it("does not modify an existing legacy row that holds answers and returns legacy_record", async () => {
    const store = new MemoryFounderOpsStore();
    const legacy = await store.createSubmission("en", true);
    await store.updateSubmission(legacy.submissionId, {
      answersJson: { 1: "historical answer" },
      missingPoint: "historical missing point",
      structuralOutputJson: { postureBasis: { why: "historical" } },
    });
    await store.addEvent(legacy.submissionId, "full_intake_completed", {});
    const before = await snapshot(store);
    const result = await trackFounderOps(
      v2Request(
        "dashboard_generated",
        { structuralOutputJson: { changingPlays: [{ family: "resource" }] } },
        {},
        { submissionId: legacy.submissionId }
      ),
      store
    );
    expect(result).toEqual({
      ok: false,
      stored: false,
      reason: "legacy_record",
    });
    expect(await snapshot(store)).toEqual(before);
  });

  it("does not modify an existing legacy row that holds only structural data", async () => {
    const store = new MemoryFounderOpsStore();
    const legacy = await store.createSubmission("en", true);
    await store.updateSubmission(legacy.submissionId, {
      structuralOutputJson: { why: "legacy structural prose" },
      safetyMarginStructuredData: { band: "strong", reading: "legacy" },
    });
    const before = await snapshot(store);
    const result = await trackFounderOps(
      v2Request("full_intake_started", {}, {}, { submissionId: legacy.submissionId }),
      store
    );
    expect(result).toEqual({ ok: false, stored: false, reason: "legacy_record" });
    expect(await snapshot(store)).toEqual(before);
  });

  it("keeps the V2 identity when the client marks itself only in metadata", async () => {
    const store = new MemoryFounderOpsStore();
    const result = await trackFounderOps(
      {
        eventType: "preview_started",
        newSubmission: true,
        language: "en",
        serviceStorageConsent: true,
        metadata: { ...v2Identity },
        patch: { currentStage: "preview_started" },
      },
      store
    );
    expect(result).toMatchObject({ ok: true, stored: true });
    const row = (await store.getSubmission((result as { submissionId: string }).submissionId))!.submission;
    expect(row.structuralOutputJson).toMatchObject(v2Identity);
  });

  it("stores a normal V2 journey with only allowlisted fields", async () => {
    const store = new MemoryFounderOpsStore();
    const submissionId = await startedV2(store);
    const completedAt = new Date().toISOString();
    expect(
      await trackFounderOps(
        v2Request(
          "full_intake_completed",
          {
            currentStage: "full_intake_completed",
            fullIntakeCompletedAt: completedAt,
            structuralOutputJson: {
              baselineBands: { financialRoom: "strong", constraintLoad: "material" },
            },
          },
          { selectedVariables: ["financialRoom"] },
          { submissionId }
        ),
        store
      )
    ).toMatchObject({ ok: true, stored: true, submissionId });
    expect(
      await trackFounderOps(
        v2Request(
          "dashboard_generated",
          {
            currentStage: "dashboard_generated",
            fullIntakeCompletedAt: completedAt,
            structuralOutputJson: {
              baselineBands: { financialRoom: "strong", constraintLoad: "material" },
              currentStructuralPosture: { label: "Preserve and Validate", sentence: SECRET },
              safetyMargin: { band: "developing", reading: SECRET },
              changingPlays: [{ family: "resource", move: SECRET }],
              decisionSwitches: [{ signal: SECRET }],
              externalEvidenceStatus: "unavailable",
              why: SECRET,
            },
          },
          {},
          { submissionId }
        ),
        store
      )
    ).toMatchObject({ ok: true, stored: true, submissionId });

    const detail = (await store.getSubmission(submissionId))!;
    expect(detail.events.map(event => event.eventType)).toEqual([
      "preview_started",
      "full_intake_completed",
      "dashboard_generated",
    ]);
    const row = detail.submission;
    expect(row.structuralOutputJson).toEqual({
      ...v2Identity,
      baselineBands: { financialRoom: "strong", constraintLoad: "material" },
      changingPlays: [{ family: "resource" }],
      changingCount: 1,
      completedIntakeQuestionCount: 8,
      externalEvidenceStatus: "unavailable",
      currentStructuralPosture: { label: "Preserve and Validate" },
      safetyMargin: { band: "developing" },
      decisionSwitchCount: 1,
    });
    expect(row).toMatchObject({
      caseType: "Entrepreneurship",
      currentStage: "dashboard_generated",
      fullIntakeCompletedAt: completedAt,
      answersJson: {},
      missingPoint: null,
      alternativePath: null,
      decisionConditionsJson: [],
      externalEvidenceJson: {},
      existingFifwmStructuredData: {},
      externalEvidenceConfidence: null,
      safetyMarginStructuredData: { band: "developing" },
    });
    expect(JSON.stringify(detail)).not.toContain(SECRET);
    expect(detail.events[1].metadataJson).toEqual({
      ...v2Identity,
      selectedVariables: ["financialRoom"],
    });
  });

  it("drops unknown metadata keys", async () => {
    const store = new MemoryFounderOpsStore();
    const submissionId = await startedV2(store);
    await trackFounderOps(
      {
        submissionId,
        language: "en",
        serviceStorageConsent: true,
        eventType: "language_changed",
        metadata: {
          ...v2Identity,
          from: "en",
          to: "ko",
          optionA: SECRET,
          note: SECRET,
          nested: { text: SECRET },
          providerObservation: { status: "live" },
        },
        patch: { structuralOutputJson: { ...v2Identity } },
      },
      store
    );
    const event = store.events.at(-1)!;
    expect(event.eventType).toBe("language_changed");
    expect(event.metadataJson).toEqual({ ...v2Identity, from: "en", to: "ko" });
    expect(JSON.stringify(store.events)).not.toContain(SECRET);
  });

  it("refuses raw text before checking the backend, even when the store is unavailable", async () => {
    const unavailable: FounderOpsStore = {
      available: false,
      createSubmission: vi.fn(),
      updateSubmission: vi.fn(),
      addEvent: vi.fn(),
      listSubmissions: vi.fn(),
      getSubmission: vi.fn(),
    } as unknown as FounderOpsStore;
    const body = v2Request("preview_started", {}, {}, { newSubmission: true });
    expect(
      await trackFounderOps(
        { ...body, patch: { ...body.patch, answersJson: { 1: SECRET } } },
        unavailable
      )
    ).toEqual({ ok: false, stored: false, reason: "raw_text_not_accepted" });
    expect(
      await trackFounderOps(
        { language: "en", serviceStorageConsent: true, eventType: "preview_started" },
        unavailable
      )
    ).toEqual({ ok: false, stored: false, reason: "unsupported_client" });
    expect(await trackFounderOps(body, unavailable)).toEqual({
      ok: true,
      stored: false,
      reason: "backend_unavailable",
    });
    for (const method of [
      "createSubmission",
      "updateSubmission",
      "addEvent",
      "getSubmission",
    ] as const)
      expect(unavailable[method]).not.toHaveBeenCalled();
  });

  it("answers refusals with HTTP 400 through handleTrack and stores nothing", async () => {
    const store = new MemoryFounderOpsStore();
    const legacy = await store.createSubmission("en", true);
    await store.updateSubmission(legacy.submissionId, {
      answersJson: { 1: "historical answer" },
    });
    const before = await snapshot(store);
    const body = v2Request("preview_started", {}, {}, { newSubmission: true });
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ ...body, patch: { ...body.patch, missingPoint: SECRET } }, "raw_text_not_accepted"],
      [{ language: "en", serviceStorageConsent: true, eventType: "preview_started" }, "unsupported_client"],
      [v2Request("full_intake_started", {}, {}, { submissionId: legacy.submissionId }), "legacy_record"],
    ];
    for (const [requestBody, reason] of cases) {
      const { response, recorded } = responseRecorder();
      await handleTrack({ method: "POST", body: requestBody }, response, store);
      expect(recorded.statusCode).toBe(400);
      expect(recorded.body).toEqual({ ok: false, stored: false, reason });
    }
    expect(await snapshot(store)).toEqual(before);

    const { response, recorded } = responseRecorder();
    await handleTrack({ method: "POST", body }, response, store);
    expect(recorded.statusCode).toBe(200);
    expect(recorded.body).toMatchObject({ ok: true, stored: true });
  });
});
