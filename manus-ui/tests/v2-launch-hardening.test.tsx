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
    expect(runBody.indexOf('setPhase("processing")')).toBeGreaterThan(-1);
    expect(runBody.indexOf('setPhase("processing")')).toBeLessThan(runBody.indexOf("await checkCurrentEvidence("));
    // Results open when the first topic with usable evidence arrives (or at the end if live).
    expect(runBody).toContain('openDashboard(firstLive.input, firstLive.core, "live")');
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
    const bodies: any[] = [];
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
          bodies.push(JSON.parse(String(init.body)));
          return new Response("{}", { status: 500 });
        }) as typeof fetch,
      }
    );
    // Topic fan-out: two parallel searches of two dimensions each.
    expect(bodies).toHaveLength(2);
    const users = bodies.map(body => JSON.parse(body.input[1].content));
    expect(users.flatMap(user => user.publicEvidenceDimensions)).toEqual([
      "Program outcomes", "Employment relevance", "Funding", "Cost / opportunity cost",
    ]);
    for (const [i, body] of bodies.entries()) {
      const system = body.input[0].content as string;
      expect(system).toContain("For a degree decision");
      expect(system).toContain("tuition");
      expect(system).toContain("at most one evidence block per (cited source URL, dimension)");
      expect(system).not.toContain("one evidence block per distinct cited source URL");
      expect(system).toContain("This search covers only these dimensions");
      expect(Object.keys(users[i].publicEvidenceDimensionScope)).toEqual(users[i].publicEvidenceDimensions);
      expect(Object.keys(users[i]).sort()).toEqual([
        "boundedOptionBTargetLabel", "caseFamilyMissingPoint", "caseType",
        "publicEvidenceDimensionScope", "publicEvidenceDimensions", "responseLanguages", "targetGeography",
      ]);
      expect(body.response_format.json_schema.schema.properties.evidenceBlocks.maxItems).toBe(3);
    }
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
    expect(v2EvidenceAreas({ caseType: "Overseas Relocation", externalAreas: [] })).toEqual(["visaMobility", "hiringDemand", "compensation", "geography"]);
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

describe("case-adapted structure assessment", () => {
  it("scores only exact 0/1/2 answers under a separate source and keeps unsure/n.a. unassessed", async () => {
    const { buildV2CaseFifwm, v2CaseFifwmSet } = await import("../client/src/data/v2CaseFifwm");
    const set = v2CaseFifwmSet("MBA / EMBA / PhD Decision")!;
    expect(set.questions.map(q => q.factor)).toEqual(["formal", "informal", "framework", "workflow", "marketPolicy"]);
    const built = buildV2CaseFifwm("MBA / EMBA / PhD Decision", "ko", {
      targetRoleStatus: "known",
      answers: { case_formal: "2", case_informal: "0", case_framework: "__unknown__", case_workflow: "__na__", case_marketPolicy: "" },
    })!;
    expect(built.fifwmSource).toBe("case-adapted");
    expect(built.fifwm.formal.score).toBe(2);
    expect(built.fifwm.informal.score).toBe(0);
    expect(built.fifwm.framework.score).toBeNull();
    expect(built.fifwm.workflow.score).toBeNull();
    expect(built.fifwm.marketPolicy.score).toBeNull();
    expect(built.fifwm.formal.reading).toContain("사례 맞춤 구조 평가");
    expect(buildV2CaseFifwm("MBA / EMBA / PhD Decision", "ko", { targetRoleStatus: "unsure", answers: { case_formal: "2" } })).toBeNull();
    expect(v2CaseFifwmSet("Industry Transition")).toBeNull();
    expect(v2CaseFifwmSet("General Career Reconfiguration")).toBeNull();
  });

  it("feeds the existing posture formula and is labelled distinctly in analysis and coverage", async () => {
    const { v2PostureCoverageNote } = await import("../client/src/data/v2PostureCoverage");
    const { v2CanAskCanonicalFifwm } = await import("../client/src/data/v2CanonicalFifwm");
    expect(v2CanAskCanonicalFifwm("General Career Reconfiguration")).toBe(true);
    const state = { ...v2DemoFixture("industry", "ko").state, caseType: "Entrepreneurship" as const };
    const core = buildProductApplicationV3(buildV2Input(state, undefined, {
      targetRoleStatus: "known", answers: { case_formal: "2", case_workflow: "1" },
    }));
    expect(core.decisionStructure.fifwmSource).toBe("case-adapted");
    expect(v2PostureCoverageNote(core, "ko").text).toContain("사례 맞춤 구조 평가는 2개 항목");
    const analysis = buildV2Analysis(state, core, v2DemoFixture("industry", "ko").intelligence, "demo");
    expect(analysis.factorScopeNote).toContain("사례 맞춤 구조 평가");
  });
});

describe("decision type and public search are inferred from what the customer wrote", () => {
  it("recognises the Hong Kong residency test as an overseas relocation, not stay-or-exit", async () => {
    const { inferV2CaseRanking, inferV2Geography, inferV2SearchTarget } = await import("../client/src/data/v2CaseInference");
    const text = { decision: "홍콩 영주권 취득", optionA: "현재 한국에서 대기업 근무", optionB: "홍콩 영주권 취득하여 홍콩에서 이직 및 가족과 생활 추진" };
    const ranking = inferV2CaseRanking(text);
    expect(ranking[0].caseType).toBe("Overseas Relocation");
    expect(ranking[0].matched).toEqual(expect.arrayContaining(["홍콩", "영주권"]));
    expect(inferV2Geography(text, "ko")).toBe("홍콩");
    expect(inferV2Geography(text, "en")).toBe("Hong Kong");
    // Intent words and private-life phrasing are dropped from the public target (B3).
    expect(inferV2SearchTarget(text)).toBe("홍콩 영주권 취득 홍콩에서 이직");
  });
  it.each([
    [{ decision: "EMBA 진학", optionA: "현 직장", optionB: "서울대 EMBA" }, "MBA / EMBA / PhD Decision"],
    [{ decision: "창업할지", optionA: "회사 유지", optionB: "재고관리 SaaS 창업" }, "Entrepreneurship"],
    [{ decision: "팀장 승진 제안", optionA: "실무자 유지", optionB: "팀장 역할 수락" }, "Role Upgrade / Downgrade"],
    [{ decision: "번아웃으로 휴직 고민", optionA: "계속 근무", optionB: "6개월 휴직" }, "Burnout-driven Decision"],
    [{ decision: "다음 단계", optionA: "현재", optionB: "변화" }, "General Career Reconfiguration"],
  ] as const)("%j → %s", async (text, expected) => {
    const { inferV2CaseType } = await import("../client/src/data/v2CaseInference");
    expect(inferV2CaseType(text)).toBe(expected);
  });
});

describe("one search returns both languages; source-language prose never reaches cards", () => {
  const request = { caseType: "Overseas Relocation" as const, externalAreas: ["hiringDemand"], targetGeography: "Hong Kong", targetLabel: "Hong Kong job move", language: "ko" as const };
  const url = "https://www.censtatd.gov.hk/report";
  const envelope = (content: unknown) => ({
    object: "response", status: "completed", error: null,
    output: [
      { type: "search_results", results: [{ url, title: "職位空缺統計季報" }] },
      { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(content) }] },
    ],
  });
  const summary = (lang: "en" | "ko") => lang === "ko"
    ? { opportunitySignals: [], frictionSignals: [], uncertainties: ["개인 자격은 확인되지 않았습니다."], implication: "홍콩 민간 부문 구인 수요가 줄었다는 공식 통계입니다." }
    : { opportunitySignals: [], frictionSignals: [], uncertainties: ["Personal eligibility is unverified."], implication: "Official statistics show fewer private-sector vacancies in Hong Kong." };

  it("keeps the same card in Korean and English", async () => {
    const { inspectV2AgentResponse } = await import("../server/externalIntelligenceV2Service");
    const content = {
      contextConfidence: "medium",
      evidenceBlocks: [{ dimension: "Hiring demand", direction: "caution", sourceUrl: url,
        en: { headline: "Private-sector vacancies fell 8.4% year on year", fact: "Hong Kong reported 45,380 private-sector vacancies in June 2026, down 8.4% from a year earlier.", whyItMatters: "Covers selected industries; not a single employer's hiring." },
        ko: { headline: "민간 부문 구인 8.4% 감소", fact: "홍콩 정부 통계처는 2026년 6월 민간 부문 구인 수를 45,380건으로 보고했으며, 1년 전보다 8.4% 줄었습니다.", whyItMatters: "일부 업종을 포괄한 통계이며 특정 기업의 채용을 뜻하지 않습니다." } }],
      en: summary("en"), ko: summary("ko"),
    };
    const result = inspectV2AgentResponse(envelope(content), request).value!;
    expect(result.status).toBe("live");
    expect(result.evidenceBlocks[0].fact).toContain("45,380건");
    expect(result.translation?.evidenceBlocks[0].fact).toContain("45,380 private-sector");
    expect(result.evidenceBlocks[0].sourceLabel).toBe("職位空缺統計季報"); // original title kept as the reference
    const { acceptV2Evidence } = await import("../client/src/data/v2ExternalEvidenceClient");
    // As the route returns it after source checks (coverage set by the server).
    const { alignTranslation } = await import("../server/externalIntelligenceV2Service");
    const routed = { ...result, sourceCoverage: "complete" as const };
    routed.translation = alignTranslation(routed, result.translation!, "en");
    const accepted = acceptV2Evidence(routed, request)!;
    expect(accepted.translation?.evidenceBlocks).toHaveLength(1);
  });

  it("excludes a card written in the source language instead of the requested one", async () => {
    const { inspectV2AgentResponse } = await import("../server/externalIntelligenceV2Service");
    const chinese = "香港政府統計處報告，2026年6月受調查私營機構職位空缺為45,380個，較一年前減少8.4%。";
    const content = {
      contextConfidence: "medium",
      evidenceBlocks: [{ dimension: "Hiring demand", direction: "caution", sourceUrl: url,
        en: { headline: "Vacancies fell", fact: "Vacancies fell 8.4%.", whyItMatters: "Selected industries only." },
        ko: { headline: "私營機構職位空缺減少", fact: chinese, whyItMatters: "並非特定企業的招聘數據。" } }],
      en: summary("en"), ko: summary("ko"),
    };
    const inspected = inspectV2AgentResponse(envelope(content), request);
    expect(inspected.value?.status).toBe("unavailable");
    expect(inspected.diagnostic?.category).toBe("language_mismatch");
  });
});

describe("research brief covers what each decision type needs", () => {
  it.each([
    ["Overseas Relocation", ["visa or residency routes", "processing times", "pay levels by industry"]],
    ["Entrepreneurship", ["licences", "public support programmes"]],
    ["Corporate Stay vs Exit", ["hiring market", "severance"]],
    ["Family Constraint-heavy Decision", ["childcare", "flexible-work"]],
  ] as const)("%s", async (caseType, phrases) => {
    let body: any;
    await resolveV2ExternalIntelligence(
      { caseType, externalAreas: [], targetGeography: "Seoul", targetLabel: "target", language: "en" },
      { apiKey: "k", observe: () => {}, fetchImpl: (async (_u: string, init: RequestInit) => { body = JSON.parse(String(init.body)); return new Response("{}", { status: 500 }); }) as typeof fetch }
    );
    for (const phrase of phrases) expect(body.input[0].content).toContain(phrase);
    expect(body.input[0].content).toContain("at least one card");
  });
});

describe("topic fan-out", () => {
  it("researches overseas visa/residency in its own search and caps groups at three", async () => {
    const { v2EvidenceGroups } = await import("../server/externalIntelligenceV2Service");
    const base = { externalAreas: [] as string[], targetGeography: "Hong Kong", targetLabel: "t", language: "ko" as const };
    expect(v2EvidenceGroups({ ...base, caseType: "Overseas Relocation" })).toEqual([["visaMobility"], ["hiringDemand", "compensation"], ["geography"]]);
    expect(v2EvidenceGroups({ ...base, caseType: "Entrepreneurship" })).toEqual([["customerDemand", "competition"], ["pricing", "distribution"]]);
    expect(v2EvidenceGroups({ ...base, caseType: "Entrepreneurship", externalAreas: ["pricing"] })).toEqual([["pricing"]]);
  });

  it("merges topic results within limits and keeps a failed topic from hiding the others", async () => {
    const { mergeV2Evidence } = await import("../server/externalIntelligenceV2Service");
    const card = (n: number, dimension: string) => ({ dimension, headline: `근거 ${n}`, direction: "mixed" as const, fact: `사실 ${n}입니다.`, whyItMatters: `범위 ${n}입니다.`, sourceLabel: `출처 ${n}`, sourceUrl: `https://example.org/${n}`, provenance: "EXTERNAL_EVIDENCE" as const });
    const live = (cards: ReturnType<typeof card>[], implication: string) => ({
      status: "live" as const, generatedAt: "2026-10-14T00:00:00.000Z", caseType: "Overseas Relocation", contextConfidence: "medium" as const,
      evidenceBlocks: cards, metrics: [], opportunitySignals: ["기회 신호입니다."], frictionSignals: [], uncertainties: ["불확실성입니다."], implication,
    });
    const merged = mergeV2Evidence([
      live([card(1, "Visa / mobility")], "비자 경로가 공개되어 있습니다."),
      live([card(2, "Hiring demand"), card(3, "Compensation")], "구인과 임금 통계가 있습니다."),
    ], { caseType: "Overseas Relocation", externalAreas: [], targetGeography: "홍콩", targetLabel: "t", language: "ko" });
    expect(merged.evidenceBlocks.map(b => b.headline)).toEqual(["근거 1", "근거 2", "근거 3"]);
    expect(merged.implication).toBe("비자 경로가 공개되어 있습니다. 구인과 임금 통계가 있습니다.");
    expect(merged.opportunitySignals).toEqual(["기회 신호입니다."]);
    expect(merged.contextConfidence).toBe("medium");
  });
});

describe("rate-limited topic searches are retried", () => {
  it("retries a 429 and then uses the successful response", async () => {
    const { inspectV2AgentResponse: _unused } = await import("../server/externalIntelligenceV2Service");
    let calls = 0;
    const result = await resolveV2ExternalIntelligence(
      { caseType: "Entrepreneurship", externalAreas: ["pricing"], targetGeography: "Seoul", targetLabel: "t", language: "en" },
      { apiKey: "k", observe: () => {}, retryDelayMs: 0, sourceAvailable: async () => true,
        fetchImpl: (async () => {
          calls++;
          if (calls < 3) return new Response("busy", { status: 429 });
          return new Response("not json", { status: 200 });
        }) as typeof fetch }
    );
    expect(calls).toBe(3); // two retries, then the response is used
    expect(result.status).toBe("unavailable");
  });
});


describe("a slow topic does not discard finished topics", () => {
  it("keeps the visa card when another topic times out", async () => {
    const url = "https://www.immd.gov.hk/visa";
    const content = {
      contextConfidence: "medium",
      evidenceBlocks: [{ dimension: "Visa / mobility", direction: "mixed", sourceUrl: url,
        en: { headline: "Work visa route is published", fact: "The immigration department publishes an employment visa route with stated conditions.", whyItMatters: "Personal eligibility is not assessed." },
        ko: { headline: "취업비자 경로가 공개되어 있음", fact: "이민국은 조건이 명시된 취업비자 경로를 공개합니다.", whyItMatters: "개인 자격은 평가하지 않습니다." } }],
      en: { opportunitySignals: [], frictionSignals: [], uncertainties: ["Eligibility is unverified."], implication: "A visa route is published." },
      ko: { opportunitySignals: [], frictionSignals: [], uncertainties: ["자격은 확인되지 않았습니다."], implication: "비자 경로가 공개되어 있습니다." },
    };
    const envelope = { object: "response", status: "completed", error: null, output: [
      { type: "search_results", results: [{ url, title: "Employment visa" }] },
      { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(content) }] },
    ] };
    const result = await resolveV2ExternalIntelligence(
      { caseType: "Overseas Relocation", externalAreas: [], targetGeography: "홍콩", targetLabel: "홍콩 이주", language: "ko" },
      { apiKey: "k", observe: () => {}, retryDelayMs: 0, timeoutMs: 150, sourceAvailable: async () => true,
        fetchImpl: (async (_u: string, init: RequestInit) => {
          const body = JSON.parse(String(init.body));
          const dims = JSON.parse(body.input[1].content).publicEvidenceDimensions;
          if (dims.includes("Visa / mobility")) return Response.json(envelope);
          // Other topics hang until the search deadline aborts them.
          return new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new Error("aborted"))));
        }) as typeof fetch }
    );
    expect(result.status).toBe("live");
    expect(result.evidenceBlocks.map(b => b.headline)).toEqual(["취업비자 경로가 공개되어 있음"]);
  });
});

describe("round 3: framework plan, auto comparison, citation markers", () => {
  it("routes cost cards to Safety Margin and collects preparation tips", async () => {
    const { default: V2FrameworkPlan } = await import("../client/src/components/V2FrameworkPlan");
    const fixture = v2DemoFixture("industry", "ko");
    const analysis = buildV2Analysis(fixture.state, fixture.baseline, fixture.intelligence, "demo");
    const intelligence = {
      ...fixture.intelligence,
      evidenceBlocks: [
        { ...fixture.intelligence.evidenceBlocks[0], area: "opportunityCost", headline: "연간 학비 £24,000", fact: "공식 안내는 연간 학비를 £24,000로 밝힙니다. 생활비는 별도입니다.", action: "이 금액을 내 저축으로 몇 년 감당할 수 있는지 계산해 보세요." },
        { ...fixture.intelligence.evidenceBlocks[1], area: "requiredSkills", headline: "통계 역량 요구", fact: "과정은 기초 통계 이수를 전제합니다.", action: "통계 기초 과목 이수 여부를 확인하세요." },
      ],
    };
    const html = renderToStaticMarkup(React.createElement(V2FrameworkPlan, { language: "ko", core: fixture.baseline, analysis, intelligence }));
    expect(html).toContain("연간 학비 £24,000");
    expect(html).toContain("몇 개월 감당할 수 있는지");
    expect(html).toContain("준비할 역량과 준비 경로");
    expect(html).toContain("통계 역량 요구");
    expect(html).toContain("통계 기초 과목 이수 여부를 확인하세요.");
    expect(html).toContain("놓치기 쉬운 조건");
    expect(html).toContain("판단 전환 조건");
  });

  it("labels a first-pass comparison as automatic", async () => {
    const { v2AutoComparison } = await import("../client/src/components/V2InsightBoard");
    expect(v2AutoComparison("caution", "weak")).toBe("watch");
    expect(v2AutoComparison("caution", "heavy")).toBe("watch");
    expect(v2AutoComparison("supportive", "strong")).toBe("fits");
    expect(v2AutoComparison("supportive", "unknown")).toBe("check");
    expect(v2AutoComparison("mixed", "developing")).toBe("check");
  });

  it("removes provider citation markers", async () => {
    const { stripCitations } = await import("../server/externalIntelligenceV2Service");
    expect(stripCitations("거부될 수 있습니다. [web:1]")).toBe("거부될 수 있습니다.");
    expect(stripCitations("Fees rose [1][2] in 2026 [web:3, web:4].")).toBe("Fees rose in 2026.");
  });
});

describe("issue A1: merged evidence reaches the structural analysis", () => {
  const card = (n: number, dimension: string) => ({ dimension, headline: `근거 ${n}`, direction: "mixed" as const, fact: `사실 ${n}입니다.`, whyItMatters: `범위 ${n}입니다.`, sourceLabel: `출처 ${n}`, sourceUrl: `https://example.org/${n}`, provenance: "EXTERNAL_EVIDENCE" as const });
  const live = (cards: ReturnType<typeof card>[], coverage?: "complete" | "partial") => ({
    status: "live" as const, generatedAt: "2026-10-14T00:00:00.000Z", caseType: "MBA / EMBA / PhD Decision",
    contextConfidence: "medium" as const, ...(coverage ? { sourceCoverage: coverage } : {}),
    evidenceBlocks: cards, metrics: [], opportunitySignals: [], frictionSignals: [], uncertainties: ["불확실성입니다."], implication: "함의입니다.",
  });
  const request = { caseType: "MBA / EMBA / PhD Decision" as const, externalAreas: [], targetGeography: "영국", targetLabel: "t", language: "ko" as const };

  it("keeps complete coverage so the engine reads market evidence", async () => {
    const { mergeV2Evidence } = await import("../shared/v2EvidenceMerge");
    const { v2ExternalContext } = await import("../client/src/data/v2ExternalContext");
    const merged = mergeV2Evidence([live([card(1, "Funding")], "complete"), live([card(2, "Program outcomes")], "complete")], request);
    expect(merged.sourceCoverage).toBe("complete");
    expect(merged.contextConfidence).toBe("medium");
    expect(v2ExternalContext(merged).status).toBe("live");
    // The structural engine now sees a known market-evidence band.
    const fixture = v2DemoFixture("industry", "ko");
    const state = { ...fixture.state, caseType: "MBA / EMBA / PhD Decision" as const };
    const core = buildProductApplicationV3(buildV2Input(state, merged));
    expect(core.postureBasis.externalValidation.band).not.toBe("unknown");
    expect(core.postureBasis.externalValidation.source).toBe("live-external-evidence");
  });

  it("stays partial when any topic had an excluded source, and unset before source checks", async () => {
    const { mergeV2Evidence } = await import("../shared/v2EvidenceMerge");
    expect(mergeV2Evidence([live([card(1, "Funding")], "complete"), live([card(2, "Program outcomes")], "partial")], request).sourceCoverage).toBe("partial");
    expect(mergeV2Evidence([live([card(1, "Funding")]), live([card(2, "Program outcomes")])], request).sourceCoverage).toBeUndefined();
  });
});

describe("issues B2-B4: situational topics, target cleanup, a card per topic", () => {
  it("adds living/mobility facts for a degree abroad but not at home (B2)", async () => {
    const { v2SituationalAreas } = await import("../client/src/data/v2ExternalEvidenceClient");
    const degree = { caseType: "MBA / EMBA / PhD Decision" as const, externalAreas: [] as never[] };
    expect(v2SituationalAreas({ ...degree, targetGeography: "영국" })).toContain("geographyMobility");
    expect(v2SituationalAreas({ ...degree, targetGeography: "서울" })).not.toContain("geographyMobility");
    expect(v2SituationalAreas({ ...degree, targetGeography: "영국", externalAreas: ["funding"] as never[] })).toEqual(["funding"]);
  });

  it("cleans intent words from the search target (B3)", async () => {
    const { inferV2SearchTarget } = await import("../client/src/data/v2CaseInference");
    expect(inferV2SearchTarget({ decision: "", optionB: "영국 철학 박사 도전" })).toBe("영국 철학 박사");
    expect(inferV2SearchTarget({ decision: "", optionB: "서울 식당 재고관리 SaaS 창업" })).toBe("서울 식당 재고관리 SaaS 창업");
  });

  it("keeps at least one card from every topic under the cap (B4)", async () => {
    const { mergeV2Evidence } = await import("../shared/v2EvidenceMerge");
    const card = (t: number, n: number) => ({ dimension: `D${t}`, headline: `주제${t} 근거${n}`, direction: "mixed" as const, fact: "사실입니다.", whyItMatters: "범위입니다.", sourceLabel: "s", sourceUrl: `https://example.org/${t}/${n}`, provenance: "EXTERNAL_EVIDENCE" as const });
    const live = (t: number, count: number) => ({ status: "live" as const, generatedAt: "2026-10-14T00:00:00.000Z", caseType: "Overseas Relocation", sourceCoverage: "complete" as const, contextConfidence: "medium" as const,
      evidenceBlocks: Array.from({ length: count }, (_, n) => card(t, n)), metrics: [], opportunitySignals: [], frictionSignals: [], uncertainties: ["u입니다."], implication: "함의입니다." });
    const merged = mergeV2Evidence([live(1, 6), live(2, 6), live(3, 1)], { caseType: "Overseas Relocation", externalAreas: [], targetGeography: "홍콩", targetLabel: "t", language: "ko" });
    expect(merged.evidenceBlocks).toHaveLength(10);
    expect(merged.evidenceBlocks.map(b => b.dimension)).toContain("D3");
    expect(merged.evidenceBlocks[0].dimension).toBe("D1");
  });
});


describe("issues A3-A5: framework elements filled from engine and evidence", () => {
  it("engine switches are exactly the one-step moves that change the posture (A3)", async () => {
    const { v2EngineSwitches } = await import("../client/src/data/v2EngineSwitches");
    const { evaluateScenario } = await import("../client/src/data/amcScenario");
    const fixture = v2DemoFixture("industry", "ko");
    const input = buildV2Input(fixture.state, fixture.intelligence);
    const core = buildProductApplicationV3(input);
    const switches = v2EngineSwitches(input, core, "ko", 10);
    for (const item of switches) {
      const band = item.signal.split("→")[1].trim();
      expect(item.direction).toContain("구조 판단이");
      expect(item.direction).not.toContain(core.currentStructuralPosture.label + "'");
      expect(band.length).toBeGreaterThan(0);
    }
    // Recompute independently: every reported variable changes the posture for some one-step move.
    for (const item of switches) {
      const ladders: Record<string, string[]> = { downsideExposure: ["high", "moderate", "low"], constraintLoad: ["heavy", "material", "light"] };
      const ladder = ladders[item.variable] ?? ["weak", "developing", "strong"];
      const changes = ladder.some(b => evaluateScenario(input, { [item.variable]: b } as never).currentStructuralPosture.label !== core.currentStructuralPosture.label);
      expect(changes).toBe(true);
    }
  });

  it("plan shows engine switches, open conditions and evidence routes (A3-A5)", async () => {
    const { default: V2FrameworkPlan } = await import("../client/src/components/V2FrameworkPlan");
    const fixture = v2DemoFixture("industry", "ko");
    const unknownState = { ...fixture.state, bands: { ...fixture.state.bands, reversibility: "unknown" as const } };
    const input = buildV2Input(unknownState, fixture.intelligence);
    const core = buildProductApplicationV3(input);
    const analysis = buildV2Analysis(unknownState, core, fixture.intelligence, "demo");
    const intelligence = { ...fixture.intelligence, evidenceBlocks: [{ ...fixture.intelligence.evidenceBlocks[0], headline: "원격 박사 경로가 공개됨", fact: "이 대학은 원격 연구 경로를 안내합니다." }] };
    const html = renderToStaticMarkup(React.createElement(V2FrameworkPlan, { language: "ko", core, analysis, intelligence, input }));
    expect(html).toContain("아직 미확인인 내 조건");
    expect(html).toContain("되돌릴 여지");
    expect(html).toContain("근거로 확인된 중간 경로");
    expect(html).toContain("원격 박사 경로가 공개됨");
    const { v2EngineSwitches } = await import("../client/src/data/v2EngineSwitches");
    if (v2EngineSwitches(input, core, "ko").length) expect(html).toContain("엔진 계산");
  });
});

describe("simulator explains a scenario in customer terms", () => {
  it("states meaning, threshold position and how to make the change real", async () => {
    const { default: V2ScenarioExplain } = await import("../client/src/components/V2ScenarioExplain");
    const { v2Scenario } = await import("../client/src/data/amcV2Model");
    const fixture = v2DemoFixture("industry", "ko");
    const input = buildV2Input(fixture.state, fixture.intelligence);
    const { baselineBands } = await import("../client/src/data/amcScenario");
    const current = (baselineBands(input) as Record<string, string>).financialRoom;
    const overrides = { financialRoom: (current === "strong" ? "weak" : "strong") as "strong" | "weak" };
    const scenarioInput = v2Scenario(input, overrides).input;
    const html = renderToStaticMarkup(React.createElement(V2ScenarioExplain, {
      language: "ko", input, scenarioInput, overrides,
      intelligence: { ...fixture.intelligence, evidenceBlocks: [{ ...fixture.intelligence.evidenceBlocks[0], headline: "연간 학비 £24,000", fact: "학비는 £24,000입니다." }] },
    }));
    expect(html).toContain("이 시나리오 해석");
    expect(html).toContain("판단 위치");
    expect(html).toContain("무엇인가요");
    expect(html).toContain("현실에서 이렇게 되려면");
    expect(html).toContain("연간 학비 £24,000");
    const none = renderToStaticMarkup(React.createElement(V2ScenarioExplain, { language: "ko", input, scenarioInput: input, overrides: {}, intelligence: fixture.intelligence }));
    expect(none).toBe("");
  });
});

describe("executive brief shows the analysis in keywords", () => {
  it("lists figures, biggest gap, missing point, a switch and the next step", async () => {
    const { default: V2ExecutiveBrief, v2AmountKeywords } = await import("../client/src/components/V2ExecutiveBrief");
    const fixture = v2DemoFixture("industry", "ko");
    const input = buildV2Input(fixture.state, fixture.intelligence);
    const core = buildProductApplicationV3(input);
    const analysis = buildV2Analysis(fixture.state, core, fixture.intelligence, "demo");
    const intelligence = { ...fixture.intelligence, evidenceBlocks: [{ ...fixture.intelligence.evidenceBlocks[0], headline: "박사 대출 최대 £31,122", fact: "총 최대 £31,122입니다.", action: "총 대출액을 학비와 비교하세요." }] };
    expect(v2AmountKeywords(intelligence.evidenceBlocks, "ko")[0].amount).toBe("£31,122");
    const html = renderToStaticMarkup(React.createElement(V2ExecutiveBrief, { language: "ko", core, analysis, intelligence, input }));
    for (const label of ["핵심 숫자", "가장 큰 부족", "놓치기 쉬운 조건", "판단을 바꿀 조건", "다음 30일 할 일"]) expect(html).toContain(label);
    expect(html).toContain("£31,122");
    expect(html).toContain("총 대출액을 학비와 비교하세요.");
    expect(html).toContain(analysis.posture);
  });
});
