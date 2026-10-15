import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AMC_ANALYSIS_SEQUENCE, buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { buildV2Analysis } from "../client/src/data/amcV2Analysis";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { buildV2Input, buildV2Sensitivity } from "../client/src/data/amcV2Model";
import { buildV2TraceSnapshot } from "../client/src/trace/traceSnapshot";
import { v2TraceStages } from "../client/src/trace/traceSchema";
import V2DecisionTrace from "../client/src/trace/V2DecisionTrace";
(globalThis as any).React = React;

function source(language: "ko" | "en") {
  const fixture = v2DemoFixture("industry", language);
  const input = buildV2Input(fixture.state, fixture.intelligence);
  const core = buildProductApplicationV3(input);
  const analysis = buildV2Analysis(fixture.state, core, fixture.intelligence, "demo");
  return { state: fixture.state, input, core, analysis, intelligence: fixture.intelligence, sensitivity: buildV2Sensitivity(input, core) };
}
const at = (value: unknown, path: string) => path.split(".").reduce<any>((v, k) => (v == null ? undefined : v[k]), value);

describe("decision trace (read-only, schema-driven)", () => {
  it("follows the official analysis sequence exactly", () => {
    expect(v2TraceStages.map(stage => stage.id)).toEqual([...AMC_ANALYSIS_SEQUENCE]);
  });

  it("only reads fields that exist in a real snapshot", () => {
    const snapshot = buildV2TraceSnapshot(source("ko"));
    for (const stage of v2TraceStages) for (const path of stage.reads)
      expect(at(snapshot, path), `${stage.id} reads ${path}`).not.toBeUndefined();
  });

  it("freezes its own copy and never touches the page's objects", () => {
    const original = source("ko");
    const before = JSON.stringify(original);
    const snapshot = buildV2TraceSnapshot(original);
    expect(Object.isFrozen(snapshot.core)).toBe(true);
    expect(Object.isFrozen(snapshot.core.postureBasis)).toBe(true);
    expect(Object.isFrozen(original.core)).toBe(false);
    for (const stage of v2TraceStages) { stage.conclusion(snapshot); stage.reasons(snapshot); }
    expect(JSON.stringify(original)).toBe(before);
  });

  it("shows the same conclusion as the dashboard analysis", () => {
    const original = source("ko");
    const snapshot = buildV2TraceSnapshot(original);
    const posture = v2TraceStages.find(stage => stage.id === "Current Structural Posture")!;
    expect(posture.conclusion(snapshot)).toBe(original.analysis.posture);
  });

  it("tags every reason with a known source and renders all nine steps in both languages", () => {
    for (const language of ["ko", "en"] as const) {
      const snapshot = buildV2TraceSnapshot(source(language));
      for (const stage of v2TraceStages)
        for (const reason of stage.reasons(snapshot)) expect(["you", "public", "engine", "open"]).toContain(reason.source);
      const html = renderToStaticMarkup(<V2DecisionTrace snapshot={snapshot} />);
      expect((html.match(/class="v2-trace-stage"/g) ?? []).length).toBe(9);
      const text = html.replace(/<[^>]+>/g, " ");
      expect(text).not.toMatch(/\d+\s?%/);
      expect(text).not.toMatch(/undefined|NaN|\[object/);
      if (language === "ko") expect(text).not.toMatch(/시험|노출|몰입|기준선|대조|자기보고|여력|형성 중|제약됨/);
      if (language === "en") expect(text.replace(/\(as entered: [^)]*\)/g, "")).not.toMatch(/[가-힣]{2,}/);
    }
  });
});

describe("decision trace personal layer", () => {
  it("keys notes per decision when there is no record ID, without storing the text in the key", async () => {
    const { v2TraceLocalKey } = await import("../client/src/trace/V2DecisionTrace");
    const a = buildV2TraceSnapshot(source("ko"));
    const other = source("ko");
    const b = buildV2TraceSnapshot({ ...other, state: { ...other.state, optionB: "다른 커리어" } });
    expect(v2TraceLocalKey(a)).not.toBe(v2TraceLocalKey(b));
    expect(v2TraceLocalKey(a)).toMatch(/^local-[0-9a-z]+$/);
  });
});
