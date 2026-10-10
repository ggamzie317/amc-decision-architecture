import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildV2Analysis,
  v2PublicSearchTarget,
} from "../client/src/data/amcV2Analysis";
import {
  initialV2State,
  buildV2Input,
  v2Scenario,
  buildV2Sensitivity,
} from "../client/src/data/amcV2Model";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { baselineBands } from "../client/src/data/amcScenario";
import { selectV2SimulatorVariables } from "../client/src/data/amcV2SensitivityView";
import {
  unavailableIntelligence,
  type ExternalIntelligenceV2,
} from "../client/src/data/externalIntelligenceV2";
import { buildV2EvidenceRequest } from "../client/src/data/v2ExternalEvidenceClient";
import { v2ReportFileName } from "../client/src/data/v2ReportPresentation";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import V2Simulator from "../client/src/components/V2Simulator";
import { projectInteractivePatch } from "../shared/interactivePrivacy";

(globalThis as any).React = React;
function fixture() {
  const state = initialV2State("ko");
  Object.assign(state, {
    decision: "학술 경력과 겸임 강의 경로 검토",
    optionA: "현재 역할 유지",
    optionB: "연구 결과물과 강의 경력 준비",
    protects: ["income", "flexibility"],
    opens: ["researchExpertise"],
    exposes: ["timeRisk"],
    missingAssets: ["credential", "time"],
    constraints: ["careerTiming"],
    supportSources: ["family"],
    bands: {
      internalReadiness: "weak",
      financialRoom: "weak",
      reversibility: "unknown",
      downsideExposure: "high",
      optionBSupport: "unknown",
      constraintLoad: "heavy",
    },
  });
  const input = buildV2Input(state),
    core = buildProductApplicationV3(input);
  return {
    state,
    input,
    core,
    none: unavailableIntelligence(state.caseType, "ko"),
  };
}
const evidence: ExternalIntelligenceV2 = {
  status: "live",
  caseType: "General Career Reconfiguration",
  generatedAt: "2026-10-10T08:00:00Z",
  evidenceBlocks: [
    {
      dimension: "Required skills",
      headline: "합성 임용 요건 표본",
      fact: "이 테스트 표본은 강의 결과물과 연구 경력을 각각 요구합니다.",
      whyItMatters: "학회 참여만으로 충족됐다고 판단할 수 없습니다.",
      direction: "mixed",
      sourceLabel: "Synthetic institution",
      sourceUrl: "https://example.edu/appointments",
      sourceDate: "2026-09-10",
      sourceDateKind: "published",
      provenance: "EXTERNAL_EVIDENCE",
    },
    {
      dimension: "Compensation",
      headline: "합성 보상 표본",
      fact: "이 테스트 표본은 확정된 강의 소득을 제시하지 않습니다.",
      whyItMatters: "준비 비용을 회수할 수 있다고 가정할 수 없습니다.",
      direction: "caution",
      sourceLabel: "Synthetic institution",
      sourceUrl: "https://example.edu/terms",
      provenance: "EXTERNAL_EVIDENCE",
    },
  ],
  metrics: [],
  opportunitySignals: [],
  frictionSignals: [],
  uncertainties: ["실제 자료가 아닌 테스트 표본"],
  implication: "공개 요건과 준비 성과를 대조해야 합니다.",
};
describe("V2 integrated customer analysis", () => {
  it("explains the interaction of recovery room, readiness and constraints instead of repeating the intake", () => {
    const f = fixture(),
      a = buildV2Analysis(f.state, f.core, f.none, "not_checked");
    expect(a.topic).toBe("학술 경력 검토");
    expect(a.question).toContain("임용 요건");
    expect(a.findings[0].implication).toContain("회복할 여유가 부족");
    expect(a.findings[2].implication).toContain("준비가 진행돼도 실행 부담");
    expect(a.experiment.action).toContain("학위·경력·연구·강의");
    expect(a.experiment.output).toContain("담당자 피드백");
    expect(a.summary).not.toContain(f.state.decision);
    expect(a.boundary).toContain("중단 시점");
  });
  it("maps actual facts to framework perspectives and personal conditions without changing facts or inventing scores", () => {
    const f = fixture(),
      snapshot = JSON.stringify(evidence);
    const input = buildV2Input(f.state, evidence),
      core = buildProductApplicationV3(input),
      a = buildV2Analysis(f.state, core, evidence, "live");
    expect(core.decisionStructure.outsideEvidence).toContain(
      evidence.evidenceBlocks[0].fact
    );
    expect(a.evidenceLinks.map(e => e.factor)).toEqual([
      "formal",
      "marketPolicy",
    ]);
    expect(a.findings.find(f => f.id === "fit")?.evidenceIds).toContain(0);
    expect(a.evidenceLinks[1].condition).toContain("재정 여력");
    expect(a.evidenceLinks[1].interpretation).toContain("회복할 여유가 부족");
    expect(core.postureBasis.externalValidation.band).toBe("unknown");
    expect(core.currentStructuralPosture.label).toBe(
      f.core.currentStructuralPosture.label
    );
    expect(input.fifwmSource).toBe("unavailable");
    expect(Object.values(input.fifwm).every(f => f.score === null)).toBe(true);
    expect(JSON.stringify(evidence)).toBe(snapshot);
  });
  it("changes reasoning, Changing and next-step conditions when a synthetic source claim changes, without changing core posture", () => {
    const f = fixture();
    const alternative: ExternalIntelligenceV2 = structuredClone(evidence);
    alternative.evidenceBlocks[1].headline = "합성 보상 조건 변경";
    alternative.evidenceBlocks[1].fact =
      "이 합성 표본은 보상 하한을 명시합니다.";
    alternative.evidenceBlocks[1].whyItMatters =
      "보상 하한이 실제 목표 역할과 지역에 적용되는지 확인해야 합니다.";
    const snapshot = JSON.stringify(alternative);
    const first = buildV2Analysis(f.state, f.core, evidence, "live");
    const changed = buildV2Analysis(f.state, f.core, alternative, "live");
    expect(changed.posture).toBe(first.posture);
    expect(changed.summary).toContain("합성 보상 조건 변경");
    expect(changed.findings[0].implication).toContain(
      "보상 하한이 실제 목표 역할과 지역에 적용되는지"
    );
    expect(changed.plays[0].move).toContain("합성 보상 조건 변경");
    expect(changed.experiment.action).toContain("재정 여력");
    expect(changed.experiment.continue).toContain("합성 보상 조건 변경");
    expect(changed.evidenceLinks[1].condition).toContain("재정 여력");
    expect(changed.evidenceLinks[1].test).not.toBe(first.evidenceLinks[1].test);
    const factOnly: ExternalIntelligenceV2 = structuredClone(evidence);
    factOnly.evidenceBlocks[1].fact = "서로 다른 합성 근거 사실입니다.";
    expect(
      buildV2Analysis(f.state, f.core, factOnly, "live").plays[0].move
    ).not.toBe(first.plays[0].move);
    expect(JSON.stringify(alternative)).toBe(snapshot);
  });
  it("labels synthetic analysis as a demonstration and connects alternative offers to market pressure", () => {
    const demo = v2DemoFixture("entrepreneurship", "en");
    const input = buildV2Input(demo.state);
    const a = buildV2Analysis(
      demo.state,
      buildProductApplicationV3(input),
      demo.intelligence,
      "demo"
    );
    expect(a.summary).toContain("synthetic evidence");
    expect(a.summary).not.toContain("public evidence items");
    expect(a.evidenceLinks[1].factor).toBe("marketPolicy");
    expect(a.findings.find(f => f.id === "recovery")?.evidenceIds).toContain(1);
  });
  it("changes the full scenario reading while retaining the unresolved execution constraint and original snapshot", () => {
    const f = fixture(),
      snapshot = JSON.stringify(f.input),
      publicSnapshot = JSON.stringify(evidence);
    const result = v2Scenario(f.input, {
      financialRoom: "strong",
      downsideExposure: "low",
      reversibility: "strong",
      internalReadiness: "strong",
    }).result;
    const before = buildV2Analysis(f.state, f.core, evidence),
      after = buildV2Analysis(f.state, result, evidence);
    expect(after.safety[0].band).toBe("strong");
    expect(after.safety[2].level).toBe(3);
    expect(after.findings[0].implication).not.toBe(
      before.findings[0].implication
    );
    expect(after.findings[2].implication).toBe(before.findings[2].implication);
    expect(after.plays.map(p => p.family)).toEqual(
      result.changingPlays.map(p => p.family)
    );
    expect(JSON.stringify(f.input)).toBe(snapshot);
    expect(JSON.stringify(evidence)).toBe(publicSnapshot);
  });
  it("shows unknown safety dimensions distinctly and keeps hypothetical external validation separate from public research", () => {
    const f = fixture(),
      a = buildV2Analysis(f.state, f.core, f.none);
    expect(a.safety.find(s => s.id === "reversibility")?.level).toBeNull();
    const hypothetical = v2Scenario(f.input, {
      externalValidation: "strong",
    }).result;
    expect(hypothetical.postureBasis.externalValidation.band).toBe("strong");
    expect(
      buildV2Analysis(f.state, hypothetical, f.none).evidenceLinks
    ).toEqual([]);
  });
  it("uses a visible bounded public target and keeps private notes and internal bands out of the request", () => {
    const f = fixture();
    f.state.optionalNote = "PRIVATE NOTE";
    f.state.customCondition = "PRIVATE CONDITION";
    expect(v2PublicSearchTarget(f.state)).toContain("임용 자격");
    const request = buildV2EvidenceRequest({
      ...f.state,
      publicSearchTarget: "Example University adjunct appointment",
    });
    expect(request?.targetLabel).toBe("Example University adjunct appointment");
    expect(Object.keys(request!).sort()).toEqual([
      "caseType",
      "externalAreas",
      "language",
      "targetGeography",
      "targetLabel",
    ]);
    expect(JSON.stringify(request)).not.toMatch(
      /PRIVATE|financialRoom|supportSources/
    );
    expect(
      buildV2EvidenceRequest({
        ...f.state,
        publicSearchTarget: "x".repeat(121),
      })
    ).toBeNull();
    const privateOption = {
      ...f.state,
      caseType: "Industry Transition" as const,
      optionB: "PRIVATE PERSON at PRIVATE COMPANY with a private income figure",
      publicSearchTarget: undefined,
    };
    expect(v2PublicSearchTarget(privateOption)).toBe("산업 전환");
    expect(JSON.stringify(buildV2EvidenceRequest(privateOption))).not.toMatch(
      /PRIVATE|income figure/i
    );
  });
  it("renders the shared interpretation, relationship map and evidence-backed scope on all three surfaces", () => {
    const f = fixture(),
      sensitivity = buildV2Sensitivity(f.input, f.core),
      visibleVariables = selectV2SimulatorVariables(
        sensitivity,
        baselineBands(f.input)
      );
    const common = {
      state: f.state,
      intelligence: evidence,
      evidencePhase: "live" as const,
    };
    const dashboard = renderToStaticMarkup(
      <V2Dashboard {...common} core={f.core} onReport={() => {}} />
    );
    const report = renderToStaticMarkup(
      <V2Report
        {...common}
        input={f.input}
        core={f.core}
        sensitivity={sensitivity}
        visibleVariables={visibleVariables}
        onClose={() => {}}
        onPrint={() => {}}
      />
    );
    const simulator = renderToStaticMarkup(
      <V2Simulator
        {...common}
        input={f.input}
        baseline={f.core}
        sensitivity={sensitivity}
        visibleVariables={visibleVariables}
        overrides={{}}
        onScenarioChange={() => {}}
      />
    );
    for (const html of [dashboard, report, simulator]) {
      expect(html).toContain("회복할 여유가 부족");
      expect(html).toContain("준비가 진행돼도 실행 부담");
      expect(html).toContain('data-testid="v2-safety-analysis"');
    }
    for (const html of [dashboard, report]) {
      expect(html).toContain('data-testid="v2-relationship-map"');
      expect(html).toContain('data-testid="v2-framework-readings"');
      expect(html).toContain(evidence.evidenceBlocks[0].sourceUrl);
    }
    expect(report).toContain("강의 결과물과 연구 경력을 각각 요구");
    expect(report).toContain("2026-09-10");
    expect(simulator).toContain('role="tablist"');
  });
  it("labels the unavailable draft and blocks opening or printing during research", () => {
    const f = fixture(),
      sensitivity = buildV2Sensitivity(f.input, f.core);
    const dashboard = renderToStaticMarkup(
      <V2Dashboard
        state={f.state}
        core={f.core}
        intelligence={f.none}
        evidencePhase="loading"
        onReport={() => {}}
      />
    );
    const report = renderToStaticMarkup(
      <V2Report
        state={f.state}
        input={f.input}
        core={f.core}
        sensitivity={sensitivity}
        visibleVariables={[]}
        intelligence={f.none}
        evidencePhase="loading"
        onClose={() => {}}
        onPrint={() => {}}
      />
    );
    expect(dashboard).toContain("구조 초안");
    expect(dashboard).toMatch(/disabled=""/);
    expect(report).toContain("외부 근거 미확인");
    expect(report).toMatch(/disabled=""/);
  });
  it("does not retain the new interpretation or public target in Founder data", () => {
    const f = fixture(),
      a = buildV2Analysis(f.state, f.core, evidence);
    const projected = projectInteractivePatch({
      experience: "interactive-v2",
      schemaVersion: "AMC-MODULES-V2-8",
      publicSearchTarget: "PRIVATE TARGET",
      analysis: a,
      structuralOutputJson: {
        experience: "interactive-v2",
        schemaVersion: "AMC-MODULES-V2-8",
        analysis: a,
      },
    });
    expect(JSON.stringify(projected)).not.toContain("PRIVATE TARGET");
    expect(JSON.stringify(projected)).not.toContain(a.experiment.action);
  });
  it("keeps the brand and local date in the academic-topic filename without copying personal details", () => {
    expect(
      v2ReportFileName(
        "PRIVATE PERSON 교수 경로",
        "General Career Reconfiguration",
        "ko",
        new Date("2026-10-10T12:00:00Z")
      )
    ).toBe("학술_경력_검토_allofmycareer_2026-10-10.pdf");
  });
});
