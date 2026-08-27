import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  validateAdminPassword,
  verifyAdminSession,
} from "../server/founderAdminAuth";
import { buildResearchSummary } from "../server/founderOpsAnalytics";
import { trackFounderOps } from "../server/founderOpsApi";
import {
  getFounderOpsStore,
  MemoryFounderOpsStore,
} from "../server/founderOpsStore";
import {
  handleAdminExport,
  handleAdminLogout,
  handleAdminSubmission,
  handleAdminSubmissions,
  handleAdminSummary,
  type ApiResponse,
} from "../server/vercelFounderOps";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("founder operations storage", () => {
  it("creates one anonymous submission and persists stage updates and events", async () => {
    const store = new MemoryFounderOpsStore();
    const created = await trackFounderOps(
      {
        language: "en",
        serviceStorageConsent: true,
        eventType: "preview_started",
        patch: { currentStage: "preview_started" },
      },
      store
    );
    expect(created).toMatchObject({ ok: true, stored: true });
    expect(created.submissionId).toMatch(/^AMC-\d{8}-[A-F0-9]{8}$/);

    await trackFounderOps(
      {
        submissionId: created.submissionId,
        language: "en",
        serviceStorageConsent: true,
        eventType: "full_intake_started",
        patch: { currentStage: "full_intake_started" },
      },
      store
    );

    const detail = await store.getSubmission(created.submissionId!);
    expect(detail?.submission.currentStage).toBe("full_intake_started");
    expect(detail?.events.map(event => event.eventType)).toEqual([
      "preview_started",
      "full_intake_started",
    ]);
  });

  it("fails safely when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const result = await trackFounderOps(
      {
        language: "en",
        serviceStorageConsent: true,
        eventType: "preview_started",
      },
      getFounderOpsStore()
    );
    expect(result).toEqual({
      ok: true,
      stored: false,
      reason: "backend_unavailable",
    });
  });

  it("excludes research-consent false records from research analytics", async () => {
    const store = new MemoryFounderOpsStore();
    const included = await store.createSubmission("en", true);
    const excluded = await store.createSubmission("ko", true);
    await store.updateSubmission(included.submissionId, {
      researchUseConsent: true,
      caseType: "Entrepreneurship",
    });
    await store.updateSubmission(excluded.submissionId, {
      researchUseConsent: false,
      caseType: "Overseas Relocation",
    });
    const summary = buildResearchSummary(
      await store.listSubmissions(),
      store.events
    );
    expect(summary.totals.submissions).toBe(1);
    expect(summary.caseTypeDistribution).toEqual({ Entrepreneurship: 1 });
    expect(summary.languageDistribution).toEqual({ EN: 1 });
  });
});

describe("founder admin security", () => {
  it("validates the configured password and signed expiring session", () => {
    vi.stubEnv("AMC_ADMIN_PASSWORD", "test-password-value");
    vi.stubEnv(
      "AMC_ADMIN_SESSION_SECRET",
      "test-session-secret-value-with-length"
    );
    expect(validateAdminPassword("wrong")).toBe(false);
    expect(validateAdminPassword("test-password-value")).toBe(true);
    const token = createAdminSession(1_000_000);
    expect(token).toBeTruthy();
    expect(verifyAdminSession(token!, 1_000_000)).toBe(true);
    expect(verifyAdminSession(`${token}x`, 1_000_000)).toBe(false);
    expect(verifyAdminSession(token!, 1_000_000 + 9 * 60 * 60 * 1000)).toBe(
      false
    );
  });

  it("rejects unauthenticated admin analytics and CSV export", async () => {
    const summary = responseRecorder();
    const csv = responseRecorder();
    const logout = responseRecorder();
    await handleAdminSummary({ method: "GET", headers: {} }, summary.response);
    await handleAdminExport({ method: "GET", headers: {} }, csv.response);
    await handleAdminLogout({ method: "POST", headers: {} }, logout.response);
    expect(summary.statusCode).toBe(401);
    expect(csv.statusCode).toBe(401);
    expect(logout.statusCode).toBe(401);
    expect(summary.body).toEqual({ ok: false, error: "Unauthorized" });
    expect(csv.headers["Content-Type"]).toBeUndefined();
  });

  it("serves authenticated metrics, list, detail, and protected CSV modes", async () => {
    vi.stubEnv(
      "AMC_ADMIN_SESSION_SECRET",
      "test-session-secret-value-with-length"
    );
    const token = createAdminSession();
    const headers = { cookie: `${ADMIN_COOKIE_NAME}=${token}` };
    const store = new MemoryFounderOpsStore();
    const submission = await store.createSubmission("en", true);
    await store.updateSubmission(submission.submissionId, {
      researchUseConsent: true,
      caseType: "Entrepreneurship",
      answersJson: { "1": "A bounded test answer" },
      currentStage: "report_generated",
      reportGeneratedAt: new Date().toISOString(),
    });
    await store.addEvent(submission.submissionId, "dashboard_generated");

    const summary = responseRecorder();
    const research = responseRecorder();
    const list = responseRecorder();
    const detail = responseRecorder();
    const summaryCsv = responseRecorder();
    const fullCsv = responseRecorder();
    await handleAdminSummary(
      { method: "GET", headers, query: {} },
      summary.response,
      store
    );
    await handleAdminSummary(
      { method: "GET", headers, query: { mode: "research" } },
      research.response,
      store
    );
    await handleAdminSubmissions(
      { method: "GET", headers, query: {} },
      list.response,
      store
    );
    await handleAdminSubmission(
      { method: "GET", headers, query: { id: submission.submissionId } },
      detail.response,
      store
    );
    await handleAdminExport(
      { method: "GET", headers, query: { mode: "summary" } },
      summaryCsv.response,
      store
    );
    await handleAdminExport(
      { method: "GET", headers, query: { mode: "full" } },
      fullCsv.response,
      store
    );

    expect(summary.body).toMatchObject({
      backendAvailable: true,
      totals: { submissions: 1, reportsGenerated: 1 },
    });
    expect(research.body).toMatchObject({
      backendAvailable: true,
      totals: { submissions: 1 },
    });
    expect(list.body).toMatchObject({
      backendAvailable: true,
      submissions: [{ submissionId: submission.submissionId }],
    });
    expect(detail.body).toMatchObject({
      submission: { submissionId: submission.submissionId },
    });
    expect(String(summaryCsv.body)).not.toContain("A bounded test answer");
    expect(String(fullCsv.body)).toContain("A bounded test answer");
    expect(summaryCsv.headers["Content-Type"]).toContain("text/csv");
  });
});

function responseRecorder() {
  const recorder: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
    response: ApiResponse;
  } = {
    statusCode: 200,
    body: undefined,
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
    send(body) {
      recorder.body = body;
    },
    end() {},
    setHeader(name, value) {
      recorder.headers[name] = value;
    },
  };
  return recorder;
}
