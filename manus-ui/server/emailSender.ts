import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

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
    reportPdfPath: z.string().min(1).optional(),
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
  transport: "smtp";
  emailHandoffPath: string;
  messageId?: string;
  to: string;
  from?: string;
  language: "ko" | "en" | "zh";
  tier: "essential" | "executive";
  reportAttachmentPath: string;
  reportAttachmentFormat: "pdf" | "docx";
  reportDocxPath: string;
  reportPdfPath?: string;
  error?: string;
};

export type ReceiptEmailDeliveryResult = {
  submissionId: string;
  attemptedAt: string;
  status: "sent" | "failed";
  transport: "smtp";
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

function parseBooleanEnv(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return null;
}

function requireSmtpConfig(): {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
} {
  const from = getEnv("AMC_EMAIL_FROM");
  const host = getEnv("AMC_SMTP_HOST");
  const portRaw = getEnv("AMC_SMTP_PORT");
  const secureRaw = getEnv("AMC_SMTP_SECURE");
  const user = getEnv("AMC_SMTP_USER");
  const pass = getEnv("AMC_SMTP_PASS");

  const missing = [
    !from ? "AMC_EMAIL_FROM" : "",
    !host ? "AMC_SMTP_HOST" : "",
    !portRaw ? "AMC_SMTP_PORT" : "",
    !secureRaw ? "AMC_SMTP_SECURE" : "",
    !user ? "AMC_SMTP_USER" : "",
    !pass ? "AMC_SMTP_PASS" : "",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Email sender configuration missing: ${missing.join(", ")}`);
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("AMC_SMTP_PORT must be a valid positive number.");
  }

  const secure = parseBooleanEnv(secureRaw);
  if (secure === null) {
    throw new Error("AMC_SMTP_SECURE must be true/false (or 1/0).");
  }

  return { from, host, port, secure, user, pass };
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
  const reportPdfAbsolute = handoff.artifacts.reportPdfPath
    ? path.resolve(params.repoRoot, handoff.artifacts.reportPdfPath)
    : null;
  const attemptedAt = new Date().toISOString();
  const shouldPreferPdf = Boolean(handoff.artifacts.reportPdfPath);
  const reportAttachment = shouldPreferPdf
    ? {
        format: "pdf" as const,
        relativePath: handoff.artifacts.reportPdfPath as string,
        absolutePath: reportPdfAbsolute as string,
      }
    : {
        format: "docx" as const,
        relativePath: handoff.artifacts.reportDocxPath,
        absolutePath: reportDocxAbsolute,
      };

  if (!fs.existsSync(reportAttachment.absolutePath)) {
    const failed: EmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "failed",
      transport: "smtp",
      emailHandoffPath: path.relative(params.repoRoot, params.emailHandoffPath),
      to: handoff.recipient.email,
      language: handoff.language,
      tier: handoff.tier,
      reportAttachmentPath: reportAttachment.relativePath,
      reportAttachmentFormat: reportAttachment.format,
      reportDocxPath: handoff.artifacts.reportDocxPath,
      reportPdfPath: handoff.artifacts.reportPdfPath,
      error:
        reportAttachment.format === "pdf"
          ? `Report PDF not found: ${reportAttachment.relativePath}`
          : `Report DOCX not found: ${reportAttachment.relativePath}`,
    };
    writeDeliveryResult(resultPath, failed);
    return { handoff, result: failed, resultPath };
  }

  try {
    const smtp = requireSmtpConfig();
    const attachmentFilename = `AMC_Report_${handoff.submissionId}.${reportAttachment.format}`;
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
    const info = await transporter.sendMail({
      from: smtp.from,
      to: handoff.recipient.email,
      subject: handoff.email.subject,
      text: handoff.email.bodyText,
      attachments: [
        {
          filename: attachmentFilename,
          path: reportAttachment.absolutePath,
        },
      ],
    });

    const success: EmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "sent",
      transport: "smtp",
      emailHandoffPath: path.relative(params.repoRoot, params.emailHandoffPath),
      messageId: info.messageId,
      to: handoff.recipient.email,
      from: smtp.from,
      language: handoff.language,
      tier: handoff.tier,
      reportAttachmentPath: reportAttachment.relativePath,
      reportAttachmentFormat: reportAttachment.format,
      reportDocxPath: handoff.artifacts.reportDocxPath,
      reportPdfPath: handoff.artifacts.reportPdfPath,
    };
    writeDeliveryResult(resultPath, success);
    return { handoff, result: success, resultPath };
  } catch (error) {
    const failed: EmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "failed",
      transport: "smtp",
      emailHandoffPath: path.relative(params.repoRoot, params.emailHandoffPath),
      to: handoff.recipient.email,
      language: handoff.language,
      tier: handoff.tier,
      reportAttachmentPath: reportAttachment.relativePath,
      reportAttachmentFormat: reportAttachment.format,
      reportDocxPath: handoff.artifacts.reportDocxPath,
      reportPdfPath: handoff.artifacts.reportPdfPath,
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
    const smtp = requireSmtpConfig();
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
    const info = await transporter.sendMail({
      from: smtp.from,
      to: handoff.recipient.email,
      subject: handoff.email.subject,
      text: handoff.email.bodyText,
    });
    const success: ReceiptEmailDeliveryResult = {
      submissionId: handoff.submissionId,
      attemptedAt,
      status: "sent",
      transport: "smtp",
      receiptEmailHandoffPath: path.relative(params.repoRoot, params.receiptEmailHandoffPath),
      messageId: info.messageId,
      to: handoff.recipient.email,
      from: smtp.from,
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
      transport: "smtp",
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
