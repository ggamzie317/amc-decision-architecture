import { describe, expect, it, vi } from "vitest";
import { parseV2EvidenceRequest } from "../shared/externalIntelligenceV2Request";
import { v2EvidenceLimits as limit, v2TextLength } from "../shared/externalIntelligenceV2Contract";
import { acceptV2Evidence } from "../client/src/data/v2ExternalEvidenceClient";
import {
  inspectV2AgentResponse,
  resolveV2ExternalIntelligence,
} from "../server/externalIntelligenceV2Service";

const request = parseV2EvidenceRequest({
  caseType: "Entrepreneurship",
  externalAreas: ["customerDemand"],
  targetGeography: "United States",
  targetLabel: "Education consulting",
  language: "en",
})!;
const sourceUrl = "https://example.org/original";
const content = () => ({
  evidenceBlocks: [{
    dimension: "Customer demand",
    headline: "A bounded public fact",
    direction: "mixed",
    fact: "The source describes one program, not repeated purchases.",
    whyItMatters: "This does not establish this service's paid demand.",
    sourceUrl,
  }],
  opportunitySignals: [],
  frictionSignals: [],
  uncertainties: ["Repeat purchases remain unverified."],
  implication: "Check customer payment separately.",
});
const envelope = (value: unknown = content()) => ({
  object: "response",
  status: "completed",
  error: null,
  output: [
    { type: "search_results", results: [{ url: sourceUrl, title: "Original source", date: "2026-10-10" }] },
    { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(value) }] },
  ],
});
const diagnostic = (raw: unknown) => inspectV2AgentResponse(raw, request).diagnostic;

describe("V2 provider diagnostics without retaining provider text", () => {
  it("accepts one source and the exact Unicode code-point boundary", () => {
    const value = content();
    value.evidenceBlocks[0].headline = "a".repeat(limit.headline - 1) + "😀";
    expect(value.evidenceBlocks[0].headline.length).toBe(limit.headline + 1);
    expect(v2TextLength(value.evidenceBlocks[0].headline)).toBe(limit.headline);
    const inspected = inspectV2AgentResponse(envelope(value), request);
    expect(inspected.diagnostic).toBeUndefined();
    expect(inspected.value?.evidenceBlocks).toHaveLength(1);
    expect(acceptV2Evidence(inspected.value, request)?.status).toBe("live");
    value.evidenceBlocks[0].headline += "a";
    expect(diagnostic(envelope(value))).toEqual({
      category: "limit_exceeded", field: "headline", actualLength: limit.headline + 1,
    });
    expect(acceptV2Evidence({
      ...inspected.value,
      evidenceBlocks: [{ ...inspected.value!.evidenceBlocks[0], headline: value.evidenceBlocks[0].headline }],
    }, request)).toBeNull();
  });

  it.each([
    ["fact", limit.fact],
    ["whyItMatters", limit.whyItMatters],
    ["sourceUrl", limit.sourceUrl],
  ] as const)("classifies %s length over the shared contract", (field, max) => {
    const value = content();
    value.evidenceBlocks[0][field] = "x".repeat(max + 1);
    expect(diagnostic(envelope(value))).toEqual({
      category: "limit_exceeded", field, actualLength: max + 1,
    });
  });

  it("separates terminal, JSON, assistant, citation, field, and array failures", () => {
    expect(diagnostic({ ...envelope(), status: "failed", error: { message: "PRIVATE" } })).toMatchObject({ category: "terminal_status", terminalStatus: "failed" });
    expect(diagnostic({ ...envelope(), status: "cancelled" })).toMatchObject({ category: "terminal_status", terminalStatus: "cancelled" });
    expect(diagnostic({ ...envelope(), status: "incomplete", incomplete_details: { reason: "max_output_tokens" } })).toMatchObject({ category: "terminal_status", terminalStatus: "incomplete", incompleteReason: "max_output_tokens" });
    expect(diagnostic({ ...envelope(), output: null })).toMatchObject({ category: "response_shape", field: "output" });
    expect(diagnostic({ ...envelope(), output: [] })).toMatchObject({ category: "assistant_output_missing" });
    const invalidJson = envelope();
    invalidJson.output[1] = { ...invalidJson.output[1], content: [{ type: "output_text", text: "PRIVATE not JSON" }] } as never;
    expect(diagnostic(invalidJson)).toMatchObject({ category: "response_json", field: "content" });

    const missing = content();
    delete (missing.evidenceBlocks[0] as Record<string, unknown>).fact;
    expect(diagnostic(envelope(missing))).toMatchObject({ category: "invalid_field", field: "fact" });
    const dimension = content();
    dimension.evidenceBlocks[0].dimension = "Unrelated dimension";
    expect(diagnostic(envelope(dimension))).toMatchObject({ category: "invalid_field", field: "dimension" });
    const invented = content();
    invented.evidenceBlocks[0].sourceUrl = "https://example.org/not-in-search-results";
    expect(diagnostic(envelope(invented))).toMatchObject({ category: "citation_mismatch", field: "sourceUrl" });
    const duplicate = content();
    duplicate.evidenceBlocks.push({ ...duplicate.evidenceBlocks[0], headline: "A second claim" });
    expect(diagnostic(envelope(duplicate))).toMatchObject({ category: "duplicate_citation", field: "sourceUrl" });
    const tooMany = content();
    tooMany.uncertainties = Array.from({ length: limit.uncertainties + 1 }, () => "Uncertain");
    expect(diagnostic(envelope(tooMany))).toEqual({ category: "limit_exceeded", field: "uncertainties", actualCount: limit.uncertainties + 1 });
    const longSignal = content();
    longSignal.uncertainties = ["x".repeat(limit.signal + 1)];
    expect(diagnostic(envelope(longSignal))).toEqual({ category: "limit_exceeded", field: "uncertainties", actualLength: limit.signal + 1 });
    const longImplication = content();
    longImplication.implication = "x".repeat(limit.implication + 1);
    expect(diagnostic(envelope(longImplication))).toEqual({ category: "limit_exceeded", field: "implication", actualLength: limit.implication + 1 });
  });

  it("treats no cards as unavailable and never retains dependent summaries", () => {
    const empty = content();
    empty.evidenceBlocks = [];
    const result = inspectV2AgentResponse(envelope(empty), request);
    expect(result.diagnostic).toMatchObject({ category: "no_evidence", actualCount: 0, eligibleSearchUrlCount: 1 });
    expect(result.value).toMatchObject({ status: "unavailable", evidenceBlocks: [], opportunitySignals: [], implication: "Current external evidence is not verified." });
  });

  it("records only fixed diagnostic labels and numeric upstream status", async () => {
    const observe = vi.fn();
    await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async () => Response.json({ ...envelope(), status: "incomplete", incomplete_details: { reason: "max_output_tokens" } })) as typeof fetch,
      observe,
    });
    expect(observe).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: "invalid_provider_response",
      upstreamHttpStatus: 200,
      responseDiagnostic: { category: "terminal_status", field: "status", terminalStatus: "incomplete", incompleteReason: "max_output_tokens" },
    }));
    expect(JSON.stringify(observe.mock.calls)).not.toMatch(/synthetic-key|PRIVATE|example\.org/);

    const failed = vi.fn();
    await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async () => new Response("PRIVATE provider error", { status: 429 })) as typeof fetch,
      observe: failed,
    });
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: "provider_failure", upstreamHttpStatus: 429,
      responseDiagnostic: { category: "upstream_http" },
    }));
    expect(JSON.stringify(failed.mock.calls)).not.toContain("PRIVATE provider error");

    const malformed = vi.fn();
    await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async () => new Response("PRIVATE non-JSON", { status: 200 })) as typeof fetch,
      observe: malformed,
    });
    expect(malformed).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: "invalid_provider_response", upstreamHttpStatus: 200,
      responseDiagnostic: { category: "response_json" },
    }));
    expect(JSON.stringify(malformed.mock.calls)).not.toContain("PRIVATE non-JSON");

    const blocked = vi.fn();
    await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async () => Response.json(envelope())) as typeof fetch,
      sourceAvailable: async () => false,
      observe: blocked,
    });
    expect(blocked).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: "source_unavailable", upstreamHttpStatus: 200,
      responseDiagnostic: { category: "source_probe_failure", actualCount: 1, candidateCount: 1, acceptedCount: 0, excludedCount: 1 },
    }));
  });

  it("keeps only independently cited accessible cards and drops dependent provider summaries", async () => {
    const blockedUrl = "https://example.org/blocked";
    const value = content();
    value.evidenceBlocks.push({ ...value.evidenceBlocks[0],
      headline: "Blocked claim", fact: "PRIVATE BLOCKED CLAIM",
      whyItMatters: "PRIVATE BLOCKED MEANING", sourceUrl: blockedUrl });
    value.opportunitySignals = ["PRIVATE COMBINED OPPORTUNITY"];
    value.frictionSignals = ["PRIVATE COMBINED FRICTION"];
    value.implication = "PRIVATE COMBINED IMPLICATION";
    const raw = envelope(value);
    raw.output[0] = { type: "search_results", results: [
      { url: sourceUrl, title: "Original source", date: "2026-10-10" },
      { url: blockedUrl, title: "Blocked source", date: "2026-10-09" },
    ] } as never;
    const observe = vi.fn();
    const result = await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async () => Response.json(raw)) as typeof fetch,
      sourceAvailable: async url => url === sourceUrl,
      observe,
    });
    expect(result).toMatchObject({ status: "live", sourceCoverage: "partial" });
    expect(result.evidenceBlocks.map(block => block.sourceUrl)).toEqual([sourceUrl]);
    expect(result.opportunitySignals).toEqual([]);
    expect(result.frictionSignals).toEqual([]);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE/);
    expect(acceptV2Evidence(result, request)?.evidenceBlocks).toHaveLength(1);
    expect(observe).toHaveBeenCalledWith(expect.objectContaining({
      reasonCode: "live",
      responseDiagnostic: { category: "source_probe_failure", actualCount: 1,
        candidateCount: 2, acceptedCount: 1, excludedCount: 1 },
    }));
    expect(JSON.stringify(observe.mock.calls)).not.toMatch(/example\.org|PRIVATE|synthetic-key/);

    const allBlocked = await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async () => Response.json(raw)) as typeof fetch,
      sourceAvailable: async () => false,
      observe: () => {},
    });
    expect(allBlocked).toMatchObject({ status: "unavailable", evidenceBlocks: [], opportunitySignals: [] });
  });

  it("uses the same string and array limits in the Agent request contract", async () => {
    let sent: Record<string, any> = {};
    await resolveV2ExternalIntelligence(request, {
      apiKey: "synthetic-key",
      fetchImpl: (async (_url, init) => {
        sent = JSON.parse(String(init?.body));
        return Response.json(envelope());
      }) as typeof fetch,
      sourceAvailable: async () => true,
      observe: () => {},
    });
    const properties = sent.response_format.json_schema.schema.properties;
    const block = properties.evidenceBlocks.items.properties;
    expect(sent.response_format.json_schema.name).toBe("AmcV2ExternalEvidence");
    expect(sent.response_format.json_schema.strict).toBeUndefined();
    expect(sent.tools).toEqual([{ type: "web_search" }]);
    for (const field of ["headline", "fact", "whyItMatters", "sourceUrl"] as const)
      expect(block[field].maxLength).toBe(limit[field]);
    expect(properties.evidenceBlocks.maxItems).toBe(limit.blocks);
    for (const field of ["opportunitySignals", "frictionSignals", "uncertainties"] as const) {
      expect(properties[field].maxItems).toBe(limit[field]);
      expect(properties[field].items.maxLength).toBe(limit.signal);
    }
    expect(properties.implication.maxLength).toBe(limit.implication);
    expect(sent.input[0].content).toContain("Do not truncate a claim");
  });
});
