import { describe, expect, it } from "vitest";
import { v2PostureCoverageNote } from "../client/src/data/v2PostureCoverage";
import type { ProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";

// "The 1 unconfirmed inputs were treated…" was seen on the release Preview (2026-10-16).
const core = (unknown: number, fifwmKnown: number) => {
  const postureBasis = Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [`s${i}`, { band: i < unknown ? "unknown" : "developing" }])
  );
  const fifwm = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`f${i}`, { score: i < fifwmKnown ? 1 : null }]));
  return {
    postureBasis,
    postureEvidenceCoverage: "partial",
    decisionStructure: { fifwm, fifwmSource: "case-adapted" },
  } as unknown as ProductApplicationV3;
};

describe("posture coverage note agrees in number (EN)", () => {
  it("one unconfirmed input", () => {
    const text = v2PostureCoverageNote(core(1, 0), "en").text;
    expect(text).toContain("The 1 unconfirmed input was treated as a middle value, so the reading may change once it is confirmed.");
    expect(text).not.toContain("1 unconfirmed inputs");
  });
  it("several unconfirmed inputs", () => {
    expect(v2PostureCoverageNote(core(2, 0), "en").text).toContain("The 2 unconfirmed inputs were treated as middle values");
  });
  it("one lens vs several lenses", () => {
    expect(v2PostureCoverageNote(core(0, 1), "en").text).toContain("1 of the five lenses uses your answers");
    expect(v2PostureCoverageNote(core(0, 3), "en").text).toContain("3 of the five lenses use your answers");
  });
  it("Korean is unchanged", () => {
    expect(v2PostureCoverageNote(core(1, 0), "ko").text).toContain("확인되지 않은 1개는 중간값으로 가정했습니다.");
  });
});
