import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EXTERNAL_SNAPSHOT_RETIRED, handleExternalSnapshot } from "../api/amc/external-snapshot";
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

const root = path.resolve(import.meta.dirname, "..");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// Owner decision 2026-10-16: the legacy route is retired and refuses every call.
describe("retired external snapshot route", () => {
  it.each([
    ["POST with a valid request", { method: "POST", body: validRequest }],
    ["POST with a malformed request", { method: "POST", body: { language: "en" } }],
    ["GET", { method: "GET" }],
  ])("refuses %s with 410 and makes no provider request", async (_label, request) => {
    vi.stubEnv("PERPLEXITY_API_KEY", "non-secret-test-placeholder");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const recorder = responseRecorder();

    await handleExternalSnapshot(request, recorder.response);

    expect(recorder.statusCode).toBe(410);
    expect(recorder.body).toEqual(EXTERNAL_SNAPSHOT_RETIRED);
    expect(recorder.headers["Cache-Control"]).toBe("no-store");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not load the search service or echo the request", () => {
    const source = fs.readFileSync(path.join(root, "api/amc/external-snapshot.ts"), "utf8");
    expect(source).not.toContain("externalSnapshotService");
    expect(source).not.toContain("req.body");
  });

  it("the Express route uses the same refusal", () => {
    const source = fs.readFileSync(path.join(root, "server/index.ts"), "utf8");
    expect(source).toContain('app.all("/api/amc/external-snapshot"');
    expect(source).not.toContain("resolveWebExternalSnapshot");
  });
});

// The service module itself is unchanged (still used by local QA scripts).
describe("external snapshot service", () => {
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

describe("retired legacy pages", () => {
  it("redirects /amc-web-mvp and its old aliases to V2 on the server", () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8")) as {
      redirects: Array<{ source: string; destination: string; permanent: boolean }>;
    };
    const sources = config.redirects
      .filter(r => r.destination === "/amc-interactive-v2" && r.permanent === false)
      .map(r => r.source);
    expect(sources).toEqual(
      expect.arrayContaining(["/amc-web-mvp", "/intake", "/format-handoff", "/payment-handoff", "/payment-success"]),
    );
  });

  it("redirects the same paths to V2 in the client router", () => {
    const app = fs.readFileSync(path.join(root, "client/src/App.tsx"), "utf8");
    expect(app).toContain('<Route path={"/amc-web-mvp"} component={LegacyProductRedirect} />');
    expect(app).not.toContain("component={AmcWebMvp}");
    expect(app).toContain("<Redirect to={`/amc-interactive-v2${");
    expect(app).not.toContain('<Redirect to="/amc-web-mvp"');
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
