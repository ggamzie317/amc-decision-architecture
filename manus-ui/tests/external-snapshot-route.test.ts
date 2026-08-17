import { afterEach, describe, expect, it, vi } from "vitest";

import { handleExternalSnapshot } from "../api/amc/external-snapshot";
import {
  resolveWebExternalSnapshot,
  type WebExternalSnapshotRequest,
} from "../server/externalSnapshotService";

const validRequest: WebExternalSnapshotRequest = {
  caseType: "Entrepreneurship",
  optionA: "Remain in a stable corporate role",
  optionB: "Test a small advisory practice",
  currentDecision: "Whether to test a small business while preserving career stability",
  externalPressure: "Changing demand for specialized professional services",
  validationNeed: "Validate real customer willingness to pay",
  language: "en",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("external snapshot Vercel route", () => {
  it("keeps GET and OPTIONS independent from service loading", async () => {
    const failingLoader = async () => {
      throw new Error("load failed");
    };
    const getResponse = responseRecorder();
    const optionsResponse = responseRecorder();

    await handleExternalSnapshot({ method: "GET" }, getResponse.response, failingLoader);
    await handleExternalSnapshot({ method: "OPTIONS" }, optionsResponse.response, failingLoader);

    expect(getResponse.statusCode).toBe(405);
    expect(getResponse.body).toEqual({ error: "Method not allowed." });
    expect(optionsResponse.statusCode).toBe(204);
    expect(optionsResponse.ended).toBe(true);
  });

  it("returns malformed_request before attempting to load the service", async () => {
    const failingLoader = async () => {
      throw new Error("load failed");
    };
    const recorder = responseRecorder();

    await handleExternalSnapshot(
      { method: "POST", body: { language: "en" } },
      recorder.response,
      failingLoader,
    );

    expect(recorder.statusCode).toBe(400);
    expect(recorder.body).toMatchObject({
      status: "fallback",
      confidence: "low",
      reasonCode: "malformed_request",
    });
  });

  it("returns service_load_error for a valid request when the service cannot load", async () => {
    const recorder = responseRecorder();

    await handleExternalSnapshot(
      { method: "POST", body: validRequest },
      recorder.response,
      async () => {
        throw new Error("load failed");
      },
    );

    expect(recorder.statusCode).toBe(200);
    expect(recorder.body).toMatchObject({
      status: "fallback",
      confidence: "low",
      reasonCode: "service_load_error",
    });
  });

  it("returns provider_not_configured when no provider key is available", async () => {
    vi.stubEnv("PERPLEXITY_API_KEY", "");
    vi.stubEnv("PPLX_API_KEY", "");
    const recorder = responseRecorder();

    await handleExternalSnapshot({ method: "POST", body: validRequest }, recorder.response);

    expect(recorder.statusCode).toBe(200);
    expect(recorder.body).toMatchObject({
      status: "fallback",
      confidence: "low",
      reasonCode: "provider_not_configured",
    });
  });

  it("returns provider_failure when the provider request fails", async () => {
    const snapshot = await resolveWebExternalSnapshot(validRequest, {
      apiKey: "non-secret-test-placeholder",
      fetchImpl: (async () => new Response(null, { status: 503 })) as typeof fetch,
    });

    expect(snapshot).toMatchObject({
      status: "fallback",
      confidence: "low",
      reasonCode: "provider_failure",
    });
  });
});

function responseRecorder() {
  const recorder: {
    statusCode: number;
    body: unknown;
    ended: boolean;
    headers: Record<string, string>;
    response: {
      status(code: number): typeof recorder.response;
      json(body: unknown): void;
      end(): void;
      setHeader(name: string, value: string): void;
    };
  } = {
    statusCode: 200,
    body: undefined,
    ended: false,
    headers: {},
    response: undefined as never,
  };

  recorder.response = {
    status(code) {
      recorder.statusCode = code;
      return recorder.response;
    },
    json(body) {
      recorder.body = body;
    },
    end() {
      recorder.ended = true;
    },
    setHeader(name, value) {
      recorder.headers[name] = value;
    },
  };

  return recorder;
}
