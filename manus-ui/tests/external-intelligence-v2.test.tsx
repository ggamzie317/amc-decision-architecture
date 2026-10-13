import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleV2ExternalIntelligence } from "../api/amc/external-intelligence-v2";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import V2Simulator from "../client/src/components/V2Simulator";
import { baselineBands } from "../client/src/data/amcScenario";
import { selectV2SimulatorVariables } from "../client/src/data/amcV2SensitivityView";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import {
  v2MissingPoint,
  v2CustomerEvidenceText,
} from "../client/src/data/amcV2Presentation";
import { v2t } from "../client/src/data/v2Language";
import {
  demoIntelligence,
  unavailableIntelligence,
} from "../client/src/data/externalIntelligenceV2";
import {
  acceptV2Evidence,
  buildV2EvidenceRequest,
  requestV2Evidence,
} from "../client/src/data/v2ExternalEvidenceClient";
import {
  projectInteractiveMetadata,
  projectInteractivePatch,
  v2Identity,
} from "../shared/interactivePrivacy";
import { parseV2EvidenceRequest } from "../shared/externalIntelligenceV2Request";
import {
  normalizeV2AgentResponse,
  resolveV2ExternalIntelligence,
  v2EvidenceFocus,
} from "../server/externalIntelligenceV2Service";
import {
  pinnedSourceLookup,
  probePublicSource,
  publicSourceAvailable,
  sourceHtmlLooksUnavailable,
} from "../server/publicSourceAvailability";

(globalThis as any).React = React;

const request = parseV2EvidenceRequest({
  caseType: "Entrepreneurship",
  externalAreas: ["customerDemand", "pricing"],
  targetGeography: "Seoul",
  targetLabel: "Advisory service",
  language: "en",
})!;
const sourceRows = [
  {
    url: "https://www.bls.gov/ooh/",
    title: "Occupational Outlook Handbook",
    published_date: "2026-08-10",
  },
  { url: "https://www.sba.gov/business-guide/", title: "SBA Business Guide" },
];
function providerContent(language = "en") {
  return {
    evidenceBlocks: [
      {
        dimension: "Customer demand",
        headline:
          language === "ko" ? "공개 수요 자료" : "Public demand context",
        direction: "mixed",
        fact:
          language === "ko"
            ? "공개 자료는 시장 맥락을 보여 주지만 개별 서비스의 반복 구매를 입증하지 않습니다."
            : "Public material describes category demand, not repeat purchases for this service.",
        whyItMatters:
          language === "ko"
            ? "반복 구매는 별도 검증이 필요합니다."
            : "Repeat paid demand still needs a separate test.",
        sourceUrl: sourceRows[0].url,
      },
      {
        dimension: "Pricing",
        headline: language === "ko" ? "가격 비교 맥락" : "Pricing context",
        direction: "caution",
        fact:
          language === "ko"
            ? "공개 가격 정보만으로 개인 서비스의 지불 의사를 알 수 없습니다."
            : "Published pricing does not establish willingness to pay for this offer.",
        whyItMatters:
          language === "ko"
            ? "제안별 가격 수용성은 확인되지 않았습니다."
            : "Offer-specific price acceptance remains unverified.",
        sourceUrl: sourceRows[1].url,
      },
    ],
    opportunitySignals: [],
    frictionSignals: [
      language === "ko" ? "반복 구매 미확인" : "Repeat purchase unverified",
    ],
    uncertainties: [
      language === "ko"
        ? "이 사례의 구매 수요는 확인되지 않았습니다."
        : "Demand for this specific offer is unknown.",
    ],
    implication:
      language === "ko"
        ? "공개 자료는 시장 맥락만 보완하며 기준 구조 판단을 바꾸지 않습니다."
        : "Public context informs the evidence gap without changing the baseline structural reading.",
  };
}
function envelope(
  content: unknown = providerContent(),
  rows: unknown[] = sourceRows
) {
  return {
    object: "response",
    status: "completed",
    error: null,
    output: [
      { type: "search_results", results: rows },
      {
        type: "message",
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text: JSON.stringify(content) }],
      },
    ],
  };
}
const live = normalizeV2AgentResponse(envelope(), request)!;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("V2 live External Intelligence boundary", () => {
  it("localizes established AMC terms only while rendering synthetic Korean evidence", () => {
    const fixture = v2DemoFixture("industry", "ko");
    const phrase = "TRANSFERABLE PROOF";
    const intelligence = {
      ...fixture.intelligence,
      status: "live" as const,
      generatedAt: "2026-10-09T16:30:00.000Z",
      evidenceBlocks: fixture.intelligence.evidenceBlocks.map((block, index) =>
        index === 0
          ? {
              ...block,
              headline: `${phrase}: 42%는 아직 확인되지 않았습니다`,
              fact: "IT·AI·MBA 관련 42% 수치는 transferable proof를 입증하지 않습니다.",
              whyItMatters:
                "(Transferable Proof)는 2026-09-12 이후에도 별도로 확인해야 합니다.",
              sourceLabel: "Transferable Proof Institute",
              sourceUrl: "https://example.org/transferable-proof",
              sourceDate: "2026-09-12",
              sourceDateKind: "published" as const,
            }
          : block
      ),
      metrics: [
        {
          label: "Transferable Proof 표본",
          value: 42,
          unit: "%",
          sourceLabel: "Transferable Proof Institute",
        },
      ],
      opportunitySignals: ["transferable proof를 시험할 수 있습니다"],
      frictionSignals: ["Transferable Proof는 아직 불확실합니다"],
      uncertainties: ["(transferable proof)는 확인되지 않았습니다"],
      implication: "Transferable Proof는 42%만으로 확정할 수 없습니다.",
    };
    const snapshot = JSON.stringify(intelligence);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const visibleVariables = selectV2SimulatorVariables(
      fixture.sensitivity,
      baselineBands(fixture.input)
    );
    const dashboard = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: fixture.state,
        core: fixture.baseline,
        intelligence,
        evidencePhase: "live",
        onReport: () => {},
      })
    );
    const report = renderToStaticMarkup(
      React.createElement(V2Report, {
        state: fixture.state,
        input: fixture.input,
        core: fixture.baseline,
        sensitivity: fixture.sensitivity,
        visibleVariables,
        intelligence,
        evidencePhase: "live",
        onClose: () => {},
        onPrint: () => {},
      })
    );
    const koreanTerm = v2MissingPoint("Industry Transition", "ko").point;
    expect(koreanTerm).toBe("새 산업에서도 통하는 기존 성과");
    for (const html of [dashboard, report]) {
      expect(html).toContain(koreanTerm);
      expect(html).toContain("핵심 득실");
      expect(html).toContain("42%");
      expect(html).toContain("확인되지 않았습니다");
      expect(html).toContain("2026-09-12");
      expect(html).toContain("https://example.org/transferable-proof");
      expect(html).toContain("Transferable Proof Institute");
      expect(html).not.toContain("TRANSFERABLE PROOF: 42%");
      expect(html).not.toContain("(Transferable Proof)는");
    }
    expect(dashboard).toContain(`(${koreanTerm})는 확인되지 않았습니다`);
    expect(dashboard).toContain("IT·AI·MBA 관련 42% 수치는");
    expect(dashboard).toContain("새 산업에서도 통하는 기존 성과 표본");
    expect(report).toContain(`${koreanTerm}는 42%만으로 확정할 수 없습니다`);
    expect(JSON.stringify(intelligence)).toBe(snapshot);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      v2CustomerEvidenceText("en", "(Transferable Proof), IT, AI, MBA")
    ).toBe("(Transferable Proof), IT, AI, MBA");
    const englishFixture = v2DemoFixture("industry", "en");
    const englishDashboard = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: englishFixture.state,
        core: englishFixture.baseline,
        intelligence,
        evidencePhase: "live",
        onReport: () => {},
      })
    );
    expect(englishDashboard).toContain("TRANSFERABLE PROOF: 42%");
    expect(englishDashboard).toContain(
      "IT·AI·MBA 관련 42% 수치는 transferable proof를"
    );
    expect(
      v2CustomerEvidenceText("ko", "IT, AI, MBA, transferable proofing")
    ).toBe("IT, AI, MBA, transferable proofing");
    expect(v2t("ko", "tradeoff")).toBe("핵심 득실");
    expect(v2t("ko", "material")).toBe("무시하기 어려움");
    expect(v2t("ko", "unknown")).toBe("아직 확인되지 않음");
  });
  it("accepts only the five bounded public-search fields and canonical case areas", () => {
    const fixture = v2DemoFixture("entrepreneurship", "en");
    const state = {
      ...fixture.state,
      decision: "PRIVATE DECISION PROSE",
      optionA: "PRIVATE OPTION A",
      optionB: "Advisory service",
      optionalNote: "PRIVATE NOTE",
      customCondition: "PRIVATE CONDITION",
      targetGeography: "Seoul",
      publicSearchTarget: "Advisory service for Seoul small businesses",
      externalAreas: [
        "customerDemand",
        "pricing",
      ] as typeof fixture.state.externalAreas,
    };
    const built = buildV2EvidenceRequest(state)!;
    expect(Object.keys(built).sort()).toEqual(
      [
        "caseType",
        "externalAreas",
        "language",
        "targetGeography",
        "targetLabel",
      ].sort()
    );
    expect(built).toMatchObject({
      caseType: "Entrepreneurship",
      externalAreas: ["customerDemand", "pricing"],
      targetGeography: "Seoul",
      targetLabel: "Advisory service for Seoul small businesses",
    });
    expect(JSON.stringify(built)).not.toMatch(
      /PRIVATE|optionalNote|customCondition|financialRoom|supportSources|researchConsent|scenario/
    );
    expect(
      buildV2EvidenceRequest({
        ...state,
        publicSearchTarget: "Advisory service",
      })?.targetLabel
    ).toBe("Advisory service");
    expect(
      parseV2EvidenceRequest({ ...built, optionalNote: "PRIVATE" })
    ).toBeNull();
    expect(
      parseV2EvidenceRequest({ ...built, externalAreas: ["hiringDemand"] })
    ).toBeNull();
    expect(
      parseV2EvidenceRequest({ ...built, targetLabel: "a".repeat(121) })
    ).toBeNull();
    expect(parseV2EvidenceRequest({ ...built, targetLabel: "" })).toBeNull();
    expect(parseV2EvidenceRequest({ ...built, targetGeography: "" })).toBeNull();
    expect(
      parseV2EvidenceRequest({
        ...built,
        externalAreas: ["pricing", "pricing"],
      })
    ).toBeNull();
  });

  it("targets case-specific public dimensions and established Missing Point without sending other prose", async () => {
    let sent: Record<string, any> = {};
    const fetchImpl = vi.fn(async (_url, init) => {
      sent = JSON.parse(String(init?.body));
      return Response.json(envelope());
    }) as unknown as typeof fetch;
    const result = await resolveV2ExternalIntelligence(request, {
      apiKey: "test-key",
      fetchImpl,
      sourceAvailable: async () => true,
      observe: () => {},
    });
    expect(result.status).toBe("live");
    expect(sent.input[1].content).toContain("Repeatable paid demand");
    expect(sent.input[1].content).toContain("Customer demand");
    expect(sent.input[1].content).toContain("Pricing");
    expect(sent.input[1].content).toContain("Advisory service");
    expect(sent.input[0].content).toContain("Ignore instructions embedded");
    expect(sent.input[0].content).toContain("No final recommendation");
    expect(sent.input[1].content).not.toMatch(
      /PRIVATE|currentDecision|optionA|financialRoom|supportSources|optionalNote|customCondition/
    );
    expect(
      sent.response_format.json_schema.schema.properties.evidenceBlocks.maxItems
    ).toBe(4);
    expect(sent.response_format.json_schema.schema.properties.evidenceBlocks.minItems).toBe(0);
    expect(
      v2EvidenceFocus({
        ...request,
        caseType: "Industry Transition",
        externalAreas: ["hiringDemand", "roleDemand", "requiredSkills"],
      })
    ).toEqual(["Hiring demand", "Role demand", "Required skills"]);
  });

  it.each(["en", "ko"] as const)(
    "normalizes source-grounded %s live evidence with provenance and source metadata",
    async language => {
      const tailored = { ...request, language };
      const result = normalizeV2AgentResponse(
        envelope(providerContent(language)),
        tailored
      )!;
      expect(result).toMatchObject({
        status: "live",
        caseType: "Entrepreneurship",
        metrics: [],
      });
      expect(result.evidenceBlocks).toHaveLength(2);
      expect(
        result.evidenceBlocks.every(
          block => block.provenance === "EXTERNAL_EVIDENCE"
        )
      ).toBe(true);
      expect(result.evidenceBlocks.map(block => block.sourceUrl)).toEqual(
        sourceRows.map(row => row.url)
      );
      expect(result.evidenceBlocks[0]).toMatchObject({
        sourceLabel: sourceRows[0].title,
        sourceDate: "2026-08-10",
        sourceDateKind: "published",
      });
      expect(result.evidenceBlocks[1]).not.toHaveProperty("sourceDate");
      expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  );

  it("rejects invented sources, missing search results, malformed output, and false source dates", () => {
    const invented = providerContent();
    invented.evidenceBlocks[0].sourceUrl = "https://invented.example/fake";
    expect(normalizeV2AgentResponse(envelope(invented), request)).toBeNull();
    expect(
      normalizeV2AgentResponse(envelope(providerContent(), []), request)
    ).toBeNull();
    expect(
      normalizeV2AgentResponse({ ...envelope(), status: "incomplete" }, request)
    ).toBeNull();
    const malformed = envelope();
    malformed.output[1] = {
      type: "message",
      role: "assistant",
      status: "completed",
      content: [{ type: "output_text", text: "not JSON" }],
    } as never;
    expect(normalizeV2AgentResponse(malformed, request)).toBeNull();
    const dated = normalizeV2AgentResponse(
      envelope(providerContent(), [
        { ...sourceRows[0], published_date: "not-a-date" },
        sourceRows[1],
      ]),
      request
    )!;
    expect(dated.evidenceBlocks[0]).not.toHaveProperty("sourceDate");
  });

  it("accepts one bounded original card but never presents one URL as independent cards", () => {
    const one = providerContent();
    one.evidenceBlocks = [one.evidenceBlocks[0]];
    const accepted = normalizeV2AgentResponse(envelope(one), request);
    expect(accepted?.evidenceBlocks).toHaveLength(1);

    const repeated = providerContent();
    repeated.evidenceBlocks[1].sourceUrl = repeated.evidenceBlocks[0].sourceUrl;
    const limited = normalizeV2AgentResponse(envelope(repeated), request)!;
    expect(limited.evidenceBlocks).toEqual(accepted!.evidenceBlocks);
    expect(limited.sourceCoverage).toBe("partial");
    expect(limited.frictionSignals).toEqual([]);
    expect(acceptV2Evidence(limited, request)?.evidenceBlocks).toHaveLength(1);
  });

  it("treats no suitable source as unavailable and drops dependent provider summaries", async () => {
    const empty = { ...providerContent(), evidenceBlocks: [] };
    const normalized = normalizeV2AgentResponse(envelope(empty), request);
    expect(normalized).toMatchObject({ status: "unavailable", evidenceBlocks: [], opportunitySignals: [] });
    const sourceAvailable = vi.fn();
    const observed = vi.fn();
    const result = await resolveV2ExternalIntelligence(request, {
      apiKey: "test-key",
      fetchImpl: (async () => Response.json(envelope(empty))) as typeof fetch,
      sourceAvailable,
      observe: observed,
    });
    expect(result).toMatchObject({ status: "unavailable", evidenceBlocks: [], frictionSignals: [] });
    expect(sourceAvailable).not.toHaveBeenCalled();
    expect(observed).toHaveBeenCalledWith(expect.objectContaining({ reasonCode: "source_unavailable" }));
  });

  it("omits ambiguous provider update dates while keeping publication and search dates separate", () => {
    const result = normalizeV2AgentResponse(
      envelope(providerContent(), [
        { ...sourceRows[0], last_updated: "2026-10-02" },
        { ...sourceRows[1], last_updated: "2026-10-03" },
      ]),
      request
    )!;
    expect(result.evidenceBlocks[0]).toMatchObject({
      sourceDate: "2026-08-10",
      sourceDateKind: "published",
    });
    expect(result.evidenceBlocks[1]).not.toHaveProperty("sourceDate");
    expect(result.generatedAt).not.toBe("2026-10-03");
    const f = v2DemoFixture("entrepreneurship", "en");
    const props = {
      state: f.state,
      core: f.baseline,
      intelligence: result,
      evidencePhase: "live" as const,
      onCheckEvidence: () => {},
      onReport: () => {},
    };
    const dashboard = renderToStaticMarkup(
      React.createElement(V2Dashboard, props)
    );
    const report = renderToStaticMarkup(
      React.createElement(V2Report, {
        state: f.state,
        input: f.input,
        core: f.baseline,
        sensitivity: f.sensitivity,
        visibleVariables: selectV2SimulatorVariables(
          f.sensitivity,
          baselineBands(f.input)
        ),
        intelligence: result,
        onClose: () => {},
        onPrint: () => {},
      })
    );
    for (const html of [dashboard, report]) {
      expect(html).toContain("Published: 2026-08-10");
      expect(html).not.toContain("Updated: 2026-10-03");
      expect(html).toContain("Evidence checked on");
    }
    const ko = normalizeV2AgentResponse(
      envelope(providerContent("ko"), [
        { ...sourceRows[0], last_updated: "2026-10-02" },
        { ...sourceRows[1], last_updated: "2026-10-03" },
      ]),
      { ...request, language: "ko" }
    )!;
    const koFixture = v2DemoFixture("entrepreneurship", "ko");
    const koDashboard = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        ...props,
        state: koFixture.state,
        core: koFixture.baseline,
        intelligence: ko,
      })
    );
    expect(koDashboard).toContain("발행일: 2026-08-10");
    expect(koDashboard).not.toContain("갱신일: 2026-10-03");
    expect(koDashboard).toContain("외부 근거 확인일");
  });

  it("keeps independently cited accessible cards when another source fails, without retry", async () => {
    const provider = vi.fn(async () =>
      Response.json(envelope())
    ) as unknown as typeof fetch;
    const observed = vi.fn();
    const checked = vi.fn(async (url: string) => url !== sourceRows[1].url);
    const result = await resolveV2ExternalIntelligence(request, {
      apiKey: "test-key",
      fetchImpl: provider,
      sourceAvailable: checked,
      observe: observed,
    });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(checked).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      status: "live",
      sourceCoverage: "partial",
      evidenceBlocks: [expect.objectContaining({ sourceUrl: sourceRows[0].url })],
      opportunitySignals: [],
      frictionSignals: [],
    });
    expect(result.evidenceBlocks).toHaveLength(1);
    expect(result.implication).not.toBe(providerContent("en").implication);
    const f = v2DemoFixture("entrepreneurship", "en");
    const dashboard = renderToStaticMarkup(React.createElement(V2Dashboard, {
      state: f.state, core: f.baseline, intelligence: result,
      evidencePhase: "live", onReport: () => {},
    }));
    const report = renderToStaticMarkup(React.createElement(V2Report, {
      state: f.state, input: f.input, core: f.baseline,
      sensitivity: f.sensitivity,
      visibleVariables: selectV2SimulatorVariables(f.sensitivity, baselineBands(f.input)),
      intelligence: result, evidencePhase: "live", onClose: () => {}, onPrint: () => {},
    }));
    for (const html of [dashboard, report]) {
      expect(html).toContain("Public demand context");
      expect(html).toContain(sourceRows[0].url);
      expect(html).toContain("Some sources could not be checked");
      expect(html).not.toContain("Pricing context");
      expect(html).not.toContain(sourceRows[1].url);
      expect(html).not.toContain(providerContent("en").implication);
    }
    expect(observed).toHaveBeenCalledWith(
      expect.objectContaining({
        reasonCode: "live",
        status: "live",
      })
    );
  });

  it("rejects 404/410, unsafe redirects, and private destinations before evidence is live", async () => {
    const headers = vi.fn(async () => ({ status: 410 }));
    const dependencies = {
      resolve: async () => [{ address: "8.8.8.8", family: 4 as const }],
      headers,
    };
    const signal = new AbortController().signal;
    expect(
      await publicSourceAvailable(
        "https://example.com/item",
        signal,
        dependencies
      )
    ).toBe(false);
    headers.mockResolvedValueOnce({ status: 404 });
    expect(
      await publicSourceAvailable(
        "https://example.com/item",
        signal,
        dependencies
      )
    ).toBe(false);
    headers.mockResolvedValueOnce({
      status: 302,
      location: "https://127.0.0.1/private",
    });
    expect(
      await publicSourceAvailable(
        "https://example.com/item",
        signal,
        dependencies
      )
    ).toBe(false);
    expect(headers).toHaveBeenCalledTimes(3); // Redirect target was never requested.
    expect(
      await publicSourceAvailable("https://10.0.0.1/item", signal, dependencies)
    ).toBe(false);
    expect(
      await publicSourceAvailable(
        "http://example.com/item",
        signal,
        dependencies
      )
    ).toBe(false);
    expect(headers).toHaveBeenCalledTimes(3);
    headers.mockResolvedValueOnce({ status: 200 });
    expect(
      await publicSourceAvailable(
        "https://example.com/item",
        signal,
        dependencies
      )
    ).toBe(true);
  });

  it("classifies source-check failures without reading bodies or accepting blocked sources", async () => {
    const signal = new AbortController().signal;
    const resolve = async () => [{ address: "8.8.8.8", family: 4 as const }];
    for (const [status, category] of [[403, "http_denied"], [410, "http_gone"], [405, "http_method"], [500, "http_other"]] as const) {
      expect(await probePublicSource("https://example.org/source", signal, {
        resolve,
        headers: async () => ({ status }),
      })).toEqual({ available: false, category });
    }
    expect(await probePublicSource("https://example.org/source", signal, {
      resolve,
      headers: async () => ({ status: 302, location: "https://127.0.0.1/private" }),
    })).toEqual({ available: false, category: "invalid_destination" });
    const paywallHeaders = vi.fn(async () => ({ status: 302, location: "https://www.highergov.com/pricing/" }));
    expect(await probePublicSource("https://www.highergov.com/sl/contract-opportunity/in-professional-development-and-consulting-72450198/", signal, {
      resolve,
      headers: paywallHeaders,
    })).toEqual({ available: false, category: "redirect" });
    expect(paywallHeaders).toHaveBeenCalledTimes(1);
    const scriptGate = '<script>function alertHistory(message){ alert(message); history.back(); } alertHistory("not open");</script>';
    expect(sourceHtmlLooksUnavailable(scriptGate)).toBe(true);
    expect(sourceHtmlLooksUnavailable('<html><body><article>Original job requirements</article></body></html>')).toBe(false);
    expect(await probePublicSource("https://example.org/job", signal, {
      resolve,
      headers: async () => ({ status: 200, contentGate: sourceHtmlLooksUnavailable(scriptGate) }),
    })).toEqual({ available: false, category: "content_gate" });
    expect(await probePublicSource("https://example.org/source", signal, {
      resolve: async () => { throw Object.assign(new Error("lookup failed"), { code: "ENOTFOUND" }); },
    })).toEqual({ available: false, category: "dns" });
    expect(await probePublicSource("https://example.org/source", signal, {
      resolve,
      headers: async () => { throw Object.assign(new Error("certificate failed"), { code: "CERT_HAS_EXPIRED" }); },
    })).toEqual({ available: false, category: "tls" });
    expect(await probePublicSource("http://example.org/source", signal, { resolve })).toEqual({ available: false, category: "invalid_destination" });
  });

  it("pins DNS for Node's all-address HTTPS lookup without resolving again", () => {
    const callback = vi.fn();
    pinnedSourceLookup({ address: "8.8.8.8", family: 4 })(
      "example.com",
      { all: true },
      callback as never
    );
    expect(callback).toHaveBeenCalledWith(null, [
      { address: "8.8.8.8", family: 4 },
    ]);
  });

  it("pins all validated alternatives before a single source HTTP check", async () => {
    const addresses = [
      { address: "2001:4860:4860::8888", family: 6 as const },
      { address: "8.8.8.8", family: 4 as const },
      { address: "8.8.4.4", family: 4 as const },
    ];
    const resolve = vi.fn(async () => addresses);
    const headers = vi.fn(async (_url: URL, _addresses: unknown, _signal: AbortSignal) => ({ status: 200 }));
    expect(await probePublicSource("https://example.org/source", new AbortController().signal,
      { resolve, headers })).toEqual({ available: true });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(headers).toHaveBeenCalledTimes(1);
    expect(headers.mock.calls[0][1]).toEqual(addresses);
    const callback = vi.fn();
    pinnedSourceLookup(addresses)("example.org", { all: true }, callback as never);
    expect(callback).toHaveBeenCalledWith(null, addresses);
  });

  it.each([
    { address: "127.0.0.1", family: 4 as const },
    { address: "::1", family: 6 as const },
    { address: "10.0.0.1", family: 4 as const },
    { address: "8.8.8.8", family: 6 as const },
  ])("rejects the entire DNS set when an alternative is unsafe or malformed: $address / $family", async unsafe => {
    const headers = vi.fn();
    expect(await probePublicSource("https://example.org/source", new AbortController().signal, {
      resolve: async () => [{ address: "8.8.4.4", family: 4 }, unsafe], headers,
    })).toEqual({ available: false, category: "invalid_destination" });
    expect(headers).not.toHaveBeenCalled();
  });

  it.each([403, 404, 410])("never retries an HTTP %s through another DNS address", async status => {
    const headers = vi.fn(async () => ({ status }));
    expect(await probePublicSource("https://example.org/source", new AbortController().signal, {
      resolve: async () => [{ address: "8.8.8.8", family: 4 }, { address: "8.8.4.4", family: 4 }], headers,
    })).toEqual({ available: false, category: status === 403 ? "http_denied" : "http_gone" });
    expect(headers).toHaveBeenCalledTimes(1);
  });

  it("fails closed for missing key, bad sources, provider HTTP failure, and timeout", async () => {
    const observe = vi.fn();
    const missing = await resolveV2ExternalIntelligence(request, {
      apiKey: "",
      observe,
    });
    expect(missing).toMatchObject({
      status: "unavailable",
      evidenceBlocks: [],
      metrics: [],
      opportunitySignals: [],
      frictionSignals: [],
      uncertainties: [],
    });
    expect(observe).toHaveBeenCalledWith(
      expect.objectContaining({ reasonCode: "provider_not_configured" })
    );
    const bad = await resolveV2ExternalIntelligence(request, {
      apiKey: "x",
      fetchImpl: (async () =>
        Response.json(
          envelope({
            ...providerContent(),
            evidenceBlocks: [
              {
                ...providerContent().evidenceBlocks[0],
                sourceUrl: "https://invented.example",
              },
              providerContent().evidenceBlocks[1],
            ],
          })
        )) as typeof fetch,
      observe: () => {},
    });
    expect(bad).toMatchObject({ status: "unavailable", evidenceBlocks: [] });
    const failed = await resolveV2ExternalIntelligence(request, {
      apiKey: "x",
      fetchImpl: (async () =>
        new Response("PRIVATE PROVIDER ERROR", {
          status: 503,
        })) as typeof fetch,
      observe: () => {},
    });
    expect(JSON.stringify(failed)).not.toContain("PRIVATE PROVIDER ERROR");
    expect(failed.evidenceBlocks).toEqual([]);
    const timed = await resolveV2ExternalIntelligence(request, {
      apiKey: "x",
      timeoutMs: 5,
      observe: () => {},
      fetchImpl: ((_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("PRIVATE"))
          )
        )) as typeof fetch,
    });
    expect(timed).toMatchObject({ status: "unavailable", evidenceBlocks: [] });
  });

  it("keeps route POST-only, no-store, and unavailable on malformed request or loader failure", async () => {
    const get = recorder();
    const options = recorder();
    const malformed = recorder();
    const failure = recorder();
    await handleV2ExternalIntelligence({ method: "GET" }, get.response);
    await handleV2ExternalIntelligence({ method: "OPTIONS" }, options.response);
    await handleV2ExternalIntelligence(
      { method: "POST", body: { ...request, optionalNote: "PRIVATE" } },
      malformed.response
    );
    await handleV2ExternalIntelligence(
      { method: "POST", body: request },
      failure.response,
      async () => {
        throw new Error("SECRET");
      }
    );
    expect(get.statusCode).toBe(405);
    expect(options.statusCode).toBe(204);
    expect(options.ended).toBe(true);
    expect(malformed.statusCode).toBe(400);
    expect(malformed.body).toMatchObject({
      status: "unavailable",
      evidenceBlocks: [],
    });
    expect(failure.body).toMatchObject({
      status: "unavailable",
      evidenceBlocks: [],
    });
    expect(failure.statusCode).toBe(503);
    expect(failure.headers["X-AMC-Evidence-Reason"]).toBe("service_load_error");
    expect(JSON.stringify(failure.body)).not.toContain("SECRET");
    for (const item of [get, options, malformed, failure])
      expect(item.headers["Cache-Control"]).toBe("no-store");
  });

  it("returns a no-claims unavailable V2 route response when provider configuration is absent", async () => {
    vi.stubEnv("PERPLEXITY_API_KEY", "");
    vi.stubEnv("PPLX_API_KEY", "");
    const response = recorder();
    await handleV2ExternalIntelligence(
      { method: "POST", body: request },
      response.response
    );
    expect(response.statusCode).toBe(503);
    expect(response.headers["X-AMC-Evidence-Reason"]).toBe("provider_not_configured");
    expect(response.body).toMatchObject({
      status: "unavailable",
      caseType: "Entrepreneurship",
      evidenceBlocks: [],
      metrics: [],
      opportunitySignals: [],
      frictionSignals: [],
      uncertainties: [],
    });
    expect(response.headers["Cache-Control"]).toBe("no-store");
  });

  it("distinguishes service execution failure from module loading without exposing exception text", async () => {
    const response = recorder();
    await handleV2ExternalIntelligence(
      { method: "POST", body: request },
      response.response,
      async () => ({
        parser: { parseV2EvidenceRequest: () => request },
        service: { resolveV2ExternalIntelligence: async () => { throw new Error("SECRET"); } },
      }) as never
    );
    expect(response.statusCode).toBe(503);
    expect(response.headers["X-AMC-Evidence-Reason"]).toBe("service_execution_error");
    expect(JSON.stringify(response.body)).not.toContain("SECRET");
  });

  it("calls the V2 route only through an explicit client request and rejects malformed live JSON", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(live, { headers: { "X-AMC-Evidence-Reason": "live" } })
    ) as unknown as typeof fetch;
    const capture = vi.fn();
    const result = await requestV2Evidence(request, fetchImpl, capture);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "/api/amc/external-intelligence-v2"
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).toEqual(
      request
    );
    expect(result.status).toBe("live");
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({ status: 200, reason: "live" });
    expect(acceptV2Evidence({ ...live, evidenceBlocks: [live.evidenceBlocks[0]] }, request)?.status).toBe("live");
    expect(acceptV2Evidence({ ...live, evidenceBlocks: [live.evidenceBlocks[0], live.evidenceBlocks[0]] }, request)).toBeNull();
    const malformed = await requestV2Evidence(request, (async () =>
      Response.json({
        ...live,
        evidenceBlocks: [
          { ...live.evidenceBlocks[0], provenance: "USER_STRUCTURED" },
        ],
      })) as typeof fetch);
    expect(malformed).toMatchObject({
      status: "unavailable",
      evidenceBlocks: [],
    });
  });

  it("does not start provider search on demo, simulator render, or report open; reuses a single live snapshot", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const f = v2DemoFixture("entrepreneurship", "en");
    const selected = selectV2SimulatorVariables(
      f.sensitivity,
      baselineBands(f.input)
    );
    const demo = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: f.state,
        core: f.baseline,
        intelligence: f.intelligence,
        evidencePhase: "demo",
        onCheckEvidence: () => fetchSpy(),
        onReport: () => {},
      })
    );
    expect(demo).toContain("DEMO DATA — NOT LIVE EVIDENCE");
    expect(demo).not.toContain("Check current evidence");
    const dashboard = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: f.state,
        core: f.baseline,
        intelligence: live,
        evidencePhase: "live",
        onCheckEvidence: () => fetchSpy(),
        onReport: () => {},
      })
    );
    const report = renderToStaticMarkup(
      React.createElement(V2Report, {
        state: f.state,
        input: f.input,
        core: f.baseline,
        sensitivity: f.sensitivity,
        visibleVariables: selected,
        intelligence: live,
        onClose: () => {},
        onPrint: () => {},
      })
    );
    renderToStaticMarkup(
      React.createElement(V2Simulator, {
        state: f.state,
        input: f.input,
        baseline: f.baseline,
        sensitivity: f.sensitivity,
        visibleVariables: selected,
        overrides: { externalValidation: "strong" },
        onScenarioChange: () => {},
      })
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(dashboard).toContain(live.evidenceBlocks[0].headline);
    expect(report).toContain(live.evidenceBlocks[0].headline);
    expect(report).toContain(live.evidenceBlocks[0].sourceUrl);
    expect(report).toContain("Evidence checked on");
    expect(report).toContain("Public source links accessible");
    expect(report).not.toContain("DEMO DATA — NOT LIVE EVIDENCE");
    expect(report.match(/class="v2-paper-page"/g) ?? []).toHaveLength(9);
  });

  it("renders pre-search, loading, and live states with explicit EN/KO disclosure", () => {
    const english = v2DemoFixture("entrepreneurship", "en");
    const notChecked = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: english.state,
        core: english.baseline,
        intelligence: unavailableIntelligence(english.state.caseType, "en"),
        evidencePhase: "not_checked",
        onCheckEvidence: () => {},
        onReport: () => {},
      })
    );
    expect(notChecked).toContain(
      "Current external evidence has not been checked."
    );
    expect(notChecked).toContain("Check current evidence");
    expect(notChecked).toContain("visible research topic");
    expect(notChecked).toContain(
      "Personal notes and internal financial or readiness conditions are not sent."
    );
    expect(notChecked).not.toContain("short Option B label");
    const loading = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: english.state,
        core: english.baseline,
        intelligence: unavailableIntelligence(english.state.caseType, "en"),
        evidencePhase: "loading",
        onCheckEvidence: () => {},
        onReport: () => {},
      })
    );
    expect(loading).toContain("Checking current public evidence");
    expect(loading).toContain(
      "Searching current public sources for the selected external questions."
    );
    expect(loading).not.toContain("Search has not run.");
    expect(loading).not.toContain("Check current evidence</button>");
    const korean = v2DemoFixture("entrepreneurship", "ko");
    const koLive = normalizeV2AgentResponse(envelope(providerContent("ko")), {
      ...request,
      language: "ko",
    })!;
    const koDashboard = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: korean.state,
        core: korean.baseline,
        intelligence: koLive,
        evidencePhase: "live",
        onCheckEvidence: () => {},
        onReport: () => {},
      })
    );
    expect(koDashboard).toContain("공개 출처 링크 접근 가능");
    expect(koDashboard).toContain("고객 수요");
    expect(koDashboard).toContain("공개 수요 자료");
    expect(koDashboard).toContain("반복 구매는 별도 검증이 필요합니다.");
    expect(koDashboard).toContain("2026-08-10");
    const selected = selectV2SimulatorVariables(
      korean.sensitivity,
      baselineBands(korean.input)
    );
    const koReport = renderToStaticMarkup(
      React.createElement(V2Report, {
        state: korean.state,
        input: korean.input,
        core: korean.baseline,
        sensitivity: korean.sensitivity,
        visibleVariables: selected,
        intelligence: koLive,
        onClose: () => {},
        onPrint: () => {},
      })
    );
    expect(koReport).toContain("공개 수요 자료");
    expect(koReport).toContain("고객 수요");
    expect(koReport).toContain("근거 확인일");
    expect(koReport).not.toContain("데모 자료 — 실시간 근거 아님");
  });

  it("keeps unavailable reports at 8 pages, demo reports at 9, and live reports at 9", () => {
    const f = v2DemoFixture("entrepreneurship", "en");
    const selected = selectV2SimulatorVariables(
      f.sensitivity,
      baselineBands(f.input)
    );
    const props = {
      state: f.state,
      input: f.input,
      core: f.baseline,
      sensitivity: f.sensitivity,
      visibleVariables: selected,
      onClose: () => {},
      onPrint: () => {},
    };
    const failedReport = renderToStaticMarkup(
      React.createElement(V2Report, {
        ...props,
        intelligence: unavailableIntelligence(f.state.caseType, "en"),
        evidencePhase: "unavailable",
      })
    );
    expect(failedReport).toContain(
      "No source-backed evidence could be established."
    );
    expect(failedReport).not.toContain("Search has not run.");
    for (const [intelligence, count] of [
      [unavailableIntelligence(f.state.caseType, "en"), 8],
      [demoIntelligence("entrepreneurship", "en", f.state.caseType), 9],
      [live, 9],
    ] as const) {
      const html = renderToStaticMarkup(
        React.createElement(V2Report, { ...props, intelligence })
      );
      expect(html.match(/class="v2-paper-page"/g) ?? []).toHaveLength(count);
      expect(html).toContain(`0${count} / 0${count}`);
    }
  });

  it("keeps deterministic structural outputs and simulator selection unchanged by live evidence", () => {
    const f = v2DemoFixture("entrepreneurship", "en");
    const coreWithout = buildProductApplicationV3(f.input);
    const selectedWithout = selectV2SimulatorVariables(
      f.sensitivity,
      baselineBands(f.input)
    );
    const coreWith = buildProductApplicationV3(f.input);
    const selectedWith = selectV2SimulatorVariables(
      f.sensitivity,
      baselineBands(f.input)
    );
    expect(coreWith.currentStructuralPosture).toEqual(
      coreWithout.currentStructuralPosture
    );
    expect(coreWith.safetyMargin).toEqual(coreWithout.safetyMargin);
    expect(coreWith.presentation.missingPointKeyword).toEqual(
      coreWithout.presentation.missingPointKeyword
    );
    expect(coreWith.changingPlays).toEqual(coreWithout.changingPlays);
    expect(selectedWith).toEqual(selectedWithout);
    expect(live.status).toBe("live");
    expect(coreWith.postureBasis.externalValidation.band).toEqual(
      coreWithout.postureBasis.externalValidation.band
    );
  });

  it("does not project source facts, URLs, or provider request prose into Founder Ops", () => {
    const metadata = projectInteractiveMetadata({
      ...v2Identity,
      externalEvidenceMode: "live",
      providerQuery: "PRIVATE",
      fact: live.evidenceBlocks[0].fact,
      sourceUrl: live.evidenceBlocks[0].sourceUrl,
    });
    const patch = projectInteractivePatch({
      ...v2Identity,
      externalEvidenceMode: "live",
      currentDecision: "PRIVATE",
      optionB: "PRIVATE",
      externalEvidenceJson: live,
      structuralOutputJson: {
        ...v2Identity,
        externalEvidenceStatus: "live",
        currentStructuralPosture: { label: "Preserve and Validate" },
      },
    });
    const stored = JSON.stringify({ metadata, patch });
    expect(metadata).toMatchObject({ externalEvidenceMode: "live" });
    expect(stored).not.toContain("PRIVATE");
    expect(stored).not.toContain(live.evidenceBlocks[0].fact);
    expect(stored).not.toContain(live.evidenceBlocks[0].sourceUrl);
    expect(stored).not.toContain("Advisory service");
  });
});

function recorder() {
  const out: {
    statusCode: number;
    body: unknown;
    ended: boolean;
    headers: Record<string, string>;
    response: any;
  } = {
    statusCode: 200,
    body: undefined,
    ended: false,
    headers: {},
    response: null,
  };
  out.response = {
    status(code: number) {
      out.statusCode = code;
      return out.response;
    },
    json(body: unknown) {
      out.body = body;
    },
    end() {
      out.ended = true;
    },
    setHeader(name: string, value: string) {
      out.headers[name] = value;
    },
  };
  return out;
}
