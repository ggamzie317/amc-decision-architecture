import { describe, expect, it } from "vitest";
import { resolveV2ExternalIntelligence } from "../server/externalIntelligenceV2Service";
import { mergeV2Evidence } from "../shared/v2EvidenceMerge";
import { v2IsPartialSearch, type V2EvidenceRequest } from "../shared/externalIntelligenceV2Request";
import { v2KeyFactHints } from "../shared/v2KeyFacts";
import { v2SituationalAreas } from "../client/src/data/v2ExternalEvidenceClient";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";

const overseas = (externalAreas: string[], keyFacts?: string[]): V2EvidenceRequest => ({
  caseType: "Overseas Relocation",
  externalAreas,
  targetGeography: "Singapore",
  targetLabel: "real estate analyst",
  language: "en",
  ...(keyFacts ? { keyFacts } : {}),
});

async function providerInput(request: V2EvidenceRequest) {
  const bodies: Array<{ input: Array<{ role: string; content: string }> }> = [];
  await resolveV2ExternalIntelligence(request, {
    apiKey: "test-key",
    retryDelayMs: 0,
    observe: () => {},
    fetchImpl: (async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response("{}", { status: 500 });
    }) as unknown as typeof fetch,
  });
  return bodies;
}

describe("audit M1: per-topic requests are searched as a slice", () => {
  it("marks a single-topic request as split and forbids relabelling", async () => {
    expect(v2IsPartialSearch(overseas(["visaMobility"]))).toBe(true);
    const [body] = await providerInput(overseas(["visaMobility"]));
    const system = body.input[0].content;
    expect(system).toContain("This search covers only these dimensions: Visa / mobility.");
    expect(system).toContain("must be left out, not relabelled");
    expect(system).toContain("(Visa / mobility)");
  });

  it("does not mark the case's full default request as a slice", () => {
    expect(v2IsPartialSearch(overseas([]))).toBe(false);
    expect(v2IsPartialSearch(overseas(["visaMobility", "hiringDemand", "compensation", "geography"]))).toBe(false);
  });
});

describe("audit L3: key-fact hints follow the requested areas", () => {
  const ids = ["offer:interviewing", "route:pr", "family:children", "timing:within6"];
  it("keeps only relevant and global hints", () => {
    const visa = v2KeyFactHints("Overseas Relocation", ids, ["visaMobility"]);
    expect(visa.some(h => /permanent residence/.test(h))).toBe(true);
    expect(visa.some(h => /Timeline within 6 months/.test(h))).toBe(true);
    const pay = v2KeyFactHints("Overseas Relocation", ids, ["compensation"]);
    expect(pay.some(h => /permanent residence/.test(h))).toBe(false);
    expect(pay.some(h => /school fees/.test(h))).toBe(false);
    expect(pay.some(h => /pay benchmarks/.test(h))).toBe(true);
    expect(v2KeyFactHints("Overseas Relocation", ids)).toHaveLength(4);
  });

  it("sends only the relevant hints to the provider", async () => {
    const [body] = await providerInput(overseas(["compensation"], ["route:pr", "offer:interviewing"]));
    const user = JSON.parse(body.input[1].content);
    expect(user.personSituation).toEqual(["The person is applying or interviewing there: focus on hiring demand, pay benchmarks and work-pass thresholds."]);
  });
});

describe("audit M3: every (topic, area) keeps a card under the cap", () => {
  it("does not let one area of a two-area topic vanish", () => {
    const base = v2DemoFixture("industry", "en").intelligence;
    const block = (area: string, i: number) => ({
      area, dimension: area, headline: `${area} ${i}`, direction: "mixed" as const, fact: `Fact ${i}.`, whyItMatters: "Scope.",
      sourceLabel: "Source", sourceUrl: `https://example.org/${area}/${i}`, provenance: "EXTERNAL_EVIDENCE" as const,
    });
    const live = (blocks: ReturnType<typeof block>[]) => ({ ...base, status: "live" as const, sourceCoverage: "complete" as const, contextConfidence: "medium" as const, evidenceBlocks: blocks });
    // Topic 2's second area only appears after six cards of its first area.
    const lives = [
      live(Array.from({ length: 6 }, (_, i) => block("visaMobility", i))),
      live([...Array.from({ length: 6 }, (_, i) => block("hiringDemand", i)), block("compensation", 0)]),
      live(Array.from({ length: 6 }, (_, i) => block("geography", i))),
    ];
    const merged = mergeV2Evidence(lives as never, overseas(["visaMobility", "hiringDemand", "compensation", "geography"]));
    expect(merged.evidenceBlocks).toHaveLength(10);
    for (const area of ["visaMobility", "hiringDemand", "compensation", "geography"])
      expect(merged.evidenceBlocks.some(b => b.area === area)).toBe(true);
    expect(merged.sourceCoverage).toBe("complete");
  });
});

describe("audit M4: mandatory areas survive customer picks", () => {
  it("keeps visa for an overseas move even with five other picks", () => {
    const picks = ["hiringDemand", "roleDemand", "compensation", "requiredSkills", "geography"];
    const areas = v2SituationalAreas({ caseType: "Overseas Relocation", targetGeography: "Singapore", externalAreas: picks as never[] });
    expect(areas.slice(0, 5)).toEqual(picks);
    expect(areas).toContain("visaMobility");
    expect(areas).toHaveLength(6);
  });

  it("keeps mobility for a degree abroad", () => {
    const picks = ["programOutcomes", "employmentRelevance", "researchRelevance", "opportunityCost", "funding"];
    const areas = v2SituationalAreas({ caseType: "MBA / EMBA / PhD Decision", targetGeography: "UK", externalAreas: picks as never[] });
    expect(areas).toContain("geographyMobility");
    const home = v2SituationalAreas({ caseType: "MBA / EMBA / PhD Decision", targetGeography: "서울", externalAreas: picks as never[] });
    expect(home).not.toContain("geographyMobility");
    expect(home).toHaveLength(5);
  });
});
