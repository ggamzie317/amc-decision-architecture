import {
  ADMIN_COOKIE_NAME,
  adminAuthConfigured,
  adminSessionCookie,
  clearedAdminSessionCookie,
  createAdminSession,
  readCookie,
  validateAdminPassword,
  verifyAdminSession,
} from "./founderAdminAuth";
import {
  buildSubmissionsCsv,
  founderSummary,
  parseSubmissionFilters,
  trackFounderOps,
} from "./founderOpsApi";
import { sendFounderReportNotification } from "./founderNotification";
import { getFounderOpsStore } from "./founderOpsStore";
import type { SubmissionPatch } from "./founderOpsTypes";
import type { FounderOpsStore } from "./founderOpsTypes";

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
      void sendFounderReportNotification(
        result.submissionId,
        (body.patch || {}) as SubmissionPatch
      ).catch(() => undefined);
    }
  } catch {
    res
      .status(200)
      .json({ ok: true, stored: false, reason: "storage_unavailable" });
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
    res.status(200).json(await founderSummary(store, window, research));
  } catch {
    res.status(200).json({ backendAvailable: false });
  }
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
    const submissions = await store.listSubmissions(
      parseSubmissionFilters(req.query || {}),
      500
    );
    res.status(200).json({ backendAvailable: true, submissions });
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
  const detail = await store.getSubmission(id);
  if (!detail) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  res.status(200).json(detail);
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
  const full = req.query?.mode === "full";
  const rows = await store.listSubmissions(
    parseSubmissionFilters(req.query || {}),
    10_000
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="amc-${full ? "full-responses" : "summary"}.csv"`
  );
  const csv = buildSubmissionsCsv(rows, full);
  res.status(200).send(csv);
}

export const requireAdminSession = requireAdmin;
