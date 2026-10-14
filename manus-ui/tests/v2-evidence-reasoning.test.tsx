import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initialV2State, buildV2Input, buildV2Sensitivity, v2Scenario } from "../client/src/data/amcV2Model";
import { buildProductApplicationV3, derivePostureAssessment } from "../client/src/data/amcProductApplicationV3";
import { buildCurrentCaseStructuralSignals } from "../client/src/data/amcCurrentCaseStructuralSignals";
import { buildV2Analysis } from "../client/src/data/amcV2Analysis";
import { v2ComparisonKey, type EvidenceComparisons } from "../client/src/data/v2EvidenceComparison";
import { v2ExternalContext } from "../client/src/data/v2ExternalContext";
import { unavailableIntelligence, type ExternalIntelligenceV2 } from "../client/src/data/externalIntelligenceV2";
import { buildV2EvidenceRequest, acceptV2Evidence } from "../client/src/data/v2ExternalEvidenceClient";
import { projectInteractivePatch, caseTypes } from "../shared/interactivePrivacy";
import { baselineBands } from "../client/src/data/amcScenario";
import { selectV2SimulatorVariables } from "../client/src/data/amcV2SensitivityView";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import { V2DecisionMap, V2Reasoning } from "../client/src/components/V2AnalysisView";

(globalThis as any).React = React;
function fixture(language: "ko" | "en" = "ko") {
  const state = initialV2State(language);
  Object.assign(state, {
    caseType: "Industry Transition", publicSearchTarget: "Semiconductor process technology",
    targetGeography: "South Korea", optionA: "현재 제조 현장 개선 업무", optionB: "반도체 공정기술",
    externalAreas: ["requiredSkills", "compensation"], protects: ["income"],
    bands: { internalReadiness: "developing", financialRoom: "strong", reversibility: "strong",
      downsideExposure: "low", optionBSupport: "strong", constraintLoad: "light" },
  });
  const evidence: ExternalIntelligenceV2 = {
    status: "live", caseType: state.caseType, generatedAt: "2026-10-11T13:00:00Z",
    sourceCoverage: "complete", contextConfidence: "medium",
    evidenceBlocks: [{ area: "requiredSkills", dimension: "Required skills", headline: "직무에서 요구하는 성과",
      direction: "mixed", fact: "공정 수율과 결함 데이터를 분석한 결과물이 요구됩니다.",
      whyItMatters: "한 기업의 직무 설명이며 현재 채용이나 개인 자격 충족을 뜻하지 않습니다.",
      sourceLabel: "Synthetic employer source", sourceUrl: "https://example.org/process-role", provenance: "EXTERNAL_EVIDENCE" }],
    metrics: [], opportunitySignals: [], frictionSignals: [], uncertainties: ["테스트용 합성 출처입니다."],
    implication: "실제 목표 직무의 요건과 성과를 대조해야 합니다.",
  };
  return { state, evidence };
}
const combinations = (["low", "medium", "high"] as const).flatMap(confidence =>
  (["supportive", "mixed", "caution"] as const).map(direction => ({ confidence, direction })));

describe("V2 real input routing and non-scored evidence reasoning", () => {
  it.each(["직무 모집 사례", "공개 요건"])("uses natural Korean source references for %s without changing claims", headline => {
    const { state, evidence } = fixture();
    evidence.evidenceBlocks[0].headline = headline;
    const fact = evidence.evidenceBlocks[0].fact;
    const input = buildV2Input(state, evidence);
    const core = buildProductApplicationV3(input);
    const analysis = buildV2Analysis(state, core, evidence, "live");
    expect(analysis.evidenceLinks[0].testReference).toContain(`자료 ‘대조표 근거 1: ${headline}’의 조건이 목표`);
    expect(analysis.evidenceLinks[0].sourceFact).toBe(fact);
    const key = v2ComparisonKey(evidence.evidenceBlocks[0], state.language);
    const excluded = buildV2Analysis(state, core, evidence, "live", undefined, {
      [key]: { status: "not_applicable", detail: "" },
    });
    expect(excluded.evidenceLinks[0].interpretation).toContain("이 공개 조건이 목표");
    expect(excluded.evidenceLinks[0].sourceFact).toBe(fact);
    expect(buildV2Input(state, evidence)).toEqual(input);
  });
  it.each(combinations)("reuses original public-context derivation for $confidence / $direction", ({ confidence, direction }) => {
    const { state, evidence } = fixture();
    evidence.contextConfidence = confidence;
    evidence.evidenceBlocks[0].direction = direction;
    const native = buildCurrentCaseStructuralSignals({
      externalSnapshot: { status: "live", confidence, generatedAtLabel: evidence.generatedAt!,
        externalSignals: [{ label: "Required skills", direction, reading: evidence.evidenceBlocks[0].fact }],
        sourceNotes: [], uncertaintyNotes: [], implication: "" },
      selections: { 17: state.bands.internalReadiness, 19: state.bands.financialRoom, 20: state.bands.reversibility,
        21: state.bands.downsideExposure, 23: state.bands.optionBSupport, 25: state.bands.constraintLoad },
    });
    const input = buildV2Input(state, evidence);
    expect(input.structuralSignals).toEqual(native.structuralSignals);
    expect(input.safetyMarginInputs).toEqual(native.safetyMarginInputs);
    expect(input.structuralSignals.externalValidation.source).toBe("live-external-evidence");
    expect(Object.values(input.fifwm).every(item => item.score === null)).toBe(true);
  });

  it.each(["missing-confidence", "partial", "demo", "unavailable"] as const)("keeps $0 aggregate context unresolved without borrowing confidence", mode => {
    const { state, evidence } = fixture();
    if (mode === "missing-confidence") delete evidence.contextConfidence;
    if (mode === "partial") evidence.sourceCoverage = "partial";
    if (mode === "demo") evidence.status = "demo";
    if (mode === "unavailable") evidence.status = "unavailable";
    expect(buildV2Input(state, evidence).structuralSignals.externalValidation)
      .toEqual({ band: "unknown", source: "unavailable" });
    expect(v2ExternalContext(evidence).status).toBe("unverified");
  });

  it("changes reasoning and the concrete next check for a changed fact without using prose as a score", () => {
    const { state, evidence } = fixture();
    const input = buildV2Input(state, evidence), core = buildProductApplicationV3(input);
    const first = buildV2Analysis(state, core, evidence);
    const changed = structuredClone(evidence);
    changed.evidenceBlocks[0].fact = "공정 설비의 예방 정비와 장애 복구 기록이 요구됩니다.";
    const nextInput = buildV2Input(state, changed), nextCore = buildProductApplicationV3(nextInput);
    const next = buildV2Analysis(state, nextCore, changed);
    expect(next.findings[1].implication).toContain("장애 복구 기록");
    expect(first.findings[1].implication).toContain("결함 데이터를 분석");
    expect(next.summary).not.toBe(first.summary);
    expect(next.evidenceLinks[0].interpretation).not.toBe(first.evidenceLinks[0].interpretation);
    expect(next.experiment.action).not.toBe(first.experiment.action);
    expect(next.experiment.stages[0].action).not.toBe(first.experiment.stages[0].action);
    expect(nextInput.structuralSignals).toEqual(input.structuralSignals);
    expect(nextCore.currentStructuralPosture).toEqual(core.currentStructuralPosture);
    expect(next.plays).toEqual(first.plays);
  });

  it("uses explicit customer comparisons to distinguish gap from matching self-report, without grading notes", () => {
    const { state, evidence } = fixture();
    const core = buildProductApplicationV3(buildV2Input(state, evidence));
    const key = v2ComparisonKey(evidence.evidenceBlocks[0], state.language);
    const gap: EvidenceComparisons = { [key]: { status: "gap", detail: "private-gap-marker: 결함 분석 결과물 없음" } };
    const match: EvidenceComparisons = { [key]: { status: "matches", detail: "private-match-marker: 수율 개선 결과물 보유" } };
    const before = JSON.stringify({ state, core, evidence });
    const a = buildV2Analysis(state, core, evidence, "live", undefined, gap);
    const b = buildV2Analysis(state, core, evidence, "live", undefined, match);
    expect(a.findings[1].implication).toContain("결함 분석 결과물 없음");
    expect(b.findings[1].implication).toContain("수율 개선 결과물 보유");
    expect(b.evidenceLinks[0].interpretation).toContain("별도 확인");
    expect(a.experiment.action).not.toBe(b.experiment.action);
    expect(a.posture).toBe(b.posture);
    expect(a.safety).toEqual(b.safety);
    expect(a.factors).toEqual(b.factors);
    expect(a.plays).toEqual(b.plays);
    expect(JSON.stringify({ state, core, evidence })).toBe(before);
    const request = buildV2EvidenceRequest(state)!;
    expect(Object.keys(request).sort()).toEqual(["caseType", "externalAreas", "language", "targetGeography", "targetLabel"]);
    expect(JSON.stringify(request)).not.toMatch(/private-(gap|match)-marker/);
    expect(JSON.stringify(projectInteractivePatch({ evidenceComparisons: gap, structuralOutputJson: { evidenceComparisons: gap } })))
      .not.toContain("private-gap-marker");
  });

  it("does not reuse a private match after the claim changes or the language changes", () => {
    const { state, evidence } = fixture();
    const key = v2ComparisonKey(evidence.evidenceBlocks[0], state.language);
    const comparisons: EvidenceComparisons = { [key]: { status: "matches", detail: "prior-private-proof" } };
    const changed = structuredClone(evidence);
    changed.evidenceBlocks[0].fact = "다른 업무 범위가 요구됩니다.";
    const core = buildProductApplicationV3(buildV2Input(state, changed));
    for (const nextState of [state, { ...state, language: "en" as const }]) {
      const a = buildV2Analysis(nextState, core, changed, "live", undefined, comparisons);
      expect(a.evidenceLinks[0].comparisonStatus).toBe("unreviewed");
      expect(a.evidenceLinks[0].customerEvidence).not.toContain("prior-private-proof");
    }
  });

  it("retains the same research identity and private comparison across an interface toggle", () => {
    const { state, evidence } = fixture("ko");
    const key = v2ComparisonKey(evidence.evidenceBlocks[0], "ko");
    const comparisons: EvidenceComparisons = { [key]: { status: "gap", detail: "session-only work sample missing" } };
    const before = JSON.stringify({ state, evidence, comparisons });
    const en = { ...state, language: "en" as const };
    const koInput = buildV2Input(state, evidence), enInput = buildV2Input(en, evidence);
    const koCore = buildProductApplicationV3(koInput), enCore = buildProductApplicationV3(enInput);
    expect(enInput.structuralSignals).toEqual(koInput.structuralSignals);
    expect(enInput.safetyMarginInputs).toEqual(koInput.safetyMarginInputs);
    expect(Object.values(enInput.fifwm).map(item => item.score)).toEqual(Object.values(koInput.fifwm).map(item => item.score));
    expect(derivePostureAssessment(enInput).effectivePosture).toBe(derivePostureAssessment(koInput).effectivePosture);
    expect(derivePostureAssessment(enInput).guardrailApplied).toBe(derivePostureAssessment(koInput).guardrailApplied);
    expect(enCore.safetyMargin.band).toBe(koCore.safetyMargin.band);
    expect(enCore.changingPlays.map(play => play.family)).toEqual(koCore.changingPlays.map(play => play.family));
    const a = buildV2Analysis(state, koCore, evidence, "live", undefined, comparisons, "ko");
    const b = buildV2Analysis(en, enCore, evidence, "live", undefined, comparisons, "ko");
    expect(b.evidenceLinks[0].comparisonKey).toBe(a.evidenceLinks[0].comparisonKey);
    expect(b.evidenceLinks[0].comparisonStatus).toBe("gap");
    expect(b.evidenceLinks[0].sourceFact).toBe(a.evidenceLinks[0].sourceFact);
    expect(b.experiment.action).toContain("session-only work sample missing");
    const html = renderToStaticMarkup(<V2Dashboard state={en} core={enCore} intelligence={evidence} comparisons={comparisons} evidenceLanguage="ko" onReport={() => {}} />);
    expect(html).toContain("retain the Korean text returned by research");
    expect(html).toContain(evidence.evidenceBlocks[0].fact);
    expect(JSON.stringify({ state, evidence, comparisons })).toBe(before);
    expect(JSON.stringify(buildV2EvidenceRequest(en))).not.toContain("session-only");
  });

  it("presents each core reading and cited condition once while retaining scope and next-check details", () => {
    const { state, evidence } = fixture();
    const core = buildProductApplicationV3(buildV2Input(state, evidence));
    const analysis = buildV2Analysis(state, core, evidence);
    const html = renderToStaticMarkup(<V2Reasoning analysis={analysis} intelligence={evidence} />);
    for (const finding of analysis.findings) expect(html.split(finding.coreReading).length - 1).toBe(1);
    expect(html.match(/class="v2-source-condition"/g)).toHaveLength(1);
    expect(html).toContain(`<p class="v2-source-condition">${evidence.evidenceBlocks[0].fact}</p>`);
    expect(html).toContain(evidence.evidenceBlocks[0].sourceUrl);
    expect(html).toContain("<details");
    expect(html).toContain(analysis.evidenceLinks[0].unresolved);
    expect(html).toContain(analysis.evidenceLinks[0].sourceScope);
    expect(html).toContain("다음 확인");
  });

  it("does not route unrelated public statistics into private readiness or FIFWM", () => {
    const { state, evidence } = fixture();
    evidence.evidenceBlocks[0].area = "industryDirection";
    evidence.evidenceBlocks[0].dimension = "Industry direction";
    evidence.evidenceBlocks[0].fact = "공개 산업 통계의 총량은 증가했습니다.";
    const core = buildProductApplicationV3(buildV2Input(state, evidence));
    const a = buildV2Analysis(state, core, evidence);
    expect(a.evidenceLinks[0].conditionGroup).toBe("public");
    expect(a.findings[1].evidenceIds).toEqual([]);
    expect(a.findings[1].implication).not.toContain("통계의 총량");
    expect(a.factors.every(factor => factor.status === "미확인")).toBe(true);
  });

  it("distinguishes accessible source coverage from unanswered research questions", () => {
    const { state, evidence } = fixture();
    state.caseType = "Entrepreneurship";
    state.externalAreas = ["customerDemand", "regulation"];
    evidence.caseType = state.caseType;
    evidence.evidenceBlocks[0].area = "regulation";
    evidence.evidenceBlocks[0].dimension = "Regulation";
    const a = buildV2Analysis(state, buildProductApplicationV3(buildV2Input(state, evidence)), evidence);
    // Customer picks first, then the case's standard topics that were also researched.
    expect(a.researchCoverage.slice(0, 2).map(item => [item.area, item.evidenceIds])).toEqual([["customerDemand", []], ["regulation", [0]]]);
    expect(a.researchCoverage.map(item => item.area)).toEqual(expect.arrayContaining(["competition", "pricing"]));
    expect(a.summary).toContain("대응하는 공개 근거는 없습니다");
    expect(a.missingConcept).toContain("반복 구매");
  });

  it("shows original unassessed scope for all nine cases instead of replacing the canonical questions", () => {
    for (const caseType of caseTypes) {
      const state = { ...initialV2State("ko"), caseType };
      const a = buildV2Analysis(state, buildProductApplicationV3(buildV2Input(state)), unavailableIntelligence(caseType, "ko"));
      expect(a.factors.every(item => item.status === "미확인")).toBe(true);
      expect(a.factorScopeNote).toMatch(/원본|조직·직무|사례 맞춤 구조 평가/);
      expect(a.factors.map(item => item.title)).toEqual(["기회의 조건", "연결 가능성", "구조 적합성", "실행 현실성", "버틸 수 있는가"]);
    }
  });

  it("keeps a missing Changing play missing in both diagram and mobile flow, and displays the actual target", () => {
    const state = initialV2State("ko");
    state.optionB = "고객이 검토하는 실제 경로";
    const none = unavailableIntelligence(state.caseType, state.language);
    const core = buildProductApplicationV3(buildV2Input(state));
    const a = buildV2Analysis(state, core, none);
    expect(core.changingPlays).toHaveLength(0);
    const html = renderToStaticMarkup(<V2DecisionMap state={state} analysis={a} phase="unavailable" safetyBand="unknown" />);
    expect(html).toContain("조정안 미도출");
    expect(html).toContain(state.optionB);
    expect(html).not.toContain("작은 범위에서 요건 확인");
  });

  it("keeps the original guardrail and restores actual public context on simulator reset", () => {
    const { state, evidence } = fixture();
    evidence.contextConfidence = "high";
    evidence.evidenceBlocks[0].direction = "supportive";
    state.bands.financialRoom = "weak";
    state.bands.internalReadiness = "strong";
    state.bands.downsideExposure = "high";
    const input = buildV2Input(state, evidence), core = buildProductApplicationV3(input);
    expect(derivePostureAssessment(input).guardrailApplied).toBe(true);
    expect(derivePostureAssessment(input).effectivePosture).not.toBe("transition");
    const original = JSON.stringify({ input, evidence });
    const scenario = v2Scenario(input, { externalValidation: "weak", financialRoom: "strong" });
    expect(scenario.result.postureBasis.externalValidation.band).toBe("weak");
    expect(v2Scenario(input, {}).result.postureBasis.externalValidation.source).toBe("live-external-evidence");
    expect(v2Scenario(input, {}).result).toEqual(core);
    expect(JSON.stringify({ input, evidence })).toBe(original);
  });

  it.each(["ko", "en"] as const)("renders the same private comparison and immutable claim in the %s dashboard and report", language => {
    const { state, evidence } = fixture(language);
    const input = buildV2Input(state, evidence), core = buildProductApplicationV3(input);
    const comparisons: EvidenceComparisons = { [v2ComparisonKey(evidence.evidenceBlocks[0], language)]: { status: "gap", detail: "session-only comparison marker" } };
    const sensitivity = buildV2Sensitivity(input, core);
    const visibleVariables = selectV2SimulatorVariables(sensitivity, baselineBands(input));
    const screen = renderToStaticMarkup(<V2Dashboard state={state} core={core} intelligence={evidence} comparisons={comparisons} onReport={() => {}} />);
    const report = renderToStaticMarkup(<V2Report state={state} input={input} core={core} intelligence={evidence} comparisons={comparisons} sensitivity={sensitivity} visibleVariables={visibleVariables} onClose={() => {}} onPrint={() => {}} />);
    for (const html of [screen, report]) {
      expect(html).toContain("session-only comparison marker");
      expect(html).toContain(evidence.evidenceBlocks[0].fact);
      expect(html).toContain("v2-condition-comparison");
      expect(html).not.toContain("1 public evidence items");
    }
  });

  it("rejects an aggregate confidence on partial browser responses", () => {
    const { state, evidence } = fixture();
    expect(acceptV2Evidence({ ...evidence, sourceCoverage: "partial" }, buildV2EvidenceRequest(state)!)).toBeNull();
  });
});
