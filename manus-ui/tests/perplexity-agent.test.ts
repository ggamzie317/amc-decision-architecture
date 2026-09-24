import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeAgentResponse,
  resolveWebExternalSnapshot,
  type WebExternalSnapshotRequest,
} from "../server/externalSnapshotService";

const request: WebExternalSnapshotRequest = {
  caseType: "Entrepreneurship",
  optionA: "Keep role",
  optionB: "Test business",
  currentDecision: "Test demand while keeping income",
  externalPressure: "Buyer demand",
  validationNeed: "Paid demand",
  language: "en",
};
const content = (language = "en") => ({
  confidence: "medium",
  externalSignals: Array.from({ length: 3 }, (_, i) => ({
    label: `Context ${i}`,
    direction: "mixed",
    reading:
      language === "kr"
        ? "수요와 진입 조건은 추가 확인이 필요합니다."
        : "Demand and entry conditions need further validation.",
  })),
  sourceNotes: [
    {
      sourceLabel: "Official labor statistics",
      sourceUrl: "https://www.bls.gov/",
      note: "Occupational data provides general context, not proof of individual demand.",
      evidenceType: "market",
    },
  ],
  uncertaintyNotes: ["Individual buyer demand has not been validated."],
  implication: "Test relevant demand before increasing exposure.",
});
const envelope = (raw: unknown = content()) => ({
  object: "response",
  status: "completed",
  error: null,
  output: [
    {
      type: "search_results",
      results: [
        {
          id: 1,
          title: "Labor statistics",
          url: "https://www.bls.gov/",
          snippet: "Occupational data",
        },
      ],
    },
    { type: "reasoning", content: "not customer content" },
    {
      type: "message",
      role: "assistant",
      status: "completed",
      content: [
        { type: "output_text", text: JSON.stringify(raw), annotations: [] },
      ],
    },
  ],
});
const fetchResponse = (value: unknown) =>
  vi.fn(async () => Response.json(value)) as unknown as typeof fetch;
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("Perplexity Agent API boundary", () => {
  it.each(["en", "kr"] as const)(
    "uses the official Agent contract and normalizes %s",
    async language => {
      let sent: Record<string, any> = {};
      const observe = vi.fn();
      const fetchImpl = vi.fn(async (url, init) => {
        expect(url).toBe("https://api.perplexity.ai/v1/agent");
        expect(init.headers.Authorization).toBe("Bearer test-key");
        sent = JSON.parse(init.body);
        return Response.json(envelope(content(language)));
      }) as unknown as typeof fetch;
      const result = await resolveWebExternalSnapshot(
        { ...request, language },
        { apiKey: "test-key", fetchImpl, observe }
      );
      expect(sent).toMatchObject({
        preset: "fast",
        max_steps: 1,
        max_output_tokens: 2500,
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: { name: "AmcWebExternalSnapshot", strict: true },
        },
      });
      expect(sent).not.toHaveProperty("model");
      expect(sent).not.toHaveProperty("messages");
      expect(sent.input.every((item: any) => item.type === "message")).toBe(
        true
      );
      expect(sent.input[1].content).toContain(
        language === "kr" ? "professional Korean" : "professional English"
      );
      expect(result).toMatchObject({
        status: "live",
        reasonCode: "live",
        confidence: "medium",
      });
      expect(result.externalSignals).toHaveLength(3);
      expect(result.sourceNotes[0]).not.toHaveProperty("sourceUrl");
      expect(Object.keys(result).sort()).toEqual(
        [
          "status",
          "confidence",
          "reasonCode",
          "generatedAtLabel",
          "externalSignals",
          "sourceNotes",
          "uncertaintyNotes",
          "implication",
        ].sort()
      );
      expect(result.externalSignals[0].reading).toBe(
        content(language).externalSignals[0].reading
      );
      expect(observe).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "perplexity",
          apiGeneration: "agent-api",
          preset: "fast",
          status: "live",
          reasonCode: "live",
          latencyMs: expect.any(Number),
          timedOut: false,
        })
      );
      expect(JSON.stringify(observe.mock.calls)).not.toContain("test-key");
    }
  );
  it.each([
    null,
    {},
    { choices: [{ message: { content: JSON.stringify(content()) } }] },
    { ...envelope(), status: "incomplete" },
    { ...envelope(), error: { message: "secret provider error" } },
    { ...envelope(), output: [] },
    { ...envelope(), output: [envelope().output[2]] },
    envelope({ ...content(), confidence: "certain" }),
    envelope({
      ...content(),
      externalSignals: content().externalSignals.slice(0, 2),
    }),
    envelope({
      ...content(),
      externalSignals: [
        ...content().externalSignals,
        { label: "bad", direction: "unsafe", reading: "Bad" },
      ],
    }),
    envelope({ ...content(), sourceNotes: [] }),
    envelope({ ...content(), uncertaintyNotes: [] }),
    envelope({ ...content(), implication: "" }),
    envelope({
      ...content(),
      sourceNotes: [
        { ...content().sourceNotes[0], sourceUrl: "https://invented.example/" },
      ],
    }),
    envelope({
      ...content(),
      sourceNotes: [{ ...content().sourceNotes[0], evidenceType: "invented" }],
    }),
    envelope({ ...content(), uncertaintyNotes: [1] }),
  ])("rejects malformed/incomplete/ungrounded output %#", raw => {
    const result = normalizeAgentResponse(raw, "en");
    expect(result).toMatchObject({
      status: "fallback",
      confidence: "low",
      reasonCode: "invalid_provider_response",
    });
    expect(JSON.stringify(result)).not.toContain("secret provider error");
  });
  it("rejects malformed JSON, refusals and unexpected final content", () => {
    for (const part of [
      { type: "output_text", text: "not JSON" },
      { type: "refusal", refusal: "No" },
      { type: "output_text", text: null },
    ]) {
      const raw = envelope();
      raw.output[2] = {
        type: "message",
        role: "assistant",
        status: "completed",
        content: [part],
      } as any;
      expect(normalizeAgentResponse(raw, "en").reasonCode).toBe(
        "invalid_provider_response"
      );
    }
  });
  it("handles HTTP and network failures without leaking details", async () => {
    for (const fetchImpl of [
      async () => new Response("PRIVATE", { status: 429 }),
      async () => {
        throw new Error("PRIVATE");
      },
    ]) {
      const result = await resolveWebExternalSnapshot(request, {
        apiKey: "x",
        fetchImpl: fetchImpl as typeof fetch,
        observe: () => {},
      });
      expect(result.reasonCode).toBe("provider_failure");
      expect(JSON.stringify(result)).not.toContain("PRIVATE");
    }
  });
  it("classifies invalid HTTP JSON as invalid response", async () => {
    const result = await resolveWebExternalSnapshot(request, {
      apiKey: "x",
      fetchImpl: (async () => new Response("bad")) as typeof fetch,
      observe: () => {},
    });
    expect(result.reasonCode).toBe("invalid_provider_response");
  });
  it("aborts timed-out requests and records sanitized timeout metadata", async () => {
    vi.useFakeTimers();
    const observe = vi.fn();
    const fetchImpl = ((_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("PRIVATE"))
        )
      )) as typeof fetch;
    const pending = resolveWebExternalSnapshot(request, {
      apiKey: "x",
      fetchImpl,
      timeoutMs: 50,
      observe,
    });
    await vi.advanceTimersByTimeAsync(51);
    expect((await pending).reasonCode).toBe("provider_failure");
    expect(observe).toHaveBeenCalledWith(
      expect.objectContaining({ timedOut: true, status: "fallback" })
    );
  });
  it("does not call the provider without a key and ignores the legacy model config", async () => {
    vi.stubEnv("PERPLEXITY_API_KEY", "");
    vi.stubEnv("PPLX_API_KEY", "");
    vi.stubEnv("PERPLEXITY_MODEL", "sonar-pro");
    const fetchImpl = vi.fn();
    const result = await resolveWebExternalSnapshot(request, {
      fetchImpl,
      observe: () => {},
    });
    expect(result.reasonCode).toBe("provider_not_configured");
    expect(fetchImpl).not.toHaveBeenCalled();
    const liveFetch = fetchResponse(envelope());
    await resolveWebExternalSnapshot(request, {
      apiKey: "x",
      fetchImpl: liveFetch,
      observe: () => {},
    });
    expect(JSON.parse((liveFetch as any).mock.calls[0][1].body).preset).toBe(
      "fast"
    );
  });
  it("keeps fallback neutral after the existing normal-mode customer boundary", async () => {
    const fs = await import("node:fs");
    const page = fs.readFileSync(
      new URL("../client/src/pages/AmcWebMvp.tsx", import.meta.url),
      "utf8"
    );
    expect(page).toContain(
      'payload.status === "fallback" ? buildNeutralExternalSnapshot("fallback", language)'
    );
    expect(page).toContain(
      "externalSnapshot ?? (isQaMode ? mockExternalSnapshot : neutralExternalSnapshot)"
    );
    const result = await resolveWebExternalSnapshot(request, {
      apiKey: "",
      observe: () => {
        throw new Error("Telemetry down");
      },
    });
    expect(result.status).toBe("fallback");
    expect(result.status).not.toBe("mock");
    expect(result.implication).toContain(
      "does not determine the current posture"
    );
  });
  it("bounds telemetry persistence so a stalled store cannot block the customer result", async () => {
    vi.useFakeTimers();
    try {
      const pending = resolveWebExternalSnapshot(request, {
        apiKey: "",
        observe: () => new Promise(() => {}),
      });
      await vi.advanceTimersByTimeAsync(2000);
      expect((await pending).status).toBe("fallback");
    } finally {
      vi.useRealTimers();
    }
  });
});
