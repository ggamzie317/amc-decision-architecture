import { describe, it, expect } from "vitest";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { buildV2Input, initialV2State, type V2State } from "../client/src/data/amcV2Model";

// Regression (launch check 2026-10-16): a decision condition the customer put
// under "reasons to stay or wait" was shown as support for moving, because the
// sentence was picked by list position instead of the condition's side.

function state(language: "ko" | "en", switchIds: string[], customCondition = ""): V2State {
  const base = initialV2State(language);
  return {
    ...base,
    caseType: "MBA / EMBA / PhD Decision",
    optionA: language === "ko" ? "중견기업 재무팀 과장" : "Finance manager",
    optionB: language === "ko" ? "고려대학교 EMBA 과정 진학" : "EMBA in Seoul",
    serviceConsent: true,
    switchIds,
    customCondition,
    bands: {
      ...base.bands,
      financialRoom: "developing",
      reversibility: "developing",
      downsideExposure: "moderate",
      internalReadiness: "developing",
      optionBSupport: "developing",
      constraintLoad: "moderate",
    },
  } as V2State;
}

const directions = (s: V2State) =>
  buildProductApplicationV3(buildV2Input(s)).decisionSwitches.map(sw => sw.direction);

const moveKo = "쪽으로 단계적으로 옮겨 가는 데 힘이 실립니다";
const stayKo = "의 기반을 지키며 확인하는 쪽이 더 잘 뒷받침됩니다";
const moveEn = "moving in stages becomes better supported";
const stayEn = "keeping your base in your current role is better supported";

describe("decision switch direction follows the condition's side", () => {
  it("a stay-side condition is not shown as support for moving (KO)", () => {
    const [external, downside] = directions(state("ko", ["external", "downside"]));
    expect(external).toContain(moveKo);
    expect(downside).toContain(stayKo);
    expect(downside).not.toContain(moveKo);
  });

  it("a stay-side condition is not shown as support for moving (EN)", () => {
    const [, downside] = directions(state("en", ["external", "downside"]));
    expect(downside).toContain(stayEn);
    expect(downside).not.toContain(moveEn);
  });

  it("stay-side conditions in the first two positions keep the stay wording", () => {
    for (const d of directions(state("ko", ["downside", "constraints"]))) {
      expect(d).toContain(stayKo);
    }
  });

  it("a move-side condition in the third position keeps the move wording", () => {
    const ds = directions(state("ko", ["external", "financial", "reversibility"]));
    expect(ds).toHaveLength(3);
    for (const d of ds) expect(d).toContain(moveKo);
  });

  it("mixed order: each condition follows its own side (EN)", () => {
    // Candidates keep their fixed order: financial (B), downside (A), constraints (A).
    const ds = directions(state("en", ["constraints", "financial", "downside"]));
    expect(ds[0]).toContain(moveEn);
    expect(ds[1]).toContain(stayEn);
    expect(ds[2]).toContain(stayEn);
  });

  it("a free-text condition has no side and keeps the position-based wording", () => {
    const input = buildV2Input(state("ko", ["downside"], "회사가 학비를 지원하면"));
    expect(input.decisionConditionSides).toEqual(["A", null]);
    const ds = buildProductApplicationV3(input).decisionSwitches.map(sw => sw.direction);
    expect(ds[0]).toContain(stayKo);
    expect(ds[1]).toContain(moveKo);
  });

  it("callers without sides (legacy surfaces) keep the old position-based wording", () => {
    const input = buildV2Input(state("ko", ["external", "financial", "reversibility"]));
    delete input.decisionConditionSides;
    const ds = buildProductApplicationV3(input).decisionSwitches.map(sw => sw.direction);
    expect(ds[0]).toContain(moveKo);
    expect(ds[1]).toContain(moveKo);
    expect(ds[2]).toContain(stayKo);
  });

  it("posture, safety margin and support are unchanged by the sides", () => {
    const withSides = buildV2Input(state("ko", ["external", "downside"]));
    const withoutSides = { ...withSides };
    delete withoutSides.decisionConditionSides;
    const a = buildProductApplicationV3(withSides);
    const b = buildProductApplicationV3(withoutSides);
    expect(a.currentStructuralPosture).toEqual(b.currentStructuralPosture);
    expect(a.safetyMargin).toEqual(b.safetyMargin);
    expect(a.changingPlays).toEqual(b.changingPlays);
  });
});
