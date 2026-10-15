import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { buildV2Input } from "../client/src/data/amcV2Model";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { buildV2Analysis } from "../client/src/data/amcV2Analysis";
import V2ExecutiveBrief from "../client/src/components/V2ExecutiveBrief";
import V2IndicatorProfile from "../client/src/components/V2IndicatorProfile";
import V2FrameworkPlan from "../client/src/components/V2FrameworkPlan";
import V2PathMap from "../client/src/components/V2PathMap";
import V2InsightBoard from "../client/src/components/V2InsightBoard";
import { caseTypes } from "../shared/interactivePrivacy";
(globalThis as any).React = React;

const roles: Record<string, [string, string, Record<string, string>]> = {
  "Corporate Stay vs Exit": ["대기업 재무 차장", "퇴사 후 스타트업 재무 이사", { offer: "interviewing", income: "small" }],
  "Industry Transition": ["반도체 엔지니어", "바이오 데이터 분석가 이직", { experience: "adjacent", route: "direct" }],
  "Role Upgrade / Downgrade": ["마케팅 과장", "마케팅 팀장 승진", { offer: "exploring" }],
  Entrepreneurship: ["IT 기업 기획자", "IT 스타트업 창업", { validation: "interviews", funding: "self", job: "keep" }],
  "MBA / EMBA / PhD Decision": ["중견기업 마케팅 과장", "서울대 EMBA 진학", { admission: "applying", format: "parttime", funding: "employer" }],
  "Overseas Relocation": ["한국 대기업 차장", "싱가포르 부동산 기업 이직", { offer: "exploring", family: "children", route: "employer" }],
  "Burnout-driven Decision": ["병원 간호사", "의료 데이터 분석가 전직", { offer: "exploring", income: "same" }],
  "Family Constraint-heavy Decision": ["대기업 영업 과장", "재택 가능한 외국계 기업 이직", { care: "children" }],
  "General Career Reconfiguration": ["회계사", "컨설턴트 이직", { offer: "exploring", timing: "within6" }],
};

// Text quality across all nine decision types in both languages.
it("renders clean dashboard text for every decision type in Korean and English", () => {
  const findings: string[] = [];
  for (const language of ["ko", "en"] as const) for (const caseType of caseTypes) {
    const f = v2DemoFixture("industry", language);
    const [a, b, keyFacts] = roles[caseType];
    const state = { ...f.state, language, caseType, optionA: a, optionB: b, decision: `현재: ${a} → 고민: ${b}`, publicSearchTarget: b, keyFacts };
    const intelligence = { ...f.intelligence, caseType };
    const input = buildV2Input(state as any, intelligence as any);
    const core = buildProductApplicationV3(input);
    const analysis = buildV2Analysis(state as any, core, intelligence as any, "demo");
    const bands = { financialRoom: "developing", reversibility: "unknown", constraintLoad: "heavy" };
    const html = [
      renderToStaticMarkup(<V2ExecutiveBrief language={language} core={core} analysis={analysis} intelligence={intelligence as any} input={input} />),
      renderToStaticMarkup(<V2PathMap language={language} state={state as any} core={core} analysis={analysis} intelligence={intelligence as any} />),
      renderToStaticMarkup(<V2IndicatorProfile language={language} core={core} intelligence={intelligence as any} bands={bands} />),
      renderToStaticMarkup(<V2InsightBoard language={language} core={core} analysis={analysis} intelligence={intelligence as any} mode="board" />),
      renderToStaticMarkup(<V2FrameworkPlan language={language} core={core} analysis={analysis} intelligence={intelligence as any} input={input} bands={bands} />),
    ].join("\n");
    const text = html.replace(/<[^>]+>/g, "\n").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    const tag = `${language}/${caseType}`;
    const bad = (re: RegExp, why: string) => { const m = text.match(re); if (m) findings.push(`${tag} | ${why} | ${m.slice(0, 3).join(" ‖ ")}`); };
    bad(/undefined|null|NaN|\[object/g, "raw value");
    bad(/\b[a-z]+[A-Z][a-zA-Z]+\b/g, "camelCase key");
    if (language === "en") bad(/[가-힣]{2,}[^\n]{0,20}/g, "Korean in EN");
    if (language === "ko") bad(/(을를|를을|이가|가이|은는|는은|과와|와과|\(으\)로|\(이\)|을\/를|이\/가)/g, "particle");
  }
  expect(findings).toEqual([]);
});
