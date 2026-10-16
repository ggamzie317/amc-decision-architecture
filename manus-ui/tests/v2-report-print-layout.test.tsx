import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import V2Report from "../client/src/components/V2Report";
import V2SensitivityMatrix from "../client/src/components/V2SensitivityMatrix";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { buildV2Input, buildV2Sensitivity, initialV2State } from "../client/src/data/amcV2Model";
import type { V2EvidencePhase } from "../client/src/data/amcV2Analysis";
import { unavailableIntelligence } from "../client/src/data/externalIntelligenceV2";
import type { V2Language } from "../client/src/data/v2Language";

(globalThis as any).React = React;

const css = (file: string) =>
  fs.readFileSync(path.resolve(__dirname, "../client/src/styles", file), "utf8");
const rule = (source: string, selector: string) => {
  const at = source.indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThanOrEqual(0);
  return source.slice(at, source.indexOf("}", at));
};
const printFlow = () => {
  const source = css("v2-analysis.css");
  return source.slice(source.indexOf("===== Printed report flow"));
};

function report(language: V2Language, evidencePhase: V2EvidencePhase) {
  const state = initialV2State(language);
  Object.assign(state, {
    decision: language === "ko" ? "EMBA 진학 검토" : "Considering an EMBA",
    optionA: language === "ko" ? "재무팀 과장" : "Finance manager",
    optionB: language === "ko" ? "EMBA 과정 진학" : "EMBA program",
  });
  const input = buildV2Input(state),
    core = buildProductApplicationV3(input);
  return renderToStaticMarkup(
    <V2Report
      state={state}
      input={input}
      core={core}
      sensitivity={buildV2Sensitivity(input, core)}
      visibleVariables={[]}
      intelligence={unavailableIntelligence(state.caseType, language)}
      evidencePhase={evidencePhase}
      onClose={() => {}}
      onPrint={() => {}}
    />
  );
}
const cover = (html: string) => html.slice(html.indexOf('class="v2-cover"'), html.indexOf('class="v2-cover-mark"'));

describe("report labels after a public search that ran and failed", () => {
  it("KO: the cover, summary and section 03 say the search found no usable source", () => {
    const html = report("ko", "unavailable");
    expect(cover(html)).toContain("검색 없이 본 초안 · 현재 공개 자료로 확인되지 않았습니다.");
    expect(html).toContain("확인 가능한 출처를 찾지 못했습니다. 지금 판단은 답한 내용만으로 계산했습니다.");
    expect(html).toContain("이번 검색에서는 쓸 수 있는 공개 자료를 찾지 못했습니다");
    expect(html).not.toContain("공개 자료 확인 전");
    expect(html).not.toContain("아직 공개 자료를 찾지 않았습니다");
    expect(html).not.toContain("공개 자료를 아직 확인하지 않았습니다");
  });
  it("EN: the cover, summary and section 03 say the search found no usable source", () => {
    const html = report("en", "unavailable");
    expect(cover(html)).toContain("Draft without public search · Current public sources have not been confirmed.");
    expect(html).toContain("No evidence with a usable source was found. This reading uses your answers only.");
    expect(html).toContain("This search found no public sources we could use");
    expect(html).not.toContain("public sources not yet checked");
    expect(html).not.toContain("Public sources have not been searched yet");
    expect(html).not.toContain("Public sources not yet checked");
  });
  it("keeps the explicit draft (no search run) labels unchanged", () => {
    const ko = report("ko", "not_checked");
    expect(cover(ko)).toContain("검색 없이 본 초안 · 공개 자료 확인 전");
    expect(ko).toContain("아직 공개 자료를 찾지 않았습니다. 지금 판단은 답한 내용만으로 계산했습니다.");
    expect(ko).toContain("공개 자료를 아직 확인하지 않았습니다");
    expect(ko).not.toContain("이번 검색에서는 쓸 수 있는 공개 자료를 찾지 못했습니다");
    const en = report("en", "not_checked");
    expect(cover(en)).toContain("Draft without public search · public sources not yet checked");
    expect(en).toContain("Public sources have not been searched yet. This reading uses your answers only.");
    expect(en).toContain("Public sources not yet checked");
    expect(en).not.toContain("This search found no public sources we could use");
  });
});

describe("impact markers in 'If conditions change'", () => {
  it("render the full label for every marker in both languages", () => {
    for (const [language, labels] of [["ko", ["판단", "안전", "경로", "확인"]], ["en", ["Reading", "Safety", "Path", "Check"]]] as const) {
      const state = initialV2State(language);
      const input = buildV2Input(state), core = buildProductApplicationV3(input);
      const html = renderToStaticMarkup(
        <V2SensitivityMatrix rows={buildV2Sensitivity(input, core)} variables={["financialRoom"]} language={language} />
      );
      for (const label of labels) expect(html).toContain(`>${label}</abbr>`);
    }
  });
  it("size to their text instead of a fixed 16px box, without mid-word breaks", () => {
    const marker = rule(css("v2.css"), ".v2-matrix-impacts abbr");
    expect(marker).not.toMatch(/(^|\s)width: 16px/);
    expect(marker).not.toMatch(/(^|\s)height: 16px/);
    expect(marker).toContain("min-width: 16px");
    expect(marker).toContain("white-space: nowrap");
    expect(marker).toContain("overflow-wrap: normal");
    expect(marker).toContain("word-break: keep-all");
  });
});

describe("printed report flow", () => {
  it("does not force every section onto a new page", () => {
    expect(rule(printFlow(), ".v2-analysis-report .v2-paper-page")).toContain("break-after: auto");
  });
  it("keeps section titles, card headings and small units together", () => {
    const flow = printFlow();
    const avoidAfter = flow.slice(0, flow.indexOf("break-after: avoid"));
    for (const selector of [".v2-paper-page > header", ".v2-paper-body > h2", ".v2-reasoning-source > strong", ".v2-matrix-legend"])
      expect(avoidAfter).toContain(selector);
    const avoidInside = flow.slice(flow.indexOf(".v2-analysis-report .v2-reasoning-source,"));
    for (const selector of [".v2-source-references li", ".v2-relationship-map", ".v2-reasoning-source", ".v2-matrix-row"])
      expect(avoidInside.slice(0, avoidInside.indexOf("break-inside: avoid"))).toContain(selector);
  });
  it("lets tall reasoning cards and boards continue instead of jumping a page, stacked in one column", () => {
    const flow = printFlow();
    const continueRule = flow.slice(flow.indexOf("Taller than what is left of a page"));
    expect(continueRule.slice(0, continueRule.indexOf("break-inside: auto"))).toContain(".v2-reasoning article");
    const stacked = flow.slice(flow.indexOf("Stack them."));
    expect(stacked.slice(0, stacked.indexOf("display: block"))).toContain(".v2-insight-grid");
  });
});
