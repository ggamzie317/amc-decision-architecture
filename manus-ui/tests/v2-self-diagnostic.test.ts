import { describe, expect, it } from "vitest";
import { caseTypes } from "../shared/interactivePrivacy";
import { buildV2Input, initialV2State } from "../client/src/data/amcV2Model";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import {
  initialSelfChecks,
  selfCheckCards,
  selfCheckComplete,
} from "../client/src/data/v2SelfDiagnostic";
import { buildV2EvidenceRequest } from "../client/src/data/v2ExternalEvidenceClient";

describe("V2 case-specific self-diagnostic", () => {
  it("has five contextual cards for every existing case, with six distinct structural selections", () => {
    const questions = new Set<string>();
    for (const caseType of caseTypes) {
      const ko = selfCheckCards(caseType, "ko");
      const en = selfCheckCards(caseType, "en");
      expect(ko).toHaveLength(5);
      expect(en.map(card => card.id)).toEqual(ko.map(card => card.id));
      expect(ko.flatMap(card => card.bands).sort()).toEqual([
        "constraintLoad", "downsideExposure", "financialRoom", "internalReadiness", "optionBSupport", "reversibility",
      ]);
      expect(ko.every(card => !card.question.includes("을(를)"))).toBe(true);
      questions.add(ko[0].question);
    }
    expect(questions.size).toBe(caseTypes.length);
    expect(selfCheckCards("Entrepreneurship", "ko")[0].question).toContain("지불 반응");
    expect(selfCheckCards("Industry Transition", "ko")[0].question).toContain("채용");
    expect(selfCheckCards("MBA / EMBA / PhD Decision", "ko")[0].question).toContain("지원 요건");
    expect(selfCheckCards("Overseas Relocation", "ko")[0].question).toContain("취업·이동");
  });

  it("counts explicit unknown and unverified answers as input only, never as checked proof or a band", () => {
    const state = initialV2State("ko");
    const cards = selfCheckCards("Entrepreneurship", "ko");
    const checks = initialSelfChecks();
    expect(cards.filter(card => selfCheckComplete(card, checks, state.bandSelections))).toHaveLength(0);
    checks.public.status = "notChecked";
    expect(selfCheckComplete(cards[0], checks, state.bandSelections)).toBe(true);
    checks.financial.status = "unsure";
    state.bandSelections.financialRoom = true;
    expect(selfCheckComplete(cards[2], checks, state.bandSelections)).toBe(false);
    state.bandSelections.downsideExposure = true;
    expect(selfCheckComplete(cards[2], checks, state.bandSelections)).toBe(true);
    checks.readiness.status = "checked";
    state.bandSelections.internalReadiness = true;
    expect(selfCheckComplete(cards[1], checks, state.bandSelections)).toBe(false);
    checks.readiness.detail = "시험한 결과물";
    expect(selfCheckComplete(cards[1], checks, state.bandSelections)).toBe(true);
    expect(state.bands.internalReadiness).toBe("unknown");
    const input = buildV2Input(state);
    expect(input.structuralSignals.internalReadiness.band).toBe("unknown");
    expect(input.structuralSignals.externalValidation.band).toBe("unknown");
    expect(input.fifwmSource).toBe("unavailable");
    expect(Object.values(input.fifwm).every(factor => factor.score === null)).toBe(true);
  });

  it("keeps session-only notes outside the provider request and leaves the existing core unchanged", () => {
    const state = initialV2State("en");
    state.caseType = "Entrepreneurship";
    state.decision = "Business launch";
    state.publicSearchTarget = "Public category";
    const before = buildProductApplicationV3(buildV2Input(state));
    const request = buildV2EvidenceRequest(state);
    const checks = initialSelfChecks();
    checks.public = { status: "checked", detail: "PRIVATE CHECK CONTENT" };
    checks.recovery = { status: "notChecked", detail: "" };
    const after = buildProductApplicationV3(buildV2Input(state));
    expect(after).toEqual(before);
    expect(JSON.stringify(request)).not.toContain("PRIVATE CHECK CONTENT");
    expect(JSON.stringify(request)).not.toContain("financialRoom");
    expect(JSON.stringify(request)).not.toContain("internalReadiness");
  });
});
