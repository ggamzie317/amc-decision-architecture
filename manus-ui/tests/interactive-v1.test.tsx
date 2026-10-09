import { createFounderOpsJourneyTracker } from "../client/src/data/amcFounderOps";
import {
  buildOfflineScenarioPacket,
  parseOfflineGatewayAdvisory,
  metrics,
} from "../server/jevScenarioContract";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import {
  adaptIntake15,
  completedIntake15,
  intake15Groups,
  intake15Questions,
  intake15SelectorMap,
  INTAKE_V4_SCHEMA,
} from "../client/src/data/amcIntakeV4";
import {
  buildCurrentCaseStructuralSignals,
  type CurrentCaseStructuredSelections,
} from "../client/src/data/amcCurrentCaseStructuralSignals";
import {
  buildProductApplicationV3,
  buildUnavailableFifwm,
  derivePostureAssessment,
  deriveSafetyMarginCore,
  type ProductApplicationBuildInput,
} from "../client/src/data/amcProductApplicationV3";
import {
  applyScenarioOverrides,
  evaluateScenario,
  updateScenario,
  scenarioImpact,
} from "../client/src/data/amcScenario";
import {
  createJevSession,
  makeJevInput,
  parseJevAdvisory,
} from "../client/src/data/amcJevAdvisory";
import InteractiveSimulator from "../client/src/components/InteractiveSimulator";
import { detectCaseType } from "../client/src/pages/AmcWebMvp";
import { trackFounderOps } from "../server/founderOpsApi";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { buildResearchSummary } from "../server/founderOpsAnalytics";
import {
  buildSimulatorAnalytics,
  expectedIntakeAnswers,
} from "../server/simulatorAnalytics";
import { buildDataQuality } from "../server/founderOpsHealth";
import { buildLaunchOpsSummary } from "../server/launchOpsAnalytics";
import type { ExternalSnapshot } from "../client/src/data/customerLanguageFirewall";
(globalThis as any).React = React;
const preview = {
  decision: "A career choice",
  optionA: "Current role",
  optionB: "New direction",
  pull: "Learning",
  constraint: "Time",
  risk: "Exposure",
  condition: "Evidence",
};
const raw = Object.fromEntries(
  intake15Questions.map(q => [q.id, `Current evidence for ${q.id}`])
);
// Independent explicit fixture, not generated through the adapter under test.
const legacy = {
  1: preview.decision,
  2: raw[1],
  3: raw[1],
  4: raw[2],
  5: preview.optionA,
  6: raw[3],
  7: raw[3],
  8: preview.optionB,
  9: raw[4],
  10: raw[4],
  11: raw[5],
  12: raw[5],
  13: raw[5],
  14: raw[6],
  15: raw[7],
  16: raw[7],
  17: raw[8],
  18: raw[8],
  19: raw[9],
  20: raw[10],
  21: raw[11],
  22: raw[12],
  23: raw[12],
  24: raw[12],
  25: raw[13],
  26: raw[13],
  27: raw[13],
  28: raw[14],
  29: raw[15],
};
const selections: CurrentCaseStructuredSelections = {
  17: "developing",
  19: "developing",
  20: "strong",
  21: "low",
  23: "developing",
  25: "material",
};
const evidence = {
  status: "live",
  confidence: "high",
  externalSignals: [{ direction: "supportive" }],
  implication: "Bounded validation remains necessary.",
} as ExternalSnapshot;
function input(
  answers = legacy,
  selected = selections,
  language: "en" | "ko" = "en",
  caseType = "General Career Reconfiguration"
): ProductApplicationBuildInput {
  return {
    language,
    caseType,
    optionA: preview.optionA,
    optionB: preview.optionB,
    answers,
    ...buildCurrentCaseStructuralSignals({
      externalSnapshot: evidence,
      selections: selected,
    }),
    fifwm: buildUnavailableFifwm(language),
    fifwmSource: "unavailable",
    missingPoint: "Family operating fit",
    missingPointWhy: "Availability needs validation",
    primaryRisk: "Exposure",
    primaryRiskMeaning: "Protect capacity",
    decisionConditions: ["Evidence improves"],
    validationFocus: "Bounded test",
    externalImplication: evidence.implication,
    plan: [
      { period: "Now", title: "Test", action: "Validate", output: "Evidence" },
    ],
  };
}
function structure(i: ProductApplicationBuildInput) {
  const p = buildProductApplicationV3(i);
  return {
    caseType: i.caseType,
    posture: derivePostureAssessment(i),
    effective: p.currentStructuralPosture.label,
    safety: p.safetyMargin.band,
    inputs: p.safetyMargin.inputs,
    signals: p.postureBasis,
    families: p.changingPlays.map(x => x.family),
    count: p.changingPlays.length,
    coverage: p.postureEvidenceCoverage,
  };
}
const families = [
  "Corporate Stay vs Exit",
  "MBA / EMBA / PhD Decision",
  "Overseas Relocation",
  "Entrepreneurship",
  "Industry Transition",
  "Role Upgrade / Downgrade",
  "Burnout-driven Decision",
  "Family Constraint-heavy Decision",
  "General Career Reconfiguration",
];
describe("intake contract and hard engine-equivalence gate", () => {
  it("has exactly fifteen bilingual questions, eight unchanged categories, and six selectors", () => {
    expect(intake15Questions.map(q => q.id)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1)
    );
    expect(intake15Groups.map(g => g.title)).toEqual([
      "Current Situation",
      "Option A / Option B",
      "External Pressure",
      "Internal Readiness",
      "Safety Margin",
      "Support System",
      "Timing and Constraints",
      "Decision Switches",
    ]);
    expect(Object.keys(intake15SelectorMap)).toEqual([
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
    ]);
    for (const q of intake15Questions) {
      expect(q.text).toBeTruthy();
      expect(q.ko).toMatch(/[가-힣]/);
      expect(q.text).not.toMatch(/^What is Option [AB]|What career decision/);
    }
    const expected = { ...legacy };
    for (const id of [2, 7, 10, 12, 13, 16, 18, 22, 24, 26, 27])
      (expected as any)[id] = "";
    expect(adaptIntake15(preview, raw)).toEqual(expected);
  });
  it("requires exactly the fifteen responses and their six bands, including explicit unknown", () => {
    expect(completedIntake15(raw, selections)).toBe(15);
    expect(completedIntake15({ ...raw, 15: "" }, selections)).toBe(14);
    expect(completedIntake15(raw, { ...selections, 17: null })).toBe(14);
    expect(completedIntake15(raw, { ...selections, 17: "unknown" })).toBe(15);
  });
  for (const language of ["en", "ko"] as const)
    for (const family of families)
      for (const band of ["strong", "developing", "weak", "unknown"] as const)
        it(`${language}: ${family}: ${band} paired structural equality`, () => {
          const selected = {
            ...selections,
            17: band,
            19: band,
            20: band,
            23: band,
          };
          const old = input(legacy, selected, language, family),
            fresh = input(
              adaptIntake15(preview, raw),
              selected,
              language,
              family
            );
          expect(structure(fresh)).toEqual(structure(old));
          expect(buildProductApplicationV3(fresh).changingPlays).toEqual(
            buildProductApplicationV3(old).changingPlays
          );
          expect(detectCaseType(preview, fresh.answers)).toBe(
            detectCaseType(preview, old.answers)
          );
        });
});
describe("deterministic counterfactuals", () => {
  it("zero override and reset restore the entire baseline, not just posture", () => {
    const i = input(),
      p = buildProductApplicationV3(i);
    expect(applyScenarioOverrides(i, {})).toEqual(i);
    expect(evaluateScenario(i, {})).toEqual(p);
    expect(evaluateScenario(i, { financialRoom: "weak" })).not.toEqual(p);
    expect(evaluateScenario(i, {})).toEqual(p);
  });
  it.each(["financialRoom", "reversibility"] as const)(
    "%s recalculates Safety Margin using the same core",
    key => {
      const i = input(),
        next = applyScenarioOverrides(i, { [key]: "weak" });
      expect(next.safetyMarginInputs[key].band).toBe("weak");
      expect(next.structuralSignals.safetyMargin.band).toBe(
        deriveSafetyMarginCore(next.safetyMarginInputs).band
      );
      expect(evaluateScenario(i, { [key]: "weak" }).safetyMargin.band).not.toBe(
        buildProductApplicationV3(i).safetyMargin.band
      );
    }
  );
  it("downside retains the existing guardrail and freezes baseline/evidence", () => {
    const i = input(legacy, {
        17: "strong",
        19: "weak",
        20: "weak",
        21: "low",
        23: "strong",
        25: "light",
      }),
      before = structuredClone(i),
      frozen = structuredClone(evidence);
    const next = applyScenarioOverrides(i, {
      downsideExposure: "high",
      externalValidation: "strong",
    });
    expect(derivePostureAssessment(next).guardrailTriggers).toContain(
      "high-structural-risk"
    );
    expect(i).toEqual(before);
    expect(evidence).toEqual(frozen);
    expect(next.answers).toEqual(i.answers);
    expect(next.externalImplication).toBe(i.externalImplication);
  });
  it("single mode replaces a change; multi mode combines deterministically", () => {
    const i = input();
    const single = updateScenario(
      i,
      { financialRoom: "weak" },
      "optionBSupport",
      "strong",
      "single"
    );
    expect(single).toEqual({ optionBSupport: "strong" });
    const multi = updateScenario(i, single, "financialRoom", "weak", "multi");
    expect(Object.keys(multi)).toHaveLength(2);
    expect(evaluateScenario(i, multi)).toEqual(evaluateScenario(i, multi));
    expect(
      updateScenario(i, multi, "financialRoom", "developing", "multi")
    ).toEqual(single);
  });
  it("reports all seven deltas and never calls an external API", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const i = input(),
      p = buildProductApplicationV3(i),
      q = evaluateScenario(i, { financialRoom: "weak" });
    expect(scenarioImpact(p, q)).toHaveLength(7);
    expect(scenarioImpact(p, p).every(x => !x.changed)).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it.each(["en", "ko"] as const)(
    "renders qualitative %s UI without internal terms or precision",
    language => {
      const i = input(legacy, selections, language);
      const html = renderToStaticMarkup(
        <InteractiveSimulator
          input={i}
          baseline={buildProductApplicationV3(i)}
          consent={false}
          track={async () => {}}
        />
      );
      expect(html).not.toMatch(
        /AMC-|FIFWM|AMU|canonical scorer|current-user-structured|signal provenance|\d+%/
      );
      expect(html).toContain(
        language === "en" ? "TEST ONE CHANGE" : "한 가지 조건 시험"
      );
      expect(html).toContain(
        language === "en"
          ? "Change at least one condition first."
          : "먼저 한 가지 조건을 변경해 주세요."
      );
      expect(html).toMatch(
        /<button[^>]*disabled=""[^>]*>(?:ASSESS THIS SCENARIO|이 시나리오 평가)<\/button>/
      );
      expect(html).toContain(
        language === "en"
          ? "Your written answers are not sent to this optional assessment."
          : "작성한 답변 원문은 이 선택형 평가에는 전송되지 않습니다."
      );
      expect(html).toContain(
        language === "en"
          ? "Hypothetical external assumption"
          : "외부 근거에 대한 가정"
      );
    }
  );
});
describe("auxiliary advisory fail-soft contract", () => {
  const valid = {
    scenarioPlausibility: "medium",
    evidenceSupport: "low",
    scenarioSensitivity: "high",
    changingFeasibility: "medium",
    safetyMarginContribution: "low",
    assumptions: ["Support remains available"],
    uncertainties: ["Execution burden remains unclear"],
    conditionalReading:
      "If support holds, the scenario may be more defensible.",
  };
  const i = input(),
    baseline = buildProductApplicationV3(i),
    request = makeJevInput(i, i, baseline, baseline, {});
  it("sends only de-identified structural context", () => {
    expect(JSON.stringify(request)).not.toContain(raw[1]);
    expect(request).not.toHaveProperty("answers");
  });
  it("handles missing provider, errors, timeout and malformed output without touching core", async () => {
    const before = structuredClone(baseline);
    for (const provider of [
      undefined,
      {
        assess: async () => {
          throw Error("no credential");
        },
      },
      { assess: async () => ({ percentage: 72 }) },
      { assess: async () => new Promise(() => {}) },
    ])
      expect(await createJevSession(provider, 5).assess(request)).toEqual({
        status: "unavailable",
      });
    expect(baseline).toEqual(before);
    expect(evaluateScenario(i, { financialRoom: "weak" })).toBeTruthy();
  });
  it("caches identical requests and keeps valid advisory separate", async () => {
    const assess = vi.fn(async () => valid),
      session = createJevSession({ assess });
    const [a, b] = await Promise.all([
      session.assess(request),
      session.assess(request),
    ]);
    expect(a).toEqual({ status: "available", advisory: valid });
    expect(a).toEqual(b);
    expect(assess).toHaveBeenCalledTimes(1);
    expect(baseline).not.toHaveProperty("advisory");
  });
  it("rejects numbers, numerical probability, too many assumptions and success predictions", () => {
    for (const conditionalReading of [
      "72% ready",
      "Probability is high",
      "Career success is likely",
      "성공 가능성이 높습니다",
    ])
      expect(parseJevAdvisory({ ...valid, conditionalReading })).toBeNull();
    expect(
      parseJevAdvisory({ ...valid, assumptions: ["a", "b", "c", "d"] })
    ).toBeNull();
  });
});
describe("Founder Ops baseline-only persistence and consent", () => {
  it("stores no raw answers and records fifteen completed session questions, rejects orphan scenario use, ignores core patches and unbounded metadata", async () => {
    const store = new MemoryFounderOpsStore();
    expect(
      await trackFounderOps(
        { serviceStorageConsent: true, eventType: "simulator_opened" },
        store
      )
    ).toMatchObject({ stored: false, reason: "baseline_required" });
    const created = await trackFounderOps(
      {
        eventType: "preview_started",
        newSubmission: true,
        serviceStorageConsent: true,
      },
      store
    );
    const submissionId = created.submissionId!;
    const base = { submissionId, serviceStorageConsent: true };
    await trackFounderOps(
      {
        ...base,
        eventType: "full_intake_completed",
        patch: {
          answersJson: raw,
          fullIntakeCompletedAt: new Date().toISOString(),
          structuralOutputJson: {
            intakeSchemaVersion: INTAKE_V4_SCHEMA,
            experienceVersion: "interactive-v1",
          },
        },
      },
      store
    );
    const before = await store.getSubmission(submissionId);
    await trackFounderOps(
      {
        ...base,
        eventType: "scenario_variable_changed",
        patch: {
          answersJson: legacy,
          structuralOutputJson: { advisory: "forbidden" },
        },
        metadata: {
          variable: "financialRoom",
          baselineBand: "developing",
          newBand: "strong",
          mode: "single",
          rawText: "PRIVATE",
          scenario: { financialRoom: "strong" },
        },
      },
      store
    );
    const after = await store.getSubmission(submissionId);
    expect(after?.submission).toEqual(before?.submission);
    expect(after?.submission.answersJson).toEqual({});
    expect(
      after?.submission.structuralOutputJson.completedIntakeQuestionCount
    ).toBe(15);
    expect(after?.events.at(-1)?.metadataJson).toEqual({
      variable: "financialRoom",
      baselineBand: "developing",
      newBand: "strong",
      mode: "single",
    });
    expect(await store.listSubmissions({}, 100)).toHaveLength(1);
    expect(expectedIntakeAnswers(after!.submission)).toBe(0);
    expect(buildDataQuality([after!.submission]).completeFullIntake).toBe(1);
    expect(
      buildLaunchOpsSummary([after!.submission], after!.events, null).integrity
    ).not.toBeUndefined();
  });
  it("historical twenty-nine stays valid and research excludes non-consented events", async () => {
    const store = new MemoryFounderOpsStore();
    const a = await store.createSubmission("en", true),
      b = await store.createSubmission("ko", true);
    await store.updateSubmission(a.submissionId, {
      answersJson: legacy,
      fullIntakeCompletedAt: new Date().toISOString(),
      researchUseConsent: true,
    });
    await store.addEvent(a.submissionId, "scenario_variable_changed", {
      variable: "financialRoom",
      baselineBand: "weak",
      newBand: "strong",
    });
    await store.addEvent(b.submissionId, "scenario_variable_changed", {
      variable: "externalValidation",
      baselineBand: "weak",
      newBand: "strong",
    });
    const rows = await store.listSubmissions({}, 100),
      events = [
        ...(await store.getSubmission(a.submissionId))!.events,
        ...(await store.getSubmission(b.submissionId))!.events,
      ];
    expect(
      expectedIntakeAnswers(rows.find(x => x.submissionId === a.submissionId)!)
    ).toBe(29);
    expect(buildDataQuality(rows).completeFullIntake).toBe(1);
    expect(
      buildSimulatorAnalytics(rows, events).mostTestedVariables
        .externalValidation
    ).toBe(1);
    expect(
      buildResearchSummary(rows, events).simulator?.mostTestedVariables
        .externalValidation
    ).toBe(0);
    expect(
      buildResearchSummary(rows, events).simulator?.mostTestedVariables
        .financialRoom
    ).toBe(1);
  });
});

describe("canonical AMU offline advisory contract", () => {
  const baselineInput = input(),
    baseline = buildProductApplicationV3(baselineInput);
  const request = makeJevInput(
    baselineInput,
    baselineInput,
    baseline,
    baseline,
    {}
  );
  const rawResponse = () => ({
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
      metrics.map(key => [
        key,
        {
          type: "choice",
          choice: "medium",
          confidence: 0.6,
          probabilities: { low: 0.2, medium: 0.6, high: 0.2 },
        },
      ])
    ),
  });
  it("creates five bounded Choice questions without raw responses", () => {
    const packet = buildOfflineScenarioPacket(request);
    expect(packet.model).toBe("typesafe-ai/jev");
    expect(Object.keys(packet.questions)).toEqual([...metrics]);
    expect(packet.state).not.toHaveProperty("answers");
    expect(JSON.stringify(packet)).not.toContain(raw[1]);
  });
  it("strips numeric distributions from valid Gateway results", () => {
    const advisory = parseOfflineGatewayAdvisory(rawResponse());
    expect(advisory?.scenarioPlausibility).toBe("medium");
    expect(JSON.stringify(advisory)).not.toMatch(
      /confidence|probabilities|0\.6|[0-9%]/
    );
    expect(parseJevAdvisory(advisory)).toEqual(advisory);
  });
  it("rejects wrong model, wrong routing, malformed choices and unknown fields", () => {
    const wrongModel = rawResponse();
    wrongModel.model = "different";
    expect(parseOfflineGatewayAdvisory(wrongModel)).toBeNull();
    const routing = rawResponse();
    routing.provider_metadata.gateway.routing.finalProvider = "other";
    expect(parseOfflineGatewayAdvisory(routing)).toBeNull();
    const malformed = rawResponse();
    malformed.answers.scenarioPlausibility.probabilities.medium = 2;
    expect(parseOfflineGatewayAdvisory(malformed)).toBeNull();
  });
});
it("keeps legacy and experiment session submission identities separate", async () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  let count = 0;
  const requests: any[] = [];
  const options = {
    fetcher: async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      requests.push(body);
      return {
        json: async () => ({
          stored: true,
          submissionId:
            body.submissionId ||
            `AMC-20261009-${String(++count).padStart(8, "0")}`,
        }),
      };
    },
    getSessionStorage: () => storage,
    getLegacyStorage: () => storage,
  };
  const legacyTracker = createFounderOpsJourneyTracker(options),
    experimentTracker = createFounderOpsJourneyTracker({
      ...options,
      storageNamespace: "interactive-v1",
    });
  await legacyTracker({
    eventType: "preview_started",
    language: "en",
    serviceStorageConsent: true,
    newSubmission: true,
  });
  await experimentTracker({
    eventType: "preview_started",
    language: "en",
    serviceStorageConsent: true,
    newSubmission: true,
  });
  await legacyTracker({
    eventType: "preview_completed",
    language: "en",
    serviceStorageConsent: true,
  });
  await experimentTracker({
    eventType: "simulator_opened",
    language: "en",
    serviceStorageConsent: true,
  });
  expect(requests[2].submissionId).not.toBe(requests[3].submissionId);
  expect(count).toBe(2);
});
