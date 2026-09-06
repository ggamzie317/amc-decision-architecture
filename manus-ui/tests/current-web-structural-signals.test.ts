import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildCurrentCaseStructuralSignals,
  initialCurrentCaseStructuredSelections,
  type CurrentCaseStructuredSelections,
} from "../client/src/data/amcCurrentCaseStructuralSignals";
import {
  buildFounderOpsDerivedPatch,
  founderOpsDerivedFingerprint,
} from "../client/src/data/amcFounderOpsDerived";
import {
  buildProductApplicationV3,
  buildUnavailableFifwm,
  derivePostureAssessment,
  type ProductApplicationBuildInput,
} from "../client/src/data/amcProductApplicationV3";
import type { ExternalSnapshot } from "../client/src/data/customerLanguageFirewall";
import { trackFounderOps } from "../server/founderOpsApi";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";

const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());

function externalSnapshot(band: "strong" | "developing" | "weak" | "unknown"): ExternalSnapshot {
  if (band === "unknown") return {
    status: "unverified",
    confidence: "low",
    generatedAtLabel: "",
    externalSignals: [],
    sourceNotes: [],
    uncertaintyNotes: [],
    implication: "No live external evidence is available.",
  };
  return {
    status: "live",
    confidence: band === "strong" ? "high" : band === "weak" ? "low" : "medium",
    generatedAtLabel: "fixture",
    externalSignals: [{
      label: "Current external evidence",
      direction: band === "weak" ? "caution" : "supportive",
      reading: "Explicit fixture evidence.",
    }],
    sourceNotes: [],
    uncertaintyNotes: [],
    implication: `${band} external evidence`,
  };
}

function selections(overrides: Partial<CurrentCaseStructuredSelections> = {}): CurrentCaseStructuredSelections {
  return { ...initialCurrentCaseStructuredSelections, ...overrides };
}

function productInput(
  runtime: ReturnType<typeof buildCurrentCaseStructuralSignals>,
  language: "en" | "ko" = "en",
  answers: Record<number, string> = {},
): ProductApplicationBuildInput {
  return {
    language,
    caseType: "Entrepreneurship",
    optionA: "current role",
    optionB: "advisory practice",
    answers,
    fifwm: buildUnavailableFifwm(language),
    fifwmSource: "unavailable",
    safetyMarginInputs: runtime.safetyMarginInputs,
    structuralSignals: runtime.structuralSignals,
    missingPoint: language === "ko" ? "반복 가능한 유료 수요" : "Repeatable paid demand",
    missingPointWhy: language === "ko" ? "몰입 확대 전에 관찰 가능한 수요가 필요합니다." : "Observable demand is needed before increasing commitment.",
    primaryRisk: language === "ko" ? "이른 전환" : "Premature transition",
    primaryRiskMeaning: language === "ko" ? "수요 확인 전 노출이 커질 수 있습니다." : "Exposure could increase before demand is verified.",
    decisionConditions: [language === "ko" ? "유료 검증이 반복됩니다." : "Paid validation repeats."],
    validationFocus: language === "ko" ? "반복 가능한 유료 수요" : "Repeatable paid demand",
    externalImplication: language === "ko" ? "현재 외부 근거를 구조에 반영합니다." : "Current external evidence is reflected in the structure.",
    plan: [{ period: "30 days", title: "Test", action: "Run one bounded test.", output: "Observed evidence." }],
  };
}

describe("AMC current-web structural signal runtime", () => {
  it("keeps every unsupported value unavailable when no structured selection or live evidence exists", () => {
    const runtime = buildCurrentCaseStructuralSignals({
      externalSnapshot: externalSnapshot("unknown"),
      selections: selections(),
    });
    expect(Object.values(runtime.structuralSignals).every((signal) => signal.band === "unknown")).toBe(true);
    expect(Object.values(runtime.structuralSignals).every((signal) => signal.source === "unavailable")).toBe(true);
    expect(Object.values(runtime.safetyMarginInputs).every((signal) => signal.source === "unavailable")).toBe(true);
    expect(derivePostureAssessment(productInput(runtime))).toMatchObject({
      support: 5,
      candidatePosture: "validate",
      effectivePosture: "validate",
      guardrailApplied: false,
    });
    expect(buildProductApplicationV3(productInput(runtime)).changingPlays).toEqual([]);
  });

  it("produces deterministic strong, mixed, reconfigure, guarded, and all-unknown runtime fixtures", () => {
    const fixtures = [
      {
        name: "strong",
        external: "strong",
        selections: selections({ 17: "strong", 19: "strong", 20: "strong", 21: "low", 23: "strong", 25: "light" }),
        expected: { support: 14, candidatePosture: "transition", effectivePosture: "transition", guardrailApplied: false, changing: [] },
      },
      {
        name: "mixed",
        external: "developing",
        selections: selections({ 17: "developing", 19: "developing", 20: "developing", 21: "moderate", 23: "developing", 25: "material" }),
        expected: { support: 5, candidatePosture: "validate", effectivePosture: "validate", guardrailApplied: false, changing: ["parallel-validation", "resource", "timing"] },
      },
      {
        name: "reconfigure",
        external: "weak",
        selections: selections({ 17: "weak", 19: "weak", 20: "weak", 21: "high", 23: "weak", 25: "heavy" }),
        expected: { support: -4, candidatePosture: "reconfigure", effectivePosture: "reconfigure", guardrailApplied: false, changing: ["parallel-validation", "resource", "timing"] },
      },
      {
        name: "guarded",
        external: "strong",
        selections: selections({ 17: "strong", 19: "weak", 20: "weak", 21: "high", 23: "strong", 25: "light" }),
        expected: { support: 8, candidatePosture: "transition", effectivePosture: "validate", guardrailApplied: true, changing: ["resource", "timing"] },
      },
      {
        name: "all unknown",
        external: "unknown",
        selections: selections(),
        expected: { support: 5, candidatePosture: "validate", effectivePosture: "validate", guardrailApplied: false, changing: [] },
      },
    ] as const;

    for (const fixture of fixtures) {
      const runtime = buildCurrentCaseStructuralSignals({
        externalSnapshot: externalSnapshot(fixture.external),
        selections: fixture.selections,
      });
      const input = productInput(runtime, "en", { 17: "Identical wording across every fixture." });
      const assessment = derivePostureAssessment(input);
      const product = buildProductApplicationV3(input);
      expect(assessment, fixture.name).toMatchObject({
        support: fixture.expected.support,
        candidatePosture: fixture.expected.candidatePosture,
        effectivePosture: fixture.expected.effectivePosture,
        guardrailApplied: fixture.expected.guardrailApplied,
      });
      expect(product.changingPlays.map((play) => play.family), fixture.name).toEqual(fixture.expected.changing);
    }

    const guarded = buildCurrentCaseStructuralSignals({
      externalSnapshot: externalSnapshot("strong"),
      selections: selections({ 17: "strong", 19: "weak", 20: "weak", 21: "high", 23: "strong", 25: "light" }),
    });
    expect(derivePostureAssessment(productInput(guarded)).guardrailTriggers).toEqual([
      "weak-safety-margin",
      "weak-reversibility",
      "high-structural-risk",
    ]);
  });

  it("does not guard weak Safety Margin alone", () => {
    const runtime = buildCurrentCaseStructuralSignals({
      externalSnapshot: externalSnapshot("strong"),
      selections: selections({ 17: "strong", 19: "weak", 20: "developing", 21: "moderate", 23: "strong", 25: "light" }),
    });
    expect(runtime.structuralSignals.safetyMargin.band).toBe("weak");
    expect(derivePostureAssessment(productInput(runtime))).toMatchObject({
      support: 10,
      candidatePosture: "transition",
      effectivePosture: "transition",
      guardrailApplied: false,
    });
  });

  it("changes support only from explicit readiness, Option B support, and constraint selections, never wording", () => {
    const sameAnswers = { 15: "Strong ready proven weak constrained words do not score.", 17: "Same prose.", 23: "Same prose.", 25: "Same prose." };
    const build = (external: "strong" | "developing", selected: CurrentCaseStructuredSelections) => {
      const runtime = buildCurrentCaseStructuralSignals({ externalSnapshot: externalSnapshot(external), selections: selected });
      return derivePostureAssessment(productInput(runtime, "en", sameAnswers));
    };

    const readinessWeak = build("developing", selections({ 17: "weak", 19: "strong", 20: "strong", 21: "low", 23: "weak", 25: "heavy" }));
    const readinessStrong = build("developing", selections({ 17: "strong", 19: "strong", 20: "strong", 21: "low", 23: "weak", 25: "heavy" }));
    expect([readinessWeak.support, readinessStrong.support]).toEqual([4, 8]);
    expect([readinessWeak.effectivePosture, readinessStrong.effectivePosture]).toEqual(["validate", "transition"]);

    const supportWeak = build("strong", selections({ 17: "developing", 19: "developing", 20: "developing", 21: "moderate", 23: "weak", 25: "material" }));
    const supportStrong = build("strong", selections({ 17: "developing", 19: "developing", 20: "developing", 21: "moderate", 23: "strong", 25: "material" }));
    expect([supportWeak.support, supportStrong.support]).toEqual([6, 8]);
    expect([supportWeak.effectivePosture, supportStrong.effectivePosture]).toEqual(["validate", "transition"]);

    const loadLight = build("strong", selections({ 17: "developing", 19: "developing", 20: "developing", 21: "moderate", 23: "strong", 25: "light" }));
    const loadHeavy = build("strong", selections({ 17: "developing", 19: "developing", 20: "developing", 21: "moderate", 23: "strong", 25: "heavy" }));
    expect([loadLight.support, loadHeavy.support]).toEqual([9, 7]);
  });

  it("keeps bands and posture language-independent while localizing customer output", () => {
    const runtime = buildCurrentCaseStructuralSignals({
      externalSnapshot: externalSnapshot("strong"),
      selections: selections({ 17: "weak", 19: "weak", 20: "weak", 21: "high", 23: "strong", 25: "light" }),
    });
    const enInput = productInput(runtime, "en");
    const koInput = productInput(runtime, "ko");
    expect(derivePostureAssessment(enInput)).toEqual(derivePostureAssessment(koInput));
    expect(buildProductApplicationV3(enInput).currentStructuralPosture.label).toBe("Preserve and Validate");
    expect(buildProductApplicationV3(koInput).currentStructuralPosture.label).toBe("보존하며 검증");
  });

  it("keeps the 29-question contract and places selectors only inside Q17, Q19-Q21, Q23, and Q25", () => {
    const page = fs.readFileSync(path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx"), "utf8");
    const productViews = fs.readFileSync(path.join(root, "manus-ui/client/src/components/ProductApplicationViews.tsx"), "utf8");
    const intakeSource = page.slice(page.indexOf("const intakeGroups ="), page.indexOf("const intakeGroupTitlesKo"));
    const optionsSource = page.slice(page.indexOf("const structuredBandOptions"), page.indexOf("function isCurrentCaseStructuredQuestionId"));
    const ids = [...intakeSource.matchAll(/\bid:\s*(\d+)/g)].map((match) => Number(match[1]));
    expect(ids).toEqual(Array.from({ length: 29 }, (_, index) => index + 1));
    expect(page).toContain("const currentCaseStructuredQuestionIds = [17, 19, 20, 21, 23, 25]");
    expect(page).toContain('17: { en: "Internal readiness for Option B", ko: "Option B 실행 준비도" }');
    expect(page).toContain('23: { en: "Support available for Option B", ko: "Option B에 사용할 수 있는 지원" }');
    expect(page).toContain('25: { en: "Overall constraint load", ko: "전반적인 제약 부담" }');
    expect(page).toContain("currentCaseStructuredSelections[structuredQuestionId] === option.value");
    expect(page).toContain("buildUnavailableFifwm(language)");

    expect([...optionsSource.matchAll(/value: "([^"]+)"/g)].map((match) => match[1])).toEqual([
      "strong", "developing", "weak", "unknown",
      "strong", "developing", "weak", "unknown",
      "strong", "developing", "weak", "unknown",
      "low", "moderate", "high", "unknown",
      "strong", "developing", "weak", "unknown",
      "light", "material", "heavy", "unknown",
    ]);
    expect(optionsSource.match(/descriptionEn: "/g)).toHaveLength(24);
    expect(optionsSource.match(/descriptionKo: "/g)).toHaveLength(24);
    expect(optionsSource).toContain("Most required capability and proof are already in place.");
    expect(optionsSource).toContain("실험이 실패해도 단기 안정성이 크게 흔들리지 않음.");
    expect(optionsSource).toContain("A credible return or re-entry path is available.");
    expect(optionsSource).toContain("하방 위험이 회복·재시도 여력을 크게 줄일 수 있음.");
    expect(optionsSource).toContain("Concrete and reliable support is available.");
    expect(optionsSource).toContain("전반적인 제약 부담이 아직 명확하지 않음.");
    expect(optionsSource).not.toMatch(/ko: "(?:Strong|Developing|Moderate)"/);
    expect(productViews).not.toContain('translate("Strong", "Strong")');
    expect(productViews).not.toContain('translate("Developing", "Developing")');
  });

  it("persists structured posture basis separately from raw answers without a schema change", async () => {
    const snapshot = externalSnapshot("strong");
    const runtime = buildCurrentCaseStructuralSignals({
      externalSnapshot: snapshot,
      selections: selections({ 17: "strong", 19: "strong", 20: "strong", 21: "low", 23: "developing", 25: "material" }),
    });
    const input = productInput(runtime);
    const productApplication = buildProductApplicationV3(input);
    const derivedPatch = buildFounderOpsDerivedPatch({
      productApplication,
      externalSnapshot: snapshot,
      language: "en",
      caseType: input.caseType,
      missingPoint: input.missingPoint,
      decisionConditions: input.decisionConditions,
      primaryRisk: { name: input.primaryRisk, meaning: input.primaryRiskMeaning },
      comparisonRows: [],
      internalSignals: [],
    });
    const rawAnswers = { "17": "Free-text readiness explanation", "23": "Free-text support explanation", "25": "Free-text constraint explanation" };
    const store = new MemoryFounderOpsStore();
    const created = await trackFounderOps({
      language: "en",
      serviceStorageConsent: true,
      eventType: "preview_started",
      newSubmission: true,
    }, store);
    await trackFounderOps({
      submissionId: created.submissionId,
      language: "en",
      serviceStorageConsent: true,
      eventType: "dashboard_generated",
      patch: { ...derivedPatch, answersJson: rawAnswers },
    }, store);

    const persisted = await store.getSubmission(created.submissionId!);
    expect(persisted?.submission.answersJson).toEqual(rawAnswers);
    expect(persisted?.submission.structuralOutputJson.postureBasis).toMatchObject({
      internalReadiness: { band: "strong", source: "current-user-structured" },
      optionBSupport: { band: "developing", source: "current-user-structured" },
      constraintLoad: { band: "material", source: "current-user-structured" },
      missingPointImpact: { band: "unknown", source: "unavailable" },
    });

    const changedRuntime = buildCurrentCaseStructuralSignals({
      externalSnapshot: snapshot,
      selections: selections({ 17: "strong", 19: "strong", 20: "strong", 21: "low", 23: "strong", 25: "material" }),
    });
    const changedProductApplication = buildProductApplicationV3(productInput(changedRuntime));
    const changedPatch = buildFounderOpsDerivedPatch({
      productApplication: changedProductApplication,
      externalSnapshot: snapshot,
      language: "en",
      caseType: input.caseType,
      missingPoint: input.missingPoint,
      decisionConditions: input.decisionConditions,
      primaryRisk: { name: input.primaryRisk, meaning: input.primaryRiskMeaning },
      comparisonRows: [],
      internalSignals: [],
    });
    expect(changedProductApplication.currentStructuralPosture).toEqual(productApplication.currentStructuralPosture);
    expect(founderOpsDerivedFingerprint(changedPatch)).not.toBe(founderOpsDerivedFingerprint(derivedPatch));
  });
});
