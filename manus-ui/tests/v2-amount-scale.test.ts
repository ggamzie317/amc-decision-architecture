import { describe, expect, it } from "vitest";
import { v2AmountPattern } from "../client/src/data/v2Amounts";
import { v2AmountKeywords } from "../client/src/components/V2ExecutiveBrief";

// Regression (release Preview 2026-10-16): the EN key figure showed "KRW 22.2"
// for a card that said "KRW 22.2 million per semester".

const hit = (s: string) => s.match(v2AmountPattern)?.[0] ?? null;

describe("English scale words stay part of the amount", () => {
  it.each([
    ["2026 tuition is KRW 22.2 million per semester", "KRW 22.2 million"],
    ["US$1.2 billion market", "US$1.2 billion"],
    ["22.2 million KRW", "22.2 million KRW"],
    ["3 million won", "3 million won"],
    ["$80k salary", "$80k"],
    ["USD 5,000 per month", "USD 5,000"],
    ["KRW 1,234,000 admission fee", "KRW 1,234,000"],
  ])("%s → %s", (text, amount) => {
    expect(hit(text)).toBe(amount);
  });

  it("does not take a longer word that only starts like a scale word", () => {
    expect(hit("KRW 22.2 millionaire")).toBe("KRW 22.2");
  });

  it("the EN key figure keeps the scale word", () => {
    const blocks = [
      {
        area: "opportunityCost",
        dimension: "Cost / opportunity cost",
        headline: "2026 tuition is KRW 22.2 million per semester, plus a separate entry fee",
        fact: "The FAQ lists KRW 22.2 million per semester for 2026.",
        whyItMatters: "",
        direction: "caution",
        sourceLabel: "Executive MBA FAQ",
        sourceUrl: "https://example.org/faq",
        provenance: "EXTERNAL_EVIDENCE",
      },
    ] as unknown as Parameters<typeof v2AmountKeywords>[0];
    expect(v2AmountKeywords(blocks, "en")[0].amount).toBe("KRW 22.2 million");
  });
});
