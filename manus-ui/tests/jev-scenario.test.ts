import { describe, it, expect, vi } from "vitest";
const oidc = vi.hoisted(() => vi.fn(() => undefined as string | undefined));
vi.mock("@vercel/oidc", () => ({ getVercelOidcTokenSync: oidc }));
import {
  createJevScenarioHandler,
  jevInputSchema,
  gatewayCredential,
} from "../server/jevScenario";
import { metrics } from "../server/jevScenarioContract";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { trackFounderOps, buildSubmissionsCsv } from "../server/founderOpsApi";
import {
  identity,
  projectInteractivePatch,
  projectInteractiveMetadata,
} from "../shared/interactivePrivacy";
import { buildDataQuality } from "../server/founderOpsHealth";
import { buildLaunchOpsSummary } from "../server/launchOpsAnalytics";
const baselineBands = {
  financialRoom: "developing",
  reversibility: "strong",
  downsideExposure: "low",
  internalReadiness: "developing",
  optionBSupport: "weak",
  constraintLoad: "material",
  externalValidation: "unknown",
};
const packet = {
  caseType: "Entrepreneurship",
  baselineBands,
  scenarioBands: { ...baselineBands, financialRoom: "strong" },
  changedVariables: ["financialRoom"],
  baselinePosture: "Preserve and Validate",
  scenarioPosture: "Preserve and Validate",
  safetyMargin: ["developing", "strong"],
  changingFamilies: [["parallel-validation"], ["resource"]],
};
function response() {
  return {
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
  };
}
async function setup() {
  const store = new MemoryFounderOpsStore();
  const s = await store.createSubmission("en", true);
  await store.updateSubmission(
    s.submissionId,
    projectInteractivePatch({
      caseType: "Entrepreneurship",
      fullIntakeCompletedAt: new Date().toISOString(),
      structuralOutputJson: {
        ...identity,
        baselineBands,
        currentStructuralPosture: { label: "Preserve and Validate" },
        safetyMargin: { band: "developing" },
        changingPlays: [{ family: "resource" }],
      },
    })
  );
  return { store, id: s.submissionId };
}
async function call(
  handler: ReturnType<typeof createJevScenarioHandler>,
  id: string,
  body: unknown = packet,
  method = "POST"
) {
  let value: any,
    status = 0;
  await handler({ method, body, headers: { "x-amc-submission-id": id } }, {
    setHeader: vi.fn(),
    status(n: number) {
      status = n;
      return this;
    },
    json(v: unknown) {
      value = v;
    },
    end: vi.fn(),
    send: vi.fn(),
  } as any);
  return { status, value };
}
describe("approved JEV boundary", () => {
  it("dispatches only canonical structural packet and returns qualitative fields without mutating baseline", async () => {
    const { store, id } = await setup();
    const before = structuredClone(store.submissions.get(id));
    const fetcher = vi.fn(async () => new Response(JSON.stringify(response())));
    const handler = createJevScenarioHandler({
      store,
      enabled: true,
      credential: () => "TEST_ONLY",
      fetcher,
    });
    const result = await call(handler, id);
    expect(result.value.status).toBe("available");
    expect(JSON.stringify(result.value)).not.toMatch(
      /confidence|probabilities|0\.7/
    );
    expect(store.submissions.get(id)).toEqual(before);
    const [url, init] = fetcher.mock.calls[0] as any;
    expect(url).toBe("https://ai-gateway.vercel.sh/typesafe/v1/systemone");
    expect(init.headers).toEqual({
      Authorization: "Bearer TEST_ONLY",
      "Content-Type": "application/json",
    });
    const sent = JSON.parse(init.body);
    expect(sent.model).toBe("typesafe-ai/jev");
    expect(sent.state).toEqual(packet);
    expect(init.body).not.toContain(id);
    expect(store.events.map(e => e.eventType)).toEqual([
      "jev_assessment_requested",
      "jev_assessment_completed",
    ]);
    expect(Object.keys(store.events[1].metadataJson)).toHaveLength(3);
  });
  it.each([
    "answers",
    "options",
    "submissionId",
    "userId",
    "ip",
    "evidence",
    "optionA",
    "language",
  ])("rejects unexpected %s before transport", async key => {
    const { store, id } = await setup();
    const fetcher = vi.fn();
    const handler = createJevScenarioHandler({
      store,
      enabled: true,
      credential: () => "test",
      fetcher,
    });
    expect(
      (await call(handler, id, { ...packet, [key]: "PRIVATE" })).status
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    expect(store.events).toHaveLength(0);
  });
  it("rejects nested prose, oversized arrays, arbitrary categorical labels and inconsistent changes", () => {
    expect(
      jevInputSchema.safeParse({
        ...packet,
        baselineBands: { ...baselineBands, reason: "PRIVATE" },
      }).success
    ).toBe(false);
    expect(
      jevInputSchema.safeParse({ ...packet, caseType: "PRIVATE" }).success
    ).toBe(false);
    expect(
      jevInputSchema.safeParse({ ...packet, changedVariables: [] }).success
    ).toBe(false);
    expect(
      jevInputSchema.safeParse({
        ...packet,
        changingFamilies: [Array(6).fill("resource"), []],
      }).success
    ).toBe(false);
  });
  it.each([
    "missing-key",
    "disabled",
    "http",
    "model",
    "routing",
    "distribution",
    "extra",
    "fallback",
    "oversize",
    "malformed",
    "timeout",
  ])("fails soft for %s", async failure => {
    const { store, id } = await setup();
    const body: any = response();
    if (failure === "model") body.model = "other";
    if (failure === "routing")
      body.provider_metadata.gateway.routing.finalProvider = "other";
    if (failure === "distribution")
      body.answers.evidenceSupport.probabilities.high = 0.9;
    if (failure === "extra") body.answers.evidenceSupport.prose = "PRIVATE";
    const fetcher = vi.fn(async (_url: any, init: any) => {
      if (failure === "timeout")
        return await new Promise<Response>((_, reject) =>
          init.signal.addEventListener("abort", () =>
            reject(new Error("timeout"))
          )
        );
      return new Response(
        failure === "malformed"
          ? "bad"
          : failure === "oversize"
            ? "x".repeat(8193)
            : JSON.stringify(body),
        {
          status: failure === "http" ? 500 : 200,
          headers:
            failure === "fallback"
              ? { "x-ai-gateway-evaluation-fallback-triggered": "true" }
              : {},
        }
      );
    });
    const h = createJevScenarioHandler({
      store,
      enabled: failure !== "disabled",
      credential: () => (failure === "missing-key" ? undefined : "test"),
      fetcher,
      timeoutMs: 5,
    });
    expect((await call(h, id)).value).toEqual({ status: "unavailable" });
    expect(store.events.at(-1)?.eventType).toBe("jev_assessment_unavailable");
    expect(JSON.stringify(store.events)).not.toMatch(
      /PRIVATE|probabilities|confidence/
    );
    if (["missing-key", "disabled"].includes(failure))
      expect(fetcher).not.toHaveBeenCalled();
  });
  it("deduplicates concurrent requests, reserves across handlers, stops after six dispatches", async () => {
    const { store, id } = await setup();
    let release!: () => void;
    const waiting = new Promise<void>(resolve => (release = resolve));
    const fetcher = vi.fn(async () => {
      await waiting;
      return new Response(JSON.stringify(response()));
    });
    const opts = { store, enabled: true, credential: () => "test", fetcher };
    const h = createJevScenarioHandler(opts);
    const first = call(h, id),
      second = call(h, id);
    release();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await call(createJevScenarioHandler(opts), id)).value.status).toBe(
      "unavailable"
    );
    for (let i = 0; i < 7; i++) {
      const s = await setup();
      store.submissions.set(s.id, s.store.submissions.get(s.id)!);
      await call(h, s.id);
    }
    expect(fetcher).toHaveBeenCalledTimes(6);
  });
  it("refuses missing baseline and non-POST without external work", async () => {
    const fetcher = vi.fn();
    const h = createJevScenarioHandler({
      store: new MemoryFounderOpsStore(),
      enabled: true,
      credential: () => "test",
      fetcher,
    });
    expect((await call(h, "bad")).value.status).toBe("unavailable");
    expect((await call(h, "bad", packet, "GET")).status).toBe(405);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses API key first and safely tolerates absent request-context OIDC", () => {
    const old = process.env.AI_GATEWAY_API_KEY;
    try {
      process.env.AI_GATEWAY_API_KEY = "TEST_ONLY";
      expect(gatewayCredential()).toBe("TEST_ONLY");
      delete process.env.AI_GATEWAY_API_KEY;
      expect(() => gatewayCredential()).not.toThrow();
      oidc
        .mockReturnValueOnce("FIRST_REQUEST_TOKEN")
        .mockReturnValueOnce("SECOND_REQUEST_TOKEN");
      expect(gatewayCredential()).toBe("FIRST_REQUEST_TOKEN");
      expect(gatewayCredential()).toBe("SECOND_REQUEST_TOKEN");
    } finally {
      if (old === undefined) delete process.env.AI_GATEWAY_API_KEY;
      else process.env.AI_GATEWAY_API_KEY = old;
    }
  });
});
describe("interactive privacy", () => {
  it("projects all narrative locations out at client and server, with persistent schema downgrade protection", async () => {
    const { store, id } = await setup();
    const secret = "PRIVATE_CUSTOMER_SENTINEL";
    const malicious = {
      answersJson: { 1: secret },
      missingPoint: secret,
      alternativePath: secret,
      decisionConditionsJson: [secret],
      existingFifwmStructuredData: { reading: secret },
      externalEvidenceJson: { url: secret },
      structuralOutputJson: {
        ...identity,
        completedIntakeQuestionCount: 15,
        baselineBands,
        currentStructuralPosture: {
          label: "Preserve and Validate",
          sentence: secret,
        },
        safetyMargin: { band: "developing", reading: secret },
        changingPlays: [{ family: "resource", move: secret }],
        decisionSwitches: [{ signal: secret }],
        why: secret,
        decisionStructure: { optionA: secret },
      },
    };
    expect(JSON.stringify(projectInteractivePatch(malicious))).not.toContain(
      secret
    );
    await trackFounderOps(
      {
        submissionId: id,
        serviceStorageConsent: true,
        eventType: "dashboard_generated",
        patch: malicious,
        metadata: { raw: secret, requestId: secret },
      },
      store
    );
    await trackFounderOps(
      {
        submissionId: id,
        serviceStorageConsent: true,
        eventType: "detailed_report_opened",
        patch: {
          answersJson: { 1: secret },
          structuralOutputJson: {
            experienceVersion: "legacy",
            intakeSchemaVersion: "29",
            why: secret,
          },
        },
      },
      store
    );
    const row = store.submissions.get(id)!;
    expect(JSON.stringify(row)).not.toContain(secret);
    expect(row.structuralOutputJson).toMatchObject({
      ...identity,
      baselineBands,
      completedIntakeQuestionCount: 15,
      decisionSwitchCount: 1,
    });
    expect(row.answersJson).toEqual({});
    expect(JSON.stringify(store.events)).not.toContain(secret);
    expect(buildSubmissionsCsv([row], true)).not.toContain(secret);
    expect(buildDataQuality([row]).completeFullIntake).toBe(1);
    expect(
      buildLaunchOpsSummary([row], store.events, null).integrity
        .completedAnswerCountMismatch
    ).toBe(0);
  });
  it("does not consider missing session completion valid and retains legacy answer behavior", async () => {
    const { store, id } = await setup();
    const row = store.submissions.get(id)!;
    row.answersJson = Object.fromEntries(Array.from({length:15},(_,i)=>[String(i+1), ""]));
      expect(buildDataQuality([row]).completeFullIntake).toBe(0);
      row.answersJson={};
      delete row.structuralOutputJson.completedIntakeQuestionCount;
    expect(buildDataQuality([row]).completeFullIntake).toBe(0);
    const legacy = await store.createSubmission("ko", true);
    await trackFounderOps(
      {
        submissionId: legacy.submissionId,
        serviceStorageConsent: true,
        eventType: "full_intake_completed",
        patch: { answersJson: { 1: "legacy written answer" } },
      },
      store
    );
    expect(store.submissions.get(legacy.submissionId)?.answersJson[1]).toBe(
      "legacy written answer"
    );
    expect(
      projectInteractiveMetadata({ optionA: "PRIVATE", probability: 0.7 })
    ).toEqual(identity);
  });
});
