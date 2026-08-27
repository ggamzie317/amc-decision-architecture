import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "amc_founder_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function env(name: string) {
  return String(process.env[name] || "").trim();
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function adminAuthConfigured() {
  return Boolean(env("AMC_ADMIN_PASSWORD") && env("AMC_ADMIN_SESSION_SECRET"));
}

export function validateAdminPassword(password: string) {
  const configured = env("AMC_ADMIN_PASSWORD");
  return Boolean(configured) && safeEqual(password, configured);
}

export function createAdminSession(now = Date.now()) {
  const secret = env("AMC_ADMIN_SESSION_SECRET");
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_DURATION_SECONDS })
  ).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAdminSession(token: string, now = Date.now()) {
  const secret = env("AMC_ADMIN_SESSION_SECRET");
  if (!secret || !token.includes(".")) return false;
  const [payload, providedSignature] = token.split(".", 2);
  if (!safeEqual(providedSignature, signature(payload, secret))) return false;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: unknown };
    return (
      typeof decoded.exp === "number" && decoded.exp > Math.floor(now / 1000)
    );
  } catch {
    return false;
  }
}

export function readCookie(
  cookieHeader: string | undefined,
  name = ADMIN_COOKIE_NAME
) {
  for (const part of String(cookieHeader || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

export function adminSessionCookie(token: string, secure: boolean) {
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearedAdminSessionCookie(secure: boolean) {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
}
