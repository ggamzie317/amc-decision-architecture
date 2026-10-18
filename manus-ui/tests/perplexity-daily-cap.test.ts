import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleV2ExternalIntelligence } from "../api/amc/external-intelligence-v2";
import V2Processing, { v2ProcessingFailureKind } from "../client/src/components/V2Processing";
import { unavailableIntelligence } from "../client/src/data/externalIntelligenceV2";
import { v2ShouldRetryTopic } from "../client/src/data/v2EvidenceFlow";
import { requestV2Evidence } from "../client/src/data/v2ExternalEvidenceClient";
import { buildOperationsSummary } from "../server/founderOpsAnalytics";
import { ADMIN_COOKIE_NAME, createAdminSession } from "../server/founderAdminAuth";
import { trackFounderOps } from "../server/founderOpsApi";
import {
  MemoryFounderOpsStore,
  PERPLEXITY_DAILY_LIMIT,
  PostgresFounderOpsStore,
  perplexityDailyLimit,
} from "../server/founderOpsStore";
import type { FounderOpsStore } from "../server/founderOpsTypes";
import { buildLaunchOpsSummary } from "../server/launchOpsAnalytics";
import {
  admitV2ProviderCalls,
  resolveV2ExternalIntelligence,
} from "../server/externalIntelligenceV2Service";
import * as serviceModule from "../server/externalIntelligenceV2Service";
import * as parserModule from "../shared/externalIntelligenceV2Request";
import { parseV2EvidenceRequest } from "../shared/externalIntelligenceV2Request";
import { v2EvidenceGroups } from "../shared/v2EvidenceMerge";
import { projectInteractiveMetadata, projectInteractivePatch, v2Identity } from "../shared/interactivePrivacy";
import {
  handleAdminLaunchOps,
  handleAdminSubmission,
  type ApiResponse,
} from "../server/vercelFounderOps";

// Components compile with the classic JSX runtime (same as the other render tests).
(globalThis as any).React = React;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// Entrepreneurship defaults to four areas, i.e. two topic groups per request.
const request = parseV2EvidenceRequest({
  caseType: "Entrepreneurship",
  externalAreas: [],
  targetGeography: "United States",
  targetLabel: "Education consulting",
  language: "en",
})!;
const single = parseV2EvidenceRequest({ ...request, externalAreas: ["customerDemand"] })!;

/** Provider mock: answers each group with one card for its first requested dimension. */
function provider(statuses: number[] = []) {
  let call = 0;
  return vi.fn(async (_url: unknown, init?: RequestInit) => {
    const status = statuses[call++] ?? 200;
    if (status !== 200) return new Response("rate limited", { status });
    const body = JSON.parse(String(init?.body));
    const dimension = body.response_format.json_schema.schema.properties.evidenceBlocks.items.properties.dimension.enum[0];
    const sourceUrl = `https://example.org/${encodeURIComponent(dimension)}`;
    const value = {
      contextConfidence: "medium",
      evidenceBlocks: [{
        dimension, direction: "mixed", sourceUrl,
        headline: `A bounded public fact about ${dimension}`,
        fact: "The source describes one program, not repeated purchases.",
        whyItMatters: "This does not establish this service's paid demand.",
      }],
      opportunitySignals: [], frictionSignals: [],
      uncertainties: ["Repeat purchases remain unverified."],
      implication: "Check customer payment separately.",
    };
    return Response.json({
      object: "response", status: "completed", error: null,
      output: [
        { type: "search_results", results: [{ url: sourceUrl, title: "Original source" }] },
        { type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(value) }] },
      ],
    });
  });
}

const providerCalls = (store: MemoryFounderOpsStore) =>
  store.events.filter(e => e.eventType === "external_evidence_requested" && e.metadataJson.providerCall === true).length;

async function consented(store = new MemoryFounderOpsStore(), consent = true) {
  const { submissionId } = await store.createSubmission("en", consent);
  return { store, id: submissionId };
}

function resolve(
  input: typeof request,
  options: { store?: FounderOpsStore; submissionId?: string | null; fetchImpl: typeof fetch; onReason?: (r: string) => void }
) {
  return resolveV2ExternalIntelligence(input, {
    apiKey: "synthetic-key",
    retryDelayMs: 0,
    sourceAvailable: async () => true,
    observe: () => {},
    ...options,
  });
}

/** The real route, real service and an injected store, with fetch mocked. */
async function route(
  body: unknown,
  headers: Record<string, string>,
  store: FounderOpsStore | undefined,
  fetchImpl: typeof fetch
) {
  const state = { status: 0, body: undefined as any, headers: {} as Record<string, string> };
  const res = {
    setHeader: (name: string, value: string) => { state.headers[name] = value; },
    status: (code: number) => { state.status = code; return res; },
    json: (value: unknown) => { state.body = value; },
    end: () => {},
  };
  await handleV2ExternalIntelligence({ method: "POST", body, headers }, res, async () => ({
    parser: parserModule,
    service: {
      ...serviceModule,
      resolveV2ExternalIntelligence: (input, options) => resolve(input, { ...options, ...(store ? { store } : {}), fetchImpl }),
    },
  }));
  return state;
}

describe("Perplexity daily allowance store", () => {
  it("defaults to 300 calls a day and reads AMC_PERPLEXITY_DAILY_LIMIT only when it is a positive integer", () => {
    expect(PERPLEXITY_DAILY_LIMIT).toBe(300);
    expect(perplexityDailyLimit({})).toBe(300);
    expect(perplexityDailyLimit({ AMC_PERPLEXITY_DAILY_LIMIT: "50" })).toBe(50);
    expect(perplexityDailyLimit({ AMC_PERPLEXITY_DAILY_LIMIT: " 7 " })).toBe(7);
    for (const invalid of ["0", "-5", "1.5", "abc", "", "1e3", "99999999999999999999"])
      expect(perplexityDailyLimit({ AMC_PERPLEXITY_DAILY_LIMIT: invalid })).toBe(300);
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "12");
    expect(perplexityDailyLimit()).toBe(12);
  });

  it("counts every reservation and refuses at the limit (env override read at call time)", async () => {
    const { store, id } = await consented();
    const other = (await store.createSubmission("ko", true)).submissionId;
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "3");
    expect(await store.reservePerplexityCall(id)).toBe(true);
    expect(await store.reservePerplexityCall(other)).toBe(true);
    expect(await store.reservePerplexityCall(id)).toBe(true);
    // Service-wide: a different journey is refused too.
    expect(await store.reservePerplexityCall(other)).toBe(false);
    expect(providerCalls(store)).toBe(3);
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "4");
    expect(await store.reservePerplexityCall(other)).toBe(true);
    expect(await store.reservePerplexityCall(other)).toBe(false);
  });

  it("does not count rows older than 24 hours or customer request rows", async () => {
    const { store, id } = await consented();
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "2");
    await store.addEvent(id, "external_evidence_requested", {});
    expect(await store.reservePerplexityCall(id)).toBe(true);
    expect(await store.reservePerplexityCall(id)).toBe(true);
    expect(await store.reservePerplexityCall(id)).toBe(false);
    for (const e of store.events) e.createdAt = new Date(Date.now() - 24 * 3_600_000 - 1000).toISOString();
    expect(await store.reservePerplexityCall(id)).toBe(true);
  });

  it("Postgres: locks with its own key, counts providerCall rows in the rolling 24 hours, then inserts", async () => {
    const run = async (reserved: number) => {
      const queries: { text: string; values: unknown[] }[] = [];
      const tx: any = (strings: TemplateStringsArray, ...values: unknown[]) => {
        const text = strings.join("$").replace(/\s+/g, " ").trim();
        queries.push({ text, values });
        return Promise.resolve(/COUNT/.test(text) ? [{ reserved }] : []);
      };
      tx.json = (v: unknown) => v;
      const store = new PostgresFounderOpsStore({ begin: async (cb: (t: unknown) => unknown) => cb(tx) } as any);
      return { result: await store.reservePerplexityCall("AMC-20261018-AAAAAAAA"), queries };
    };
    const open = await run(PERPLEXITY_DAILY_LIMIT - 1);
    expect(open.result).toBe(true);
    expect(open.queries).toHaveLength(3);
    expect(open.queries[0].text).toBe("SELECT pg_advisory_xact_lock(590060)");
    expect(open.queries[1].text).toContain("event_type = 'external_evidence_requested' AND metadata_json ? 'providerCall'");
    expect(open.queries[1].text).toContain("created_at > NOW() - INTERVAL '24 hours'");
    expect(open.queries[1].text).not.toContain("submission_id");
    expect(open.queries[2].text).toContain("INSERT INTO usage_events");
    expect(open.queries[2].text).toContain("'external_evidence_requested'");
    expect(open.queries[2].values.slice(1)).toEqual(["AMC-20261018-AAAAAAAA", { providerCall: true }]);
    const full = await run(PERPLEXITY_DAILY_LIMIT);
    expect(full.result).toBe(false);
    expect(full.queries).toHaveLength(2);
  });
});

describe("Perplexity daily allowance in the V2 evidence service", () => {
  it("reserves a slot before every provider attempt, including each 429 retry", async () => {
    const { store, id } = await consented();
    const fetchImpl = provider([429, 429, 200]);
    const result = await resolve(single, { store, submissionId: id, fetchImpl: fetchImpl as typeof fetch });
    expect(result.status).toBe("live");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(providerCalls(store)).toBe(3);
  });

  it("stops a 429 retry when the limit is reached and makes no further call", async () => {
    const { store, id } = await consented();
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "2");
    const fetchImpl = provider([429, 429, 429]);
    const reasons: string[] = [];
    const result = await resolve(single, { store, submissionId: id, fetchImpl: fetchImpl as typeof fetch, onReason: r => reasons.push(r) });
    expect(result.status).toBe("unavailable");
    expect(reasons).toEqual(["daily_limit"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(providerCalls(store)).toBe(2);
  });

  it("keeps groups that finished and does not call the remaining groups once the limit is reached", async () => {
    expect(v2EvidenceGroups(request)).toHaveLength(2);
    const { store, id } = await consented();
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "1");
    const fetchImpl = provider();
    const reasons: string[] = [];
    const result = await resolve(request, { store, submissionId: id, fetchImpl: fetchImpl as typeof fetch, onReason: r => reasons.push(r) });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("live");
    expect(result.evidenceBlocks.map(block => block.area)).toEqual(["customerDemand"]);
    expect(reasons).toEqual(["live"]);
  });

  it("answers 429 daily_limit with the existing envelope and no provider call when the limit is used up", async () => {
    const { store, id } = await consented();
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "1");
    await store.reservePerplexityCall(id);
    const fetchImpl = provider();
    const res = await route(request, { "x-amc-submission-id": id }, store, fetchImpl as typeof fetch);
    expect(res.status).toBe(429);
    expect(res.headers["X-AMC-Evidence-Reason"]).toBe("daily_limit");
    expect(res.body).toEqual({ ...unavailableIntelligence(request.caseType, "en"), generatedAt: res.body.generatedAt });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(providerCalls(store)).toBe(1);
  });

  it.each([
    ["no header", () => ({})],
    ["a malformed id", () => ({ "x-amc-submission-id": "AMC-1" })],
    ["an unknown journey", () => ({ "x-amc-submission-id": "AMC-20261018-ABCDEF12" })],
  ])("refuses %s with 400 journey_required and no provider call", async (_label, headers) => {
    const { store } = await consented();
    const fetchImpl = provider();
    const res = await route(request, headers(), store, fetchImpl as typeof fetch);
    expect(res.status).toBe(400);
    expect(res.headers["X-AMC-Evidence-Reason"]).toBe("journey_required");
    expect(res.body.status).toBe("unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(providerCalls(store)).toBe(0);
  });

  it("refuses a journey without service-storage consent", async () => {
    const { store, id } = await consented(new MemoryFounderOpsStore(), false);
    const fetchImpl = provider();
    const res = await route(request, { "x-amc-submission-id": id }, store, fetchImpl as typeof fetch);
    expect(res.status).toBe(400);
    expect(res.headers["X-AMC-Evidence-Reason"]).toBe("journey_required");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed in production when the data store is unavailable", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    const fetchImpl = provider();
    const res = await route(request, {}, undefined, fetchImpl as typeof fetch);
    expect(res.status).toBe(503);
    expect(res.headers["X-AMC-Evidence-Reason"]).toBe("daily_limit_unverifiable");
    expect(res.body.status).toBe("unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each(["preview", "development", ""])("allows uncounted calls without a data store outside production (VERCEL_ENV=%s)", async env => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("VERCEL_ENV", env);
    const fetchImpl = provider();
    const res = await route(request, {}, undefined, fetchImpl as typeof fetch);
    expect(res.status).toBe(200);
    expect(res.headers["X-AMC-Evidence-Reason"]).toBe("live");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the allowance cannot be checked or reserved", async () => {
    const { store, id } = await consented();
    const broken = Object.assign(Object.create(Object.getPrototypeOf(store)), store) as MemoryFounderOpsStore;
    broken.reservePerplexityCall = async () => { throw new Error("db down"); };
    const fetchImpl = provider();
    const res = await route(single, { "x-amc-submission-id": id }, broken, fetchImpl as typeof fetch);
    expect(res.status).toBe(503);
    expect(res.headers["X-AMC-Evidence-Reason"]).toBe("daily_limit_unverifiable");
    expect(fetchImpl).not.toHaveBeenCalled();
    const noMethod = { ...store, available: true, getSubmission: store.getSubmission.bind(store), reservePerplexityCall: undefined } as FounderOpsStore;
    expect(await admitV2ProviderCalls({ store: noMethod, submissionId: id })).toEqual({ refused: "daily_limit_unverifiable" });
    const failingRead = { ...noMethod, getSubmission: async () => { throw new Error("db down"); } } as FounderOpsStore;
    expect(await admitV2ProviderCalls({ store: failingRead, submissionId: id })).toEqual({ refused: "daily_limit_unverifiable" });
  });
});

describe("Perplexity daily allowance in the browser", () => {
  const sessionWith = (id: string | null) => ({
    sessionStorage: { getItem: (key: string) => (key === "amc_launch_v3_active_submission_id_interactive-v2" ? id : null), setItem() {}, removeItem() {} },
  });

  it("sends the V2 journey id as a header and keeps the request body unchanged", async () => {
    vi.stubGlobal("window", sessionWith("AMC-20261018-ABCDEF12"));
    const fetchImpl = vi.fn(async () => Response.json(unavailableIntelligence(request.caseType, "en"), { status: 503 }));
    await requestV2Evidence(request, fetchImpl as unknown as typeof fetch);
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.headers).toEqual({ "Content-Type": "application/json", "x-amc-submission-id": "AMC-20261018-ABCDEF12" });
    expect(init.body).toBe(JSON.stringify(request));
    const keys = Object.keys(JSON.parse(String(init.body)));
    expect(keys.every(key => ["caseType", "externalAreas", "targetGeography", "targetLabel", "language", "keyFacts"].includes(key))).toBe(true);
  });

  it("omits the header when there is no journey", async () => {
    vi.stubGlobal("window", sessionWith(null));
    const fetchImpl = vi.fn(async () => Response.json({}, { status: 503 }));
    await requestV2Evidence(request, fetchImpl as unknown as typeof fetch);
    expect((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toEqual({ "Content-Type": "application/json" });
  });

  it("reads the daily_limit reason end to end and never retries a refused topic automatically", async () => {
    const { store, id } = await consented();
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "1");
    await store.reservePerplexityCall(id);
    vi.stubGlobal("window", sessionWith(id));
    const observations: any[] = [];
    const result = await requestV2Evidence(request, (async (_url: unknown, init?: RequestInit) => {
      const res = await route(JSON.parse(String(init?.body)), init?.headers as Record<string, string>, store, provider() as typeof fetch);
      return Response.json(res.body, { status: res.status, headers: res.headers });
    }) as typeof fetch, observation => observations.push(observation));
    expect(result.status).toBe("unavailable");
    expect(observations[0]).toMatchObject({ status: 429, reason: "daily_limit" });
    expect(v2ProcessingFailureKind(observations[0])).toBe("daily_limit");
    expect(v2ShouldRetryTopic(observations[0], result)).toBe(false);
    for (const reason of ["daily_limit_unverifiable", "journey_required"]) {
      const observation = { status: reason === "journey_required" ? 400 : 503, reason };
      expect(v2ShouldRetryTopic(observation, result)).toBe(false);
      expect(v2ProcessingFailureKind(observation)).toBe("service");
    }
    // A plain upstream 429 / 5xx is still retried once.
    expect(v2ShouldRetryTopic({ status: 503, reason: "provider_failure" }, result)).toBe(true);
  });

  it.each([
    ["ko", "오늘의 공개 자료 검색 한도에 도달했습니다", "많은 분이 이용해 오늘 검색 가능한 횟수를 모두 사용했습니다. 내일 다시 검색하거나, 지금은 ‘검색 없이 본 초안’으로 결과를 볼 수 있습니다.", "검색 없이 본 초안 보기", "다시 검색"],
    ["en", "Today&#x27;s public search limit has been reached", "So many searches ran today that the daily limit is used up. Search again tomorrow, or see the result now as a draft without public search.", "See draft without public search", "Search again"],
  ] as const)("shows the owner's daily-limit copy (%s) with the draft as the primary action", (language, headline, body, draft, retry) => {
    const html = renderToStaticMarkup(React.createElement(V2Processing, {
      language, running: false, seconds: 40, target: "EMBA", geography: "Seoul", areas: [],
      observation: { status: 429, reason: "daily_limit", stage: "provider" },
      onRetry: () => {}, onEditTarget: () => {}, onDraft: () => {},
    }));
    expect(html).toContain('data-failure-kind="daily_limit"');
    expect(html).toContain(`<h1>${headline}</h1>`);
    expect(html).toContain(body);
    expect(html).toContain(`<button type="button" class="v2-primary">${draft}</button>`);
    expect(html).toContain(`<button type="button">${retry}</button>`);
    expect(html).not.toContain('class="v2-guidance"');
  });

  it("keeps the existing failure screen for other kinds", () => {
    const html = renderToStaticMarkup(React.createElement(V2Processing, {
      language: "ko", running: false, seconds: 40, target: "EMBA", geography: "서울", areas: [],
      observation: { status: 503, reason: "daily_limit_unverifiable", stage: "configuration" },
      onRetry: () => {}, onEditTarget: () => {}, onDraft: () => {},
    }));
    expect(html).toContain('data-failure-kind="service"');
    expect(html).toContain("지금은 공개 검색 서비스에 연결할 수 없습니다.");
    expect(html).toContain("이번 검색에서는 쓸 수 있는 공개 자료를 찾지 못했습니다");
    expect(html).toContain('<button type="button" class="v2-primary">다시 검색</button>');
    expect(html).toContain('class="v2-guidance"');
  });
});

function v2Track(eventType: string, metadata: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  return {
    eventType,
    language: "en",
    serviceStorageConsent: true,
    metadata: { ...v2Identity, ...metadata },
    patch: projectInteractivePatch({
      language: "en", caseType: "Entrepreneurship", serviceStorageConsent: true,
      researchUseConsent: true, structuralOutputJson: { ...v2Identity },
    }),
    ...extra,
  };
}

describe("Perplexity allowance rows stay server-authored and out of customer analytics", () => {
  it("the public track route drops a forged providerCall key", async () => {
    const store = new MemoryFounderOpsStore();
    const started = await trackFounderOps(v2Track("preview_started", {}, { newSubmission: true }), store);
    expect(projectInteractiveMetadata({ providerCall: true })).not.toHaveProperty("providerCall");
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "1");
    for (let i = 0; i < 3; i++)
      await trackFounderOps(v2Track("external_evidence_requested", { providerCall: true }, { submissionId: started.submissionId }), store);
    const requested = store.events.filter(e => e.eventType === "external_evidence_requested");
    expect(requested).toHaveLength(3);
    expect(requested.every(e => !("providerCall" in e.metadataJson))).toBe(true);
    // Forged rows never use up the allowance.
    expect(await store.reservePerplexityCall(started.submissionId as string)).toBe(true);
  });

  it("admin counts exclude providerCall rows and the launch summary shows allowance use", async () => {
    vi.stubEnv("AMC_ADMIN_SESSION_SECRET", "test-session-secret-value-with-length");
    vi.stubEnv("AMC_PERPLEXITY_DAILY_LIMIT", "40");
    const store = new MemoryFounderOpsStore();
    const started = await trackFounderOps(v2Track("preview_started", {}, { newSubmission: true }), store);
    const id = started.submissionId as string;
    await trackFounderOps(v2Track("external_evidence_requested", {}, { submissionId: id }), store);
    for (let i = 0; i < 4; i++) await store.reservePerplexityCall(id);
    const data = await store.readLaunchData();
    expect(data.events.filter(e => e.eventType === "external_evidence_requested")).toHaveLength(5);

    const launch = buildLaunchOpsSummary(data.submissions, data.events, null);
    expect(launch.evidence.v2.requests).toBe(1);
    expect(launch.evidence.v2.requestJourneys).toBe(1);
    expect(launch.evidence.requests).toBe(0);
    const ops = buildOperationsSummary(data.submissions, data.events);
    expect(ops.rates.externalEvidenceLive).toBe(0);
    expect(buildOperationsSummary(data.submissions, data.events.filter(e => e.metadataJson.providerCall === true))
      .rates.externalEvidenceLive).toBe(0);

    const state = { status: 0, body: undefined as any };
    const res: ApiResponse = {
      status(code) { state.status = code; return res; },
      json(body) { state.body = body; }, send(body) { state.body = body; },
      end() {}, setHeader() {},
    };
    const headers = { cookie: `${ADMIN_COOKIE_NAME}=${createAdminSession()}` };
    await handleAdminLaunchOps({ method: "GET", headers }, res, store);
    expect(state.body.evidence.v2.requests).toBe(1);
    expect(state.body.evidence.v2.providerCallsLast24h).toBe(4);
    expect(state.body.evidence.v2.providerCallDailyLimit).toBe(40);
    await handleAdminSubmission({ method: "GET", headers, query: { id } }, res, store);
    expect(state.body.events.filter((e: any) => e.eventType === "external_evidence_requested")).toHaveLength(1);
  });
});
