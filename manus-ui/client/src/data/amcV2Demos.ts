import { buildProductApplicationV3 } from "./amcProductApplicationV3";
import {
  buildV2Input,
  buildV2Sensitivity,
  initialV2State,
  v2Scenario,
  type V2State,
} from "./amcV2Model";
import { demoIntelligence } from "./externalIntelligenceV2";
import type { ScenarioOverrides } from "./amcScenario";
import type { V2Language } from "./v2Language";
export type V2DemoKind = "entrepreneurship" | "industry";
export function v2DemoFixture(kind: V2DemoKind, language: V2Language) {
  const s: V2State = initialV2State(language);
  const ko = language === "ko";
  if (kind === "entrepreneurship")
    Object.assign(s, {
      decision: ko
        ? "현 직무를 유지하며 교육 자문 사업을 검증할지 결정"
        : "Decide whether to test an education advisory business while keeping the current role",
      optionA: ko ? "현 직무 유지" : "Keep current role",
      optionB: ko ? "교육 자문 사업 검증" : "Test advisory business",
      caseType: "Entrepreneurship",
      whyNow: ["newOpportunity", "identity"],
      waitEffect: "harder",
      protects: ["income", "familyStability", "credibility"],
      opens: ["autonomy", "researchExpertise", "growth"],
      exposes: ["incomeRisk", "timeRisk", "marketUncertainty"],
      externalAreas: ["customerDemand", "pricing", "distribution"],
      targetGeography: ko ? "서울" : "Seoul",
      bands: {
        internalReadiness: "developing",
        financialRoom: "developing",
        reversibility: "strong",
        downsideExposure: "moderate",
        optionBSupport: "developing",
        constraintLoad: "material",
      },
      missingAssets: ["marketProof", "executionCapacity"],
      supportSources: ["professionalNetwork", "family"],
      constraints: ["family", "financialConstraint", "marketWindow"],
      timingEffect: "mixed",
      switchIds: ["external", "financial", "readiness"],
      serviceConsent: true,
    } satisfies Partial<V2State>);
  else
    Object.assign(s, {
      decision: ko
        ? "기존 산업에 남을지 신산업 직무로 전환할지 결정"
        : "Decide whether to stay in the current industry or move to a new sector",
      optionA: ko ? "기존 산업에서 역할 유지" : "Stay in current industry",
      optionB: ko ? "신산업 직무 탐색" : "Explore a new-sector role",
      caseType: "Industry Transition",
      whyNow: ["stagnation", "marketChange"],
      waitEffect: "little",
      protects: ["income", "network", "credibility"],
      opens: ["growth", "learning", "newMarket"],
      exposes: ["incomeRisk", "credibilityRisk", "recoveryRisk"],
      externalAreas: ["roleDemand", "compensation", "requiredSkills"],
      targetGeography: ko ? "수도권" : "Metropolitan region",
      bands: {
        internalReadiness: "developing",
        financialRoom: "strong",
        reversibility: "developing",
        downsideExposure: "low",
        optionBSupport: "weak",
        constraintLoad: "material",
      },
      missingAssets: ["trackRecord", "network"],
      supportSources: ["mentor", "professionalNetwork"],
      constraints: ["careerTiming", "family"],
      timingEffect: "waitIncreases",
      switchIds: ["external", "support", "reversibility"],
      serviceConsent: true,
    } satisfies Partial<V2State>);
  const intelligence = demoIntelligence(kind, language, s.caseType);
  const input = buildV2Input(s);
  const baseline = buildProductApplicationV3(input);
  const overrides: ScenarioOverrides =
    kind === "entrepreneurship"
      ? { financialRoom: "strong", optionBSupport: "strong" }
      : { internalReadiness: "strong", optionBSupport: "developing" };
  return {
    kind,
    state: s,
    intelligence,
    input,
    baseline,
    scenario: v2Scenario(input, overrides).result,
    overrides,
    sensitivity: buildV2Sensitivity(input, baseline),
  };
}
