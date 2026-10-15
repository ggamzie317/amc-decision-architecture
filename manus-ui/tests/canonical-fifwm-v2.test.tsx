import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import rules from "../client/src/data/generated/fifwm-rules.json";
import { buildV2CanonicalFifwm, type CanonicalFifwmAssessment } from "../client/src/data/v2CanonicalFifwm";
import { buildV2Input, buildV2Sensitivity, v2Scenario } from "../client/src/data/amcV2Model";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { baselineBands } from "../client/src/data/amcScenario";
import { selectV2SimulatorVariables } from "../client/src/data/amcV2SensitivityView";
import { buildV2EvidenceRequest } from "../client/src/data/v2ExternalEvidenceClient";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";

(globalThis as any).React = React;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const generator = resolve(root, "manus-ui/scripts/generate_fifwm_rules.py");
const known = (answers: Record<string, string | null>): CanonicalFifwmAssessment => ({
  targetRoleStatus: "known", answers,
});

describe("canonical Python FIFWM in the private browser intake", () => {
  it("has an artifact current with all three original Python source files", () => {
    execFileSync("python3", [generator, "--check"], { cwd: root });
    expect(rules.fields.flatMap(field => Object.keys(field.choices))).toHaveLength(15);
  });

  it("matches Python on every valid choice and all 243 five-question combinations", () => {
    const script = `import itertools,json,sys,typing\nsys.path.insert(0,'src')\nimport engine\nfuncs=[getattr(engine,'map_q'+str(n)) for n in range(18,23)]\nchoices=[typing.get_args(next(iter(typing.get_type_hints(fn).values()))) for fn in funcs]\nprint(json.dumps([{'values':v,'scores':[fn(x) for fn,x in zip(funcs,v)]} for v in itertools.product(*choices)]))`;
    const rows = JSON.parse(execFileSync("python3", ["-c", script], { cwd: root, encoding: "utf8" })) as Array<{
      values: string[]; scores: number[];
    }>;
    expect(rows).toHaveLength(243);
    for (const row of rows) {
      const answers = Object.fromEntries(rules.fields.map((field, index) => [field.field, row.values[index]]));
      const result = buildV2CanonicalFifwm("Role Upgrade / Downgrade", "en", known(answers));
      expect(result.fifwmSource).toBe("canonical-current-case");
      expect(rules.fields.map(field => result.fifwm[field.factor as keyof typeof result.fifwm].score)).toEqual(row.scores);
    }
  });

  it("never turns missing, null, unsure, inapplicable or invalid values into a zero score", () => {
    for (const value of [undefined, null, "__unknown__", "__na__", "major_change", "0"] as const) {
      const result = buildV2CanonicalFifwm("Industry Transition", "ko", known({ q18_change: value }));
      expect(result.fifwmSource).toBe("unavailable");
      expect(Object.values(result.fifwm).every(factor => factor.score === null)).toBe(true);
    }
    const partial = buildV2CanonicalFifwm("Industry Transition", "ko", known({
      q18_change: "major_changes", q19_sponsor: "__unknown__",
    }));
    expect(partial.fifwm.framework.score).toBe(0);
    expect(partial.fifwm.informal.score).toBeNull();
    expect(buildV2CanonicalFifwm("Entrepreneurship", "ko", known({ q18_change: "no_changes" })).fifwmSource).toBe("unavailable");
    expect(buildV2CanonicalFifwm("Industry Transition", "ko", { targetRoleStatus: "unsure", answers: { q18_change: "no_changes" } }).fifwmSource).toBe("unavailable");
  });

  it("connects selected source values through input, core, dashboard, report and unchanged scenario rules", () => {
    const fixture = v2DemoFixture("industry", "ko");
    const assessment = known({
      q18_change: "major_changes", q19_sponsor: "none", q20_clarity: "not_clear",
      q21_workflow: "very_slow_or_chaotic", q22_exposure: "high_exposure",
    });
    const requestBefore = buildV2EvidenceRequest(fixture.state);
    const input = buildV2Input(fixture.state, fixture.intelligence, assessment);
    const core = buildProductApplicationV3(input);
    expect(input.fifwmSource).toBe("canonical-current-case");
    expect(Object.values(core.decisionStructure.fifwm).map(factor => factor.score)).toEqual([0, 0, 0, 0, 0]);
    expect(buildV2EvidenceRequest(fixture.state)).toEqual(requestBefore);
    const sensitivity = buildV2Sensitivity(input, core);
    const visibleVariables = selectV2SimulatorVariables(sensitivity, baselineBands(input));
    const dashboard = renderToStaticMarkup(React.createElement(V2Dashboard, {
      state: fixture.state, core, intelligence: fixture.intelligence, evidencePhase: "demo", onReport: () => {},
    }));
    const report = renderToStaticMarkup(React.createElement(V2Report, {
      state: fixture.state, input, core, sensitivity, visibleVariables,
      intelligence: fixture.intelligence, evidencePhase: "demo", onClose: () => {}, onPrint: () => {},
    }));
    for (const html of [dashboard, report]) {
      expect(html).toContain(html === dashboard ? "목표 쪽 조직·직무 여건" : "갈 수 있는 경로와 목표 쪽 여건");
      for (const name of ["기회의 조건", "연결 가능성", "구조 적합성", "실행 현실성", "버틸 수 있는가"]) {
        expect(html).toContain(name);
      }
      expect(html).toContain("이번 평가 질문: 조직 개편·리더십 변화");
      expect(html).toContain("조직 개편·리더십 변화");
      expect(html).toContain("큰 변화가 여러 차례 있었음");
      expect(html).toContain("고객 자기보고(외부 검증 전)");
    }
    const english = buildProductApplicationV3(buildV2Input(v2DemoFixture("industry", "en").state));
    const englishHtml = renderToStaticMarkup(React.createElement(V2Dashboard, {
      state: v2DemoFixture("industry", "en").state,
      core: english,
      intelligence: v2DemoFixture("industry", "en").intelligence,
      evidencePhase: "demo",
      onReport: () => {},
    }));
    for (const name of ["Opportunity conditions", "Connection potential", "Structural fit", "Execution reality", "Can this endure?"]) {
      expect(englishHtml).toContain(name);
    }
    const changed = v2Scenario(input, { financialRoom: "strong" }).result;
    expect(changed.decisionStructure.fifwm).toEqual(core.decisionStructure.fifwm);
    expect(v2Scenario(input, {}).result).toEqual(core);
  });
});
