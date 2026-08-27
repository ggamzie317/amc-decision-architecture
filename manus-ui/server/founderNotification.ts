import nodemailer from "nodemailer";

import type { SubmissionPatch } from "./founderOpsTypes";

function env(name: string) {
  return String(process.env[name] || "").trim();
}

export async function sendFounderReportNotification(
  submissionId: string,
  patch: SubmissionPatch
) {
  if (env("AMC_FOUNDER_NOTIFICATIONS_ENABLED").toLowerCase() !== "true")
    return false;
  const host = env("AMC_SMTP_HOST");
  const port = Number(env("AMC_SMTP_PORT"));
  const user = env("AMC_SMTP_USER");
  const pass = env("AMC_SMTP_PASS");
  const from = env("AMC_EMAIL_FROM");
  if (!host || !Number.isFinite(port) || !user || !pass || !from) return false;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: env("AMC_SMTP_SECURE").toLowerCase() === "true",
    auth: { user, pass },
  });
  await transporter.sendMail({
    from,
    to: "report@allofmycareer.com",
    subject: "New AMC Report Generated",
    text: [
      "New AMC Report Generated",
      "",
      `Submission: ${submissionId}`,
      `Language: ${patch.language?.toUpperCase() || "Unknown"}`,
      `Case Type: ${patch.caseType || "Unknown"}`,
      `Full Intake: ${patch.fullIntakeCompletedAt ? "Completed" : "Unknown"}`,
      `External Evidence: ${patch.externalEvidenceMode || "Unknown"} / ${patch.externalEvidenceConfidence || "Unknown"}`,
      "Report: Generated",
      `Research Consent: ${patch.researchUseConsent ? "Yes" : "No"}`,
      `Timestamp: ${patch.reportGeneratedAt || new Date().toISOString()}`,
    ].join("\n"),
  });
  return true;
}
