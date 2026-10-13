import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import V2Processing, { v2ProcessingFailureKind } from "../client/src/components/V2Processing";
import { buildProductApplicationV3, buildFifwmFromReportPayload, fifwmScore } from "../client/src/data/amcProductApplicationV3";
import { buildV2Input } from "../client/src/data/amcV2Model";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { withKoreanParticle } from "../client/src/data/koreanParticle";
import { V2ChangingView } from "../client/src/components/V2AnalysisView";
import { buildV2Analysis } from "../client/src/data/amcV2Analysis";
import { resolveV2ExternalIntelligence } from "../server/externalIntelligenceV2Service";

(globalThis as any).React = React;

const pagePath = path.resolve(__dirname, "../client/src/pages/AmcInteractiveV2.tsx");

describe("Korean particles on free-text labels", () => {
  it.each([
    ["현재 직무와 생활 기반", "은/는", "현재 직무와 생활 기반은"],
    ["현재 회사", "은/는", "현재 회사는"],
    ["창업", "을/를", "창업을"],
    ["이직", "이/가", "이직이"],
    ["서울", "으로/로", "서울로"],
    ["산업 전환", "으로/로", "산업 전환으로"],
    ["새 직무", "으로/로", "새 직무로"],
    ["EMBA", "은/는", "EMBA는"],
    ["HR", "은/는", "HR은"],
    ["PM", "으로/로", "PM으로"],
    ["대조표 근거 3", "은/는", "대조표 근거 3은"],
    ["대조표 근거 2", "은/는", "대조표 근거 2는"],
    ["약한 Safety Margin", "과/와", "약한 Safety Margin과"],
    ["‘연구 과정’", "을/를", "‘연구 과정’을"],
    ["★", "은/는", "★은(는)"],
  ] as const)("%s + %s → %s", (text, particle, expected) => {
    expect(withKoreanParticle(text, particle)).toBe(expected);
  });

  it("never attaches a fixed particle to the customer's option labels in the engine", () => {
    const fixture = v2DemoFixture("industry", "ko");
    const state = {
      ...fixture.state,
      optionA: "현재 직무와 생활 기반",
      optionB: "새 직무",
      protects: [],
      opens: [],
    };
    const core = buildProductApplicationV3(buildV2Input(state, fixture.intelligence));
    const text = JSON.stringify(core);
    expect(text).not.toContain("생활 기반는");
    expect(text).toContain("새 직무로 완전히 전환하기 전에");
    expect(text).toContain("현재 직무와 생활 기반은 현재 기반과 검증 시간을 보호합니다.");
  });
});

describe("canonical FIFWM score parsing keeps missing values unassessed", () => {
  it.each([null, undefined, "", " ", false, true, "abc", 3, -1, 1.5])("%s → null", value => {
    expect(fifwmScore(value)).toBeNull();
  });
  it.each([[0, 0], [1, 1], [2, 2], ["0", 0], ["2", 2]] as const)("%s → %s", (value, expected) => {
    expect(fifwmScore(value)).toBe(expected);
  });
  it("does not turn explicit null report fields into weak (0) factors", () => {
    const fifwm = buildFifwmFromReportPayload({
      F_Formal_Score: null,
      F_Informal_Score: "",
      F_Framework_Score: false,
      F_Workflow_Score: 0,
      F_MarketPolicy_Score: "2",
    });
    expect(fifwm.formal.score).toBeNull();
    expect(fifwm.informal.score).toBeNull();
    expect(fifwm.framework.score).toBeNull();
    expect(fifwm.workflow.score).toBe(0);
    expect(fifwm.marketPolicy.score).toBe(2);
  });
});

describe("results do not open before the explicit evidence analysis settles", () => {
  const source = fs.readFileSync(pagePath, "utf8");
  const finishBody = source.slice(source.indexOf("const finish = "), source.indexOf("const switchLanguage"));

  it("finish() routes evidence requests through the processing phase", () => {
    expect(finishBody).toContain("runEvidenceAnalysis()");
    expect(finishBody).not.toContain('setPhase("dashboard")');
    expect(finishBody).not.toContain('"dashboard_generated"');
  });

  it("dashboard_generated is only emitted when results actually open", () => {
    const emitters = source.split('"dashboard_generated"').length - 1;
    expect(emitters).toBe(2); // openDashboard() and the currentStage value inside it
    const runBody = source.slice(source.indexOf("const runEvidenceAnalysis"), source.indexOf("const finish = "));
    expect(runBody.indexOf('setPhase("processing")')).toBeLessThan(runBody.indexOf("await checkCurrentEvidence()"));
    expect(runBody).toContain('outcome?.result.status === "live"');
  });

  it("shows the real request and no fake progress while running", () => {
    const html = renderToStaticMarkup(
      React.createElement(V2Processing, {
        language: "ko", running: true, seconds: 12,
        target: "○○대학교 EMBA", geography: "서울", areas: ["교육 과정 성과", "재원"],
        observation: null, onRetry: () => {}, onEditTarget: () => {}, onDraft: () => {},
      })
    );
    expect(html).toContain('data-processing-state="running"');
    expect(html).toContain("○○대학교 EMBA");
    expect(html).toContain("경과 시간 12초");
    expect(html).not.toMatch(/%|progress/i);
    expect(html).not.toContain("구조 초안 보기");
  });

  it("offers retry, target edit and an explicit structural draft after a failure", () => {
    const html = renderToStaticMarkup(
      React.createElement(V2Processing, {
        language: "ko", running: false, seconds: 30,
        target: "EMBA", geography: "서울", areas: [],
        observation: { status: 503, reason: "source_unavailable", stage: "normalization", diagnostic: "no_evidence" },
        onRetry: () => {}, onEditTarget: () => {}, onDraft: () => {},
      })
    );
    expect(html).toContain('data-failure-kind="no_evidence"');
    expect(html).toContain("다시 검색");
    expect(html).toContain("검색 대상 수정");
    expect(html).toContain("외부 근거 없는 구조 초안 보기");
    expect(html).toContain("일반론으로 대신 채우지 않았습니다");
  });

  it.each([
    [{ status: 503, reason: "source_unavailable", diagnostic: "no_evidence" }, "no_evidence"],
    [{ status: 503, reason: "source_unavailable", stage: "sources", diagnostic: "source_probe_failure" }, "sources"],
    [{ status: 503, reason: "provider_failure", diagnostic: "timeout" }, "timeout"],
    [{ status: 503, reason: "provider_not_configured", stage: "configuration" }, "service"],
    [{ status: 503, reason: "invalid_provider_response", diagnostic: "citation_mismatch" }, "response"],
    [null, "service"],
  ] as const)("classifies %j as %s", (observation, expected) => {
    expect(v2ProcessingFailureKind(observation as never)).toBe(expected);
  });
});

describe("degree public-evidence request", () => {
  it("sends degree-specific guidance and dimension scope without customer prose", async () => {
    let body: any;
    await resolveV2ExternalIntelligence(
      {
        caseType: "MBA / EMBA / PhD Decision",
        externalAreas: [],
        targetGeography: "Seoul",
        targetLabel: "Example University Executive MBA",
        language: "ko",
      },
      {
        apiKey: "test-key",
        observe: () => {},
        fetchImpl: (async (_url: string, init: RequestInit) => {
          body = JSON.parse(String(init.body));
          return new Response("{}", { status: 500 });
        }) as typeof fetch,
      }
    );
    const system = body.input[0].content as string;
    const user = JSON.parse(body.input[1].content);
    expect(system).toContain("For a degree decision");
    expect(system).toContain("tuition");
    expect(system).toContain("at most one evidence block per (cited source URL, dimension)");
    expect(system).not.toContain("one evidence block per distinct cited source URL");
    expect(Object.keys(user.publicEvidenceDimensionScope)).toEqual([
      "Program outcomes", "Employment relevance", "Funding", "Cost / opportunity cost",
    ]);
    expect(user.publicEvidenceDimensions).toEqual(["Program outcomes", "Employment relevance", "Funding", "Cost / opportunity cost"]);
    expect(Object.keys(user).sort()).toEqual([
      "boundedOptionBTargetLabel", "caseFamilyMissingPoint", "caseType",
      "publicEvidenceDimensionScope", "publicEvidenceDimensions", "responseLanguage", "targetGeography",
    ]);
  });
});

describe("printed Changing section adapts to the number of plays", () => {
  it("marks the play count so one card is not squeezed into a three-column grid", () => {
    const fixture = v2DemoFixture("industry", "ko");
    const analysis = buildV2Analysis(fixture.state, fixture.baseline, fixture.intelligence, "demo");
    const html = renderToStaticMarkup(React.createElement(V2ChangingView, { analysis }));
    expect(html).toContain(`data-count="${analysis.plays.length}"`);
    const css = fs.readFileSync(path.resolve(__dirname, "../client/src/styles/v2-analysis.css"), "utf8");
    expect(css).toContain('.v2-changing-analysis[data-count="1"] { grid-template-columns: 1fr; }');
    expect(css).toMatch(/\.v2-factor-number \{[^}]*white-space: nowrap/);
  });
});

describe("evidence observation records request shape without customer text", () => {
  it("logs enumerated areas and lengths only", async () => {
    const observed: any[] = [];
    await resolveV2ExternalIntelligence(
      { caseType: "MBA / EMBA / PhD Decision", externalAreas: [], targetGeography: "서울",
        targetLabel: "PRIVATE-LOOKING TARGET 123", language: "ko" },
      { apiKey: "test-key", observe: o => { observed.push(o); },
        fetchImpl: (async () => new Response("{}", { status: 500 })) as typeof fetch }
    );
    expect(observed[0].requestShape).toEqual({
      caseType: "MBA / EMBA / PhD Decision", language: "ko",
      areas: ["programOutcomes", "employmentRelevance", "funding", "opportunityCost"],
      defaultAreas: true, targetLength: 26, geographyLength: 2,
    });
    const text = JSON.stringify(observed);
    expect(text).not.toContain("PRIVATE-LOOKING");
    expect(text).not.toContain("서울");
  });
});

describe("Role Upgrade / Downgrade is not framed as an exit", () => {
  it("uses role-change wording while Corporate Stay vs Exit keeps exit wording", () => {
    const base = v2DemoFixture("industry", "ko");
    const plays = (caseType: string) => {
      const state = { ...base.state, caseType: caseType as never, optionA: "현재 팀장 역할", optionB: "본부장 역할" };
      return JSON.stringify(buildProductApplicationV3(buildV2Input(state, base.intelligence)).changingPlays);
    };
    const role = plays("Role Upgrade / Downgrade");
    if (role.includes("role-scope")) {
      expect(role).not.toContain("퇴사");
      expect(role).toContain("역할 변경을 확정하기 전에 현재 팀장 역할의 범위를");
    }
    const exit = plays("Corporate Stay vs Exit");
    if (exit.includes("role-scope")) expect(exit).toContain("퇴사 결정 → 역할 재설계 검증");
    expect(role.includes("role-scope") || exit.includes("role-scope")).toBe(true);
  });
});

describe("posture coverage note and case default scopes", () => {
  it("says when the posture rests on unconfirmed middle values", async () => {
    const { v2PostureCoverageNote } = await import("../client/src/data/v2PostureCoverage");
    const base = v2DemoFixture("industry", "ko");
    const unknownBands = Object.fromEntries(Object.keys(base.state.bands).map(k => [k, "unknown"]));
    const state = { ...base.state, bands: unknownBands as typeof base.state.bands };
    const core = buildProductApplicationV3(buildV2Input(state));
    const note = v2PostureCoverageNote(core, "ko");
    expect(core.postureEvidenceCoverage).toBe("limited");
    expect(note.text).toContain("근거 제한적");
    expect(note.text).toContain("중간값으로 가정");
    expect(note.known).toBeLessThan(note.total);
    const full = v2PostureCoverageNote(buildProductApplicationV3(buildV2Input(base.state, base.intelligence)), "en");
    expect(full.text).toMatch(/rests on \d of \d confirmed structural inputs/);
  });

  it("uses existing areas as case defaults", async () => {
    const { v2EvidenceAreas } = await import("../shared/externalIntelligenceV2Request");
    expect(v2EvidenceAreas({ caseType: "Overseas Relocation", externalAreas: [] })).toEqual(["geography", "visaMobility", "hiringDemand"]);
    expect(v2EvidenceAreas({ caseType: "Burnout-driven Decision", externalAreas: [] })).toEqual(["roleDemand", "compensation", "geography"]);
    expect(v2EvidenceAreas({ caseType: "Family Constraint-heavy Decision", externalAreas: [] })).toEqual(["roleDemand", "compensation", "geography"]);
    expect(v2EvidenceAreas({ caseType: "General Career Reconfiguration", externalAreas: [] })).toEqual(["hiringDemand", "roleDemand", "compensation"]);
  });
});

describe("waiting screen shows only real step states", () => {
  const render = (running: boolean) => renderToStaticMarkup(React.createElement(V2Processing, {
    language: "ko", running, seconds: 3, target: "t", geography: "g", areas: [],
    observation: running ? null : { status: 503, reason: "source_unavailable", diagnostic: "no_evidence" },
    onRetry: () => {}, onEditTarget: () => {}, onDraft: () => {},
  }));
  it("never marks connection or results as done while searching or after failure", () => {
    for (const running of [true, false]) {
      const states = [...render(running).matchAll(/data-state="(\w+)"/g)].map(m => m[1]);
      expect(states).toEqual(["done", running ? "running" : "failed", "pending", "pending"]);
    }
  });
  it("introduces the framework and brand philosophy without progress percentages", () => {
    const html = render(true);
    expect(html).toContain("Structure First");
    expect(html).toContain("기회의 조건");
    expect(html).toContain("버틸 수 있는가");
    expect(html).not.toMatch(/\d+\s*%/);
  });
});
