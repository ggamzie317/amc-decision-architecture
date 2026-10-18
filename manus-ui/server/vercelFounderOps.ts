import { isInteractive, projectInteractivePatch, projectInteractiveMetadata } from "../shared/interactivePrivacy.js";
import { sanitizeSimulatorMetadata } from "./simulatorAnalytics.js";
import { buildLaunchOpsSummary, providerCallsLast24h } from "./launchOpsAnalytics.js";
import { configuredV2AgentPreset } from "./externalIntelligenceV2Service.js";
import {
  excludeTestsRequested,
  filterTestRecords,
  isTestRecord,
} from "./testRecords.js";
import {
  ADMIN_COOKIE_NAME,
  adminAuthConfigured,
  adminSessionCookie,
  clearedAdminSessionCookie,
  createAdminSession,
  readCookie,
  validateAdminPassword,
  verifyAdminSession,
} from "./founderAdminAuth.js";
import {
  buildSubmissionsCsv,
  founderSummary,
  parseSubmissionFilters,
  trackFounderOps,
} from "./founderOpsApi.js";
import { sendFounderReportNotification } from "./founderNotification.js";
import { founderHealth, type DatabaseInspection } from "./founderOpsHealth.js";
import { getFounderOpsStore, perplexityDailyLimit } from "./founderOpsStore.js";
import { isProviderCallEvent, type SubmissionPatch } from "./founderOpsTypes.js";
import type { FounderOpsStore } from "./founderOpsTypes.js";

export type ApiRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  send(body: string): void;
  end(): void;
  setHeader(name: string, value: string): void;
};

function bodyRecord(req: ApiRequest) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
}

function cookieHeader(req: ApiRequest) {
  const value = req.headers?.cookie;
  return Array.isArray(value) ? value.join("; ") : value;
}

function secureRequest(req: ApiRequest) {
  const forwarded = req.headers?.["x-forwarded-proto"];
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded) === "https" ||
    process.env.NODE_ENV === "production"
  );
}

function requireAdmin(req: ApiRequest, res: ApiResponse) {
  const token = readCookie(cookieHeader(req), ADMIN_COOKIE_NAME);
  if (verifyAdminSession(token)) return true;
  res.status(401).json({ ok: false, error: "Unauthorized" });
  return false;
}

function method(req: ApiRequest, res: ApiResponse, allowed: string[]) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }
  if (!allowed.includes(req.method || "")) {
    res.status(405).json({ error: "Method not allowed." });
    return false;
  }
  return true;
}

/** Classify known SQL failures without exposing statements, values or messages. */
export function trackingStorageFailure(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: unknown; constraint_name?: unknown };
  if (value.code === "23514" && value.constraint_name === "usage_events_event_type_check")
    return "event_contract" as const;
  if (value.code === "42P01" || value.code === "42703") return "schema_missing" as const;
  if (typeof value.code === "string" && ["23502", "23503", "23505", "23514"].includes(value.code))
    return "schema_constraint" as const;
  return undefined;
}

export async function handleTrack(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore()
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["POST"])) return;
  try {
    const body = bodyRecord(req);
    const result = await trackFounderOps(body, store);
    res.status(result.ok ? 200 : 400).json(result);
    if (
      result.stored &&
      body.eventType === "dashboard_generated" &&
      result.submissionId
    ) {
      const id = result.submissionId;
      void (async () => {
        const stored = (await store.getSubmission(id))?.submission;
        await sendFounderReportNotification(id,
          (isInteractive(stored?.structuralOutputJson) ? projectInteractivePatch(stored) : body.patch || {}) as SubmissionPatch);
      })().catch(() => undefined);
    }
  } catch (error) {
    const failureCode = trackingStorageFailure(error);
    res
      .status(200)
      .json({ ok: true, stored: false, reason: "storage_unavailable",
        ...(failureCode ? { failureCode } : {}) });
  }
}

export async function handleAdminLogin(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["POST"])) return;
  if (!adminAuthConfigured()) {
    res
      .status(503)
      .json({ ok: false, error: "Admin authentication not configured" });
    return;
  }
  const password = bodyRecord(req).password;
  if (
    typeof password !== "string" ||
    password.length > 256 ||
    !validateAdminPassword(password)
  ) {
    res.status(401).json({ ok: false, error: "Invalid password" });
    return;
  }
  const token = createAdminSession();
  if (!token) {
    res
      .status(503)
      .json({ ok: false, error: "Admin authentication not configured" });
    return;
  }
  res.setHeader("Set-Cookie", adminSessionCookie(token, secureRequest(req)));
  res
    .status(200)
    .json({ ok: true, backendAvailable: getFounderOpsStore().available });
}

export async function handleAdminLogout(req: ApiRequest, res: ApiResponse) {
  if (!method(req, res, ["POST"]) || !requireAdmin(req, res)) return;
  res.setHeader("Set-Cookie", clearedAdminSessionCookie(secureRequest(req)));
  res.status(200).json({ ok: true });
}

export async function handleAdminSummary(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore()
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["GET"]) || !requireAdmin(req, res)) return;
  try {
    const window =
      req.query?.window === "7" ? 7 : req.query?.window === "30" ? 30 : null;
    const research = req.query?.mode === "research";
    res
      .status(200)
      .json(
        await founderSummary(
          store,
          window,
          research,
          excludeTestsRequested(req.query)
        )
      );
  } catch {
    res.status(200).json({ backendAvailable: false });
  }
}

export async function handleAdminHealth(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore(),
  inspection?: DatabaseInspection
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["GET"]) || !requireAdmin(req, res)) return;
  res.status(200).json(await founderHealth(store, inspection));
}

export async function handleAdminSubmissions(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore()
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["GET"]) || !requireAdmin(req, res)) return;
  if (!store.available) {
    res.status(200).json({ backendAvailable: false, submissions: [] });
    return;
  }
  try {
    const { submissions, testRecords } = filterTestRecords(
      await store.listSubmissions(parseSubmissionFilters(req.query || {}), 500),
      [],
      excludeTestsRequested(req.query)
    );
    // Overview responses carry metadata only. Raw answers and derived narratives
    // remain behind the explicit authenticated detail/export actions.
    res.status(200).json({
      backendAvailable: true,
      testRecords,
      submissions: submissions.map(row => ({
        submissionId: row.submissionId,
        isTest: isTestRecord(row),
        createdAt: row.createdAt,
        language: row.language,
        caseType: row.caseType,
        currentStage: row.currentStage,
        fullIntakeCompletedAt: row.fullIntakeCompletedAt,
        externalEvidenceMode: row.externalEvidenceMode,
        externalEvidenceConfidence: row.externalEvidenceConfidence,
        reportGeneratedAt: row.reportGeneratedAt,
        printSaveClickedAt: row.printSaveClickedAt,
        researchUseConsent: row.researchUseConsent,
      })),
    });
  } catch {
    res.status(200).json({ backendAvailable: false, submissions: [] });
  }
}

export async function handleAdminSubmission(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore()
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["GET"]) || !requireAdmin(req, res)) return;
  const id = typeof req.query?.id === "string" ? req.query.id : "";
  if (!/^AMC-\d{8}-[A-F0-9]{8}$/.test(id)) {
    res.status(400).json({ error: "Invalid submission ID" });
    return;
  }
  if (!store.available) {
    res.status(503).json({ error: "Data backend not configured" });
    return;
  }
  try {
    const detail = await store.getSubmission(id);
    if (!detail) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    const isTest = isTestRecord(detail.submission);
    res.status(200).json(isInteractive(detail.submission.structuralOutputJson) ? {
      submission: {...detail.submission, ...projectInteractivePatch(detail.submission)},
      // Perplexity allowance rows are provider calls, not journey actions.
      events: detail.events.filter(e => !isProviderCallEvent(e)).map(e => ({...e, metadataJson:{...projectInteractiveMetadata(e.metadataJson),...sanitizeSimulatorMetadata(e.metadataJson)}})),
      isTest,
    } : { ...detail, events: detail.events.filter(e => !isProviderCallEvent(e)), isTest });
  } catch {
    res.status(503).json({ error: "Data backend unavailable" });
  }
}

export async function handleAdminExport(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore()
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["GET"]) || !requireAdmin(req, res)) return;
  if (!store.available) {
    res.status(503).json({ error: "Data backend not configured" });
    return;
  }
  try {
    const full = req.query?.mode === "full";
    const { submissions: rows } = filterTestRecords(
      await store.listSubmissions(parseSubmissionFilters(req.query || {}), 10_000),
      [],
      excludeTestsRequested(req.query)
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="amc-${full ? "full-responses-sensitive" : "summary"}.csv"`
    );
    const csv = buildSubmissionsCsv(rows, full);
    res.status(200).send(csv);
  } catch {
    res.status(503).json({ error: "Data backend unavailable" });
  }
}

export const requireAdminSession = requireAdmin;

export async function handleAdminLaunchOps(
  req: ApiRequest,
  res: ApiResponse,
  store: FounderOpsStore = getFounderOpsStore()
) {
  res.setHeader("Cache-Control", "no-store");
  if (!method(req, res, ["GET"]) || !requireAdmin(req, res)) return;
  const configuration = {
    provider: "Perplexity Agent API",
    // The live search route is V2; the retired legacy route's preset
    // (PERPLEXITY_AGENT_PRESET) no longer describes production searches.
    preset: configuredV2AgentPreset(),
    presetLabel: "V2 search preset",
    launchMode: "FREE PUBLIC",
    ...(process.env.VERCEL_ENV === "production" &&
    /^[a-f0-9]{40}$/.test(process.env.VERCEL_GIT_COMMIT_SHA ?? "")
      ? { productionSha: process.env.VERCEL_GIT_COMMIT_SHA }
      : {}),
  };
  if (!store.available || !store.readLaunchData) {
    res.status(200).json({ backendAvailable: false, configuration });
    return;
  }
  try {
    const data = await store.readLaunchData();
    const windowDays =
      req.query?.window === "7" ? 7 : req.query?.window === "30" ? 30 : null;
    const { submissions, events, testRecords } = filterTestRecords(
      data.submissions,
      data.events,
      excludeTestsRequested(req.query)
    );
    res
      .status(200)
      .json({
        // Allowance use is service-wide, so it is counted before test filtering.
        ...buildLaunchOpsSummary(submissions, events, windowDays, new Date(), {
          callsLast24h: providerCallsLast24h(data.events),
          dailyLimit: perplexityDailyLimit(),
        }),
        testRecords,
        configuration,
      });
  } catch {
    res.status(200).json({ backendAvailable: false, configuration });
  }
}
