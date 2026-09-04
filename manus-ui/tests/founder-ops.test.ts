import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";

import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  validateAdminPassword,
  verifyAdminSession,
} from "../server/founderAdminAuth";
import { buildResearchSummary } from "../server/founderOpsAnalytics";
import { trackFounderOps } from "../server/founderOpsApi";
import { inspectFounderOpsDatabase } from "../server/founderOpsHealth";
import {
  getFounderOpsStore,
  MemoryFounderOpsStore,
} from "../server/founderOpsStore";
import {
  handleAdminExport,
  handleAdminHealth,
  handleAdminLogout,
  handleAdminSubmission,
  handleAdminSubmissions,
  handleAdminSummary,
  handleTrack,
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
    expect(detail?.submission.productVersion).toBe("AMC-LAUNCH-V3");
    expect(detail?.submission.frameworkVersion).toBe("FIFWM-SM-V2");
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

  it("reports a missing DATABASE_URL without exposing connection details", async () => {
    const result = await inspectFounderOpsDatabase("");
    expect(result).toEqual({
      database: "not_configured",
      schema: "missing_migration",
      submissionStorage: "unavailable",
      usageEvents: "unavailable",
      missing: ["submissions", "usage_events"],
    });
    expect(JSON.stringify(result)).not.toContain("DATABASE_URL");
  });

  it("keeps the public tracking route non-blocking when the database fails", async () => {
    const response = responseRecorder();
    const store = {
      available: true,
      createSubmission: vi
        .fn()
        .mockRejectedValue(new Error("connection detail")),
      updateSubmission: vi.fn(),
      addEvent: vi.fn(),
      listSubmissions: vi.fn(),
      getSubmission: vi.fn(),
    };
    await handleTrack(
      {
        method: "POST",
        body: {
          language: "en",
          serviceStorageConsent: true,
          eventType: "preview_started",
        },
      },
      response.response,
      store
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      stored: false,
      reason: "storage_unavailable",
    });
    expect(JSON.stringify(response.body)).not.toContain("connection detail");
  });

  it("keeps the bootstrap migration non-destructive and repeatable", async () => {
    const sql = await readFile(
      new URL("../db/001_amc_founder_ops.sql", import.meta.url),
      "utf8"
    );
    expect(sql.match(/CREATE TABLE IF NOT EXISTS/g)).toHaveLength(2);
    expect(sql.match(/CREATE INDEX IF NOT EXISTS/g)?.length).toBeGreaterThan(0);
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|DELETE\s+FROM)\b/i);
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
    const health = responseRecorder();
    await handleAdminSummary({ method: "GET", headers: {} }, summary.response);
    await handleAdminExport({ method: "GET", headers: {} }, csv.response);
    await handleAdminLogout({ method: "POST", headers: {} }, logout.response);
    await handleAdminHealth({ method: "GET", headers: {} }, health.response);
    expect(summary.statusCode).toBe(401);
    expect(csv.statusCode).toBe(401);
    expect(logout.statusCode).toBe(401);
    expect(health.statusCode).toBe(401);
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
      answersJson: { "1": '한국어, comma\n"quoted" answer' },
      missingPoint: '검증, "인용"\n줄',
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
    expect(String(summaryCsv.body)).not.toContain("한국어");
    expect(String(fullCsv.body)).toContain("한국어, comma");
    expect(String(summaryCsv.body)).toContain('""인용""');
    expect(String(fullCsv.body).charCodeAt(0)).toBe(0xfeff);
    expect(summaryCsv.headers["Content-Type"]).toContain("text/csv");
  });

  it("returns authenticated health and data-quality indicators", async () => {
    vi.stubEnv(
      "AMC_ADMIN_SESSION_SECRET",
      "test-session-secret-value-with-length"
    );
    vi.stubEnv("AMC_ADMIN_PASSWORD", "test-password-value");
    const token = createAdminSession();
    const store = new MemoryFounderOpsStore();
    const submission = await store.createSubmission("ko", true);
    await store.updateSubmission(submission.submissionId, {
      researchUseConsent: true,
      fullIntakeCompletedAt: new Date().toISOString(),
      answersJson: Object.fromEntries(
        Array.from({ length: 29 }, (_, index) => [
          String(index + 1),
          `답변 ${index + 1}`,
        ])
      ),
      structuralOutputJson: { saved: true },
      safetyMarginStructuredData: { band: "moderate" },
      externalEvidenceJson: { status: "live" },
      missingPoint: "검증 지점",
      alternativePath: "",
      decisionConditionsJson: ["조건"],
    });
    const response = responseRecorder();
    await handleAdminHealth(
      {
        method: "GET",
        headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      },
      response.response,
      store,
      {
        database: "connected",
        schema: "ready",
        submissionStorage: "ready",
        usageEvents: "ready",
        missing: [],
      }
    );
    expect(response.body).toMatchObject({
      database: "connected",
      schema: "ready",
      adminSession: "ready",
      dataQuality: {
        totalSubmissions: 1,
        completeFullIntake: 1,
        structuralOutputSaved: 1,
        safetyMarginSaved: 1,
        externalEvidenceSaved: 1,
        missingPointSaved: 1,
        alternativePathStateSaved: 1,
        decisionConditionsSaved: 1,
        researchConsentRate: 100,
      },
    });
  });

  it("returns a clean admin error when an available database becomes unreachable", async () => {
    vi.stubEnv(
      "AMC_ADMIN_SESSION_SECRET",
      "test-session-secret-value-with-length"
    );
    const token = createAdminSession();
    const store = {
      available: true,
      createSubmission: vi.fn(),
      updateSubmission: vi.fn(),
      addEvent: vi.fn(),
      listSubmissions: vi
        .fn()
        .mockRejectedValue(new Error("sensitive host detail")),
      getSubmission: vi
        .fn()
        .mockRejectedValue(new Error("sensitive host detail")),
    };
    const csv = responseRecorder();
    await handleAdminExport(
      {
        method: "GET",
        headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
        query: { mode: "summary" },
      },
      csv.response,
      store
    );
    expect(csv.statusCode).toBe(503);
    expect(csv.body).toEqual({ error: "Data backend unavailable" });
    expect(JSON.stringify(csv.body)).not.toContain("sensitive host detail");
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
