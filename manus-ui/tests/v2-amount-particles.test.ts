import { describe, expect, it } from "vitest";
import { v2AmountPattern, v2HasAmount } from "../client/src/data/v2Amounts";
import { v2AmountKeywords } from "../client/src/components/V2ExecutiveBrief";

// Regression (Preview runs 2026-10-16): the provider wrote "2,220만 원입니다" and
// "2,220만 원이며"; the old guard refused any Korean letter after 원, so the key
// figure card showed "금액 자료 없음" although the cost card held the amount.

const hit = (s: string) => s.match(v2AmountPattern)?.[0] ?? null;

describe("amounts followed by a Korean particle", () => {
  it.each([
    ["학기당 2,220만 원이며", "2,220만 원"],
    ["공개된 등록금은 학기당 2,220만 원입니다", "2,220만 원"],
    ["2,220만 원을 기준으로", "2,220만 원"],
    ["1,234,000원이고", "1,234,000원"],
    ["5,000엔으로", "5,000엔"],
    ["500달러를 냅니다", "500달러"],
    ["300유로가 듭니다", "300유로"],
    ["100만 원대 노트북", "100만 원"],
    ["학기당 등록금 2,220만원", "2,220만원"],
    ["연간 임금 중앙값: 1억 2,000만 원", "1억 2,000만 원"],
  ])("%s → %s", (text, amount) => {
    expect(hit(text)).toBe(amount);
  });

  it.each(["2025 원격근무 비율", "2025 엔지니어 채용", "2025 원가 절감", "300 원로 회의", "2026 원도심", "2025 원대한 계획"])(
    "does not read a word starting with the unit as an amount: %s",
    text => {
      expect(v2HasAmount(text)).toBe(false);
    }
  );

  it("the key figure picks up the amount from a card written with a particle", () => {
    const blocks = [
      {
        area: "opportunityCost",
        dimension: "Cost / opportunity cost",
        headline: "공개된 등록금은 학기당 2,220만 원입니다",
        fact: "FAQ는 2026학년도 학기당 등록금을 2,220만 원이며 입학금은 별도라고 안내합니다.",
        whyItMatters: "",
        direction: "caution",
        sourceLabel: "Executive MBA FAQ",
        sourceUrl: "https://example.org/faq",
        provenance: "EXTERNAL_EVIDENCE",
      },
    ] as unknown as Parameters<typeof v2AmountKeywords>[0];
    expect(v2AmountKeywords(blocks, "ko")).toEqual([
      { amount: "2,220만 원", label: "공개된 등록금은 학기당 2,220만 원입니다" },
    ]);
  });
});
