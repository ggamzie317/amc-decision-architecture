import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { z } from "zod";

const languageSchema = z.enum(["ko", "en", "zh"]);
const tierSchema = z.enum(["essential", "executive"]);

const emailHandoffSchema = z.object({
  submissionId: z.string().min(1),
  preparedAt: z.string().min(1),
  deliveryStatus: z.literal("prepared"),
  recipient: z.object({
    email: z.string().min(1),
    fullName: z.string().optional().default(""),
  }),
  tier: tierSchema,
  language: languageSchema,
  artifacts: z.object({
    reportDocxPath: z.string().min(1),
    reportPayloadPath: z.string().min(1),
  }),
  email: z.object({
    templateType: z.enum(["report_delivery_essential", "report_delivery_executive"]),
    subject: z.string().min(1),
    bodyText: z.string().min(1),
  }),
  followUp: z.object({
    reportLinkedWindowDays: z.union([z.literal(0), z.literal(7)]),
    mode: z.enum(["none", "bounded_report_linked_chat"]),
  }),
});

export type PreparedEmailHandoff = z.infer<typeof emailHandoffSchema>;

const receiptEmailHandoffSchema = z.object({
  submissionId: z.string().min(1),
  preparedAt: z.string().min(1),
  deliveryStatus: z.literal("prepared"),
  recipient: z.object({
    email: z.string().min(1),
    fullName: z.string().optional().default(""),
  }),
  tier: tierSchema,
  language: languageSchema,
  email: z.object({
    templateType: z.literal("submission_received_receipt"),
    subject: z.string().min(1),
    bodyText: z.string().min(1),
  }),
});

export type PreparedReceiptEmailHandoff = z.infer<typeof receiptEmailHandoffSchema>;

export type EmailDeliveryResult = {
  submissionId: string;
  attemptedAt: string;
  status: "sent" | "failed";
  transport: "sendmail";
  emailHandoffPath: string;
  messageId?: string;
  to: string;
  from?: string;
  language: "ko" | "en" | "zh";
  tier: "essential" | "executive";
  reportDocxPath: string;
  error?: string;
};

export type ReceiptEmailDeliveryResult = {
  submissionId: string;
  attemptedAt: string;
  status: "sent" | "failed";
  transport: "sendmail";
  receiptEmailHandoffPath: string;
  messageId?: string;
  to: string;
  from?: string;
  language: "ko" | "en" | "zh";
  tier: "essential" | "executive";
  error?: string;
};

function getEnv(name: string): string {
  return String(process.env[name] || "").trim();
}

function requireSendmailConfig(): {
  sendmailPath: string;
  from: string;
} {
  const sendmailPath = getEnv("AMC_SENDMAIL_PATH") || "/usr/sbin/sendmail";
  const from = getEnv("AMC_EMAIL_FROM");
  const missing = [!from ? "AMC_EMAIL_FROM" : ""].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Email sender configuration missing: ${missing.join(", ")}`);
  }
  if (!fs.existsSync(sendmailPath)) {
    throw new Error(`Sendmail binary not found: ${sendmailPath}`);
  }
  return { sendmailPath, from };
}

function encodeHeaderValue(text: string): string {
  const asciiOnly = /^[\x20-\x7E]*$/.test(text);
  if (asciiOnly) {
    return text;
  }
  const b64 = Buffer.from(text, "utf-8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function foldBase64(input: string): string {
  return input.replace(/.{1,76}/g, (chunk) => `${chunk}\r\n`).trimEnd();
}

function buildMimeMessage(params: {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  attachmentFilename: string;
  attachmentPath: string;
}): string {
  const boundary = `amc_boundary_${Date.now()}`;
  const safeSubject = encodeHeaderValue(params.subject);
  const bodyBase64 = foldBase64(Buffer.from(params.bodyText, "utf-8").toString("base64"));
  const attachmentBase64 = foldBase64(fs.readFileSync(params.attachmentPath).toString("base64"));

  return [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${safeSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
    "",
    `--${boundary}`,
    `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document; name="${params.attachmentFilename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${params.attachmentFilename}"`,
    "",
    attachmentBase64,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function buildPlainTextMessage(params: {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
}): string {
  const safeSubject = encodeHeaderValue(params.subject);
  const bodyBase64 = foldBase64(Buffer.from(params.bodyText, "utf-8").toString("base64"));
  return [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${safeSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
    "",
  ].join("\r\n");
}

function runSendmail(sendmailPath: string, message: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(sendmailPath, ["-t", "-i"]);
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (error) => {
      resolve({ ok: false, error: error.message });
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ ok: true });
        return;
      }
      resolve({ ok: false, error: stderr.trim() || `sendmail exited with code ${code}` });
    });
    proc.stdin.write(message);
    proc.stdin.end();
  });
}

export function resolveEmailHandoffPathFromSubmissionId(repoRoot: string, submissionId: string): string {
  const safe = submissionId.trim().replace(/[^a-zA-Z0-9._-]+/g, "_") || "submission";
  return path.resolve(repoRoot, "output", "submissions", safe, "email_handoff.json");
}

function writeDeliveryResult(resultPath: string, result: EmailDeliveryResult): void {
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
}

function writeReceiptDeliveryResult(resultPath: string, result: ReceiptEmailDeliveryResult): void {
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
}

export function loadPreparedEmailHandoff(emailHandoffPath: string): PreparedEmailHandoff {
  if (!fs.existsSync(emailHandoffPath)) {
    throw new Error(`email_handoff.json not found: ${emailHandoffPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(emailHandoffPath, "utf-8")) as unknown;
  return emailHandoffSchema.parse(raw);
}

export function loadPreparedReceiptEmailHandoff(receiptEmailHandoffPath: string): PreparedReceiptEmailHandoff {
  if (!fs.existsSync(receiptEmailHandoffPath)) {
    throw new Error(`receipt_email_handoff.json not found: ${receiptEmailHandoffPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(receiptEmailHandoffPath, "utf-8")) as unknown;
  return receiptEmailHandoffSchema.parse(raw);
}

export async function sendPreparedEmail(params: {
  repoRoot: string;
  emailHandoffPath: string;
}): Promise<{ handoff: PreparedEmailHandoff; result: EmailDeliveryResult; resultPath: string }> {
  const handoff = loadPreparedEmailHandoff(params.emailHandoffPath);
  const resultPath = path.resolve(path.dirname(params.emailHandoffPath), "email_delivery_result.json");
  const reportDocxAbsolute = path.resolve(params.repoRoot, handoff.artifacts.reportDocxPath);
  const attemptedAt = new Date().toISOString();

  if (!fs.existsSync(reportDocxAbsolute)) {
    const failed: EmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "failed",
      transport: "sendmail",
      emailHandoffPath: path.relative(params.repoRoot, params.emailHandoffPath),
      to: handoff.recipient.email,
      language: handoff.language,
      tier: handoff.tier,
      reportDocxPath: handoff.artifacts.reportDocxPath,
      error: `Report DOCX not found: ${handoff.artifacts.reportDocxPath}`,
    };
    writeDeliveryResult(resultPath, failed);
    return { handoff, result: failed, resultPath };
  }

  try {
    const sendmail = requireSendmailConfig();
    const attachmentFilename = `AMC_Report_${handoff.submissionId}.docx`;
    const message = buildMimeMessage({
      from: sendmail.from,
      to: handoff.recipient.email,
      subject: handoff.email.subject,
      bodyText: handoff.email.bodyText,
      attachmentFilename,
      attachmentPath: reportDocxAbsolute,
    });
    const sent = await runSendmail(sendmail.sendmailPath, message);
    if (!sent.ok) {
      throw new Error(sent.error || "sendmail failed");
    }
    const messageId = `sendmail-${handoff.submissionId}-${Date.now()}`;

    const success: EmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "sent",
      transport: "sendmail",
      emailHandoffPath: path.relative(params.repoRoot, params.emailHandoffPath),
      messageId,
      to: handoff.recipient.email,
      from: sendmail.from,
      language: handoff.language,
      tier: handoff.tier,
      reportDocxPath: handoff.artifacts.reportDocxPath,
    };
    writeDeliveryResult(resultPath, success);
    return { handoff, result: success, resultPath };
  } catch (error) {
    const failed: EmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "failed",
      transport: "sendmail",
      emailHandoffPath: path.relative(params.repoRoot, params.emailHandoffPath),
      to: handoff.recipient.email,
      language: handoff.language,
      tier: handoff.tier,
      reportDocxPath: handoff.artifacts.reportDocxPath,
      error: error instanceof Error ? error.message : String(error),
    };
    writeDeliveryResult(resultPath, failed);
    return { handoff, result: failed, resultPath };
  }
}

export async function sendSubmissionReceiptEmail(params: {
  repoRoot: string;
  receiptEmailHandoffPath: string;
}): Promise<{ handoff: PreparedReceiptEmailHandoff; result: ReceiptEmailDeliveryResult; resultPath: string }> {
  const handoff = loadPreparedReceiptEmailHandoff(params.receiptEmailHandoffPath);
  const resultPath = path.resolve(path.dirname(params.receiptEmailHandoffPath), "receipt_email_delivery_result.json");
  const attemptedAt = new Date().toISOString();

  try {
    const sendmail = requireSendmailConfig();
    const message = buildPlainTextMessage({
      from: sendmail.from,
      to: handoff.recipient.email,
      subject: handoff.email.subject,
      bodyText: handoff.email.bodyText,
    });
    const sent = await runSendmail(sendmail.sendmailPath, message);
    if (!sent.ok) {
      throw new Error(sent.error || "sendmail failed");
    }
    const messageId = `sendmail-receipt-${handoff.submissionId}-${Date.now()}`;
    const success: ReceiptEmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "sent",
      transport: "sendmail",
      receiptEmailHandoffPath: path.relative(params.repoRoot, params.receiptEmailHandoffPath),
      messageId,
      to: handoff.recipient.email,
      from: sendmail.from,
      language: handoff.language,
      tier: handoff.tier,
    };
    writeReceiptDeliveryResult(resultPath, success);
    return { handoff, result: success, resultPath };
  } catch (error) {
    const failed: ReceiptEmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "failed",
      transport: "sendmail",
      receiptEmailHandoffPath: path.relative(params.repoRoot, params.receiptEmailHandoffPath),
      to: handoff.recipient.email,
      language: handoff.language,
      tier: handoff.tier,
      error: error instanceof Error ? error.message : String(error),
    };
    writeReceiptDeliveryResult(resultPath, failed);
    return { handoff, result: failed, resultPath };
  }
}
