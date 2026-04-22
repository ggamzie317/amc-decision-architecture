import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { sendPreparedEmail, sendSubmissionReceiptEmail } from "./emailSender";

const languageSchema = z.enum(["ko", "en", "zh"]);
const tierSchema = z.enum(["essential", "executive"]);

const submissionHandoffSchema = z.object({
  submissionId: z.string().min(1),
  createdAt: z.string().min(1),
  source: z.string().min(1),
  language: languageSchema,
  tier: tierSchema,
  recipient: z.object({
    email: z.string().optional().default(""),
    fullName: z.string().optional().default(""),
  }),
  delivery: z.object({
    channel: z.literal("email"),
    language: languageSchema,
    tier: tierSchema,
  }),
  intakeRaw: z.record(z.string(), z.unknown()),
  intakeMeta: z
    .object({
      completedAt: z.string().optional(),
    })
    .optional()
    .default({}),
});

type SubmissionHandoff = z.infer<typeof submissionHandoffSchema>;

type RunnerResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type EmailTemplateType = "report_delivery_essential" | "report_delivery_executive";
type ReceiptTemplateType = "submission_received_receipt";

type EmailHandoff = {
  submissionId: string;
  preparedAt: string;
  deliveryStatus: "prepared";
  recipient: {
    email: string;
    fullName: string;
  };
  tier: "essential" | "executive";
  language: "ko" | "en" | "zh";
  artifacts: {
    reportDocxPath: string;
    reportPdfPath: string;
    reportPayloadPath: string;
  };
  email: {
    templateType: EmailTemplateType;
    subject: string;
    bodyText: string;
  };
  followUp: {
    reportLinkedWindowDays: 0 | 7;
    mode: "none" | "bounded_report_linked_chat";
  };
};

type ReceiptEmailHandoff = {
  submissionId: string;
  preparedAt: string;
  deliveryStatus: "prepared";
  recipient: {
    email: string;
    fullName: string;
  };
  tier: "essential" | "executive";
  language: "ko" | "en" | "zh";
  email: {
    templateType: ReceiptTemplateType;
    subject: string;
    bodyText: string;
  };
};

type ExistingEmailDeliveryResult = {
  status?: string;
};

function sanitizeSegment(value: string): string {
  const trimmed = value.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return safe || "submission";
}

function toRepoRelative(repoRoot: string, absolutePath: string): string {
  return path.relative(repoRoot, absolutePath) || ".";
}

function runCommand(command: string, args: string[], cwd: string): Promise<RunnerResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
    child.on("error", (error) => {
      stderr += error.message;
      resolve({
        code: 1,
        stdout,
        stderr,
      });
    });
  });
}

function parseSummaryFromStdout(stdout: string): Record<string, unknown> | null {
  const match = stdout.match(/SUMMARY:\s*(\{.*\})/);
  if (!match || !match[1]) {
    return null;
  }
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function convertDocxToPdf(params: {
  repoRoot: string;
  submissionDir: string;
  docxPath: string;
}): Promise<
  | { ok: true; pdfPath: string; log: string }
  | { ok: false; error: string; log: string }
> {
  const expectedPdfPath = path.join(
    params.submissionDir,
    `${path.basename(params.docxPath, path.extname(params.docxPath))}.pdf`,
  );
  const runner = await runCommand(
    "soffice",
    ["--headless", "--convert-to", "pdf", "--outdir", params.submissionDir, params.docxPath],
    params.repoRoot,
  );

  const log = `${runner.stdout}\n${runner.stderr}`.trim();
  if (runner.code !== 0) {
    return {
      ok: false,
      error: "PDF export failed.",
      log,
    };
  }

  if (!fs.existsSync(expectedPdfPath)) {
    return {
      ok: false,
      error: "PDF export completed but output file was not found.",
      log,
    };
  }

  return {
    ok: true,
    pdfPath: expectedPdfPath,
    log,
  };
}

function readExistingEmailDeliveryStatus(submissionDir: string): {
  alreadyDelivered: boolean;
  resultPath: string;
} {
  const resultPath = path.join(submissionDir, "email_delivery_result.json");
  if (!fs.existsSync(resultPath)) {
    return { alreadyDelivered: false, resultPath };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(resultPath, "utf-8")) as ExistingEmailDeliveryResult;
    return {
      alreadyDelivered: raw.status === "sent",
      resultPath,
    };
  } catch {
    return { alreadyDelivered: false, resultPath };
  }
}

function toLanguageGreeting(name: string): string {
  return name ? `${name},` : "Hello,";
}

function toEmailSubject(tier: "essential" | "executive"): string {
  return tier === "executive"
    ? "[AMC] Your structural report and Executive follow-up details"
    : "[AMC] Your AMC structural report is ready";
}

function buildBodyText(tier: "essential" | "executive", recipientName: string): string {
  const greeting = toLanguageGreeting(recipientName);
  const lines = [
    greeting,
    "",
    "Your AMC report is now prepared.",
    `Selected format: ${tier === "executive" ? "Executive" : "Essential"}`,
    "",
    "Your report is attached to this email.",
  ];
  if (tier === "executive") {
    lines.push(
      "",
      "Executive follow-up details are included with this delivery.",
      "Executive follow-up is bounded and report-linked.",
    );
  }
  lines.push("", "Thank you,", "AMC");
  return lines.join("\n");
}

function toReceiptSubject(): string {
  return "[AMC] Your case has been received";
}

function buildReceiptBodyText(tier: "essential" | "executive", recipientName: string): string {
  const greeting = toLanguageGreeting(recipientName);
  const lines = [
    greeting,
    "",
    "Your AMC case has been received.",
    `Selected format: ${tier === "executive" ? "Executive" : "Essential"}`,
    "Your report will be delivered by email within 3 hours.",
  ];
  if (tier === "executive") {
    lines.push("Executive follow-up details will arrive with delivery.");
  }
  lines.push("", "Thank you,", "AMC");
  return lines.join("\n");
}

function buildReceiptEmailHandoff(handoff: SubmissionHandoff): ReceiptEmailHandoff {
  return {
    submissionId: handoff.submissionId,
    preparedAt: new Date().toISOString(),
    deliveryStatus: "prepared",
    recipient: {
      email: handoff.recipient.email,
      fullName: handoff.recipient.fullName,
    },
    tier: handoff.tier,
    language: handoff.language,
    email: {
      templateType: "submission_received_receipt",
      subject: toReceiptSubject(),
      bodyText: buildReceiptBodyText(handoff.tier, handoff.recipient.fullName),
    },
  };
}

function buildEmailHandoff(
  handoff: SubmissionHandoff,
  repoRoot: string,
  docxPath: string,
  pdfPath: string,
  payloadPath: string,
): EmailHandoff {
  const templateType: EmailTemplateType =
    handoff.tier === "executive" ? "report_delivery_executive" : "report_delivery_essential";
  const relativeDocxPath = toRepoRelative(repoRoot, docxPath);
  const relativePdfPath = toRepoRelative(repoRoot, pdfPath);
  const relativePayloadPath = toRepoRelative(repoRoot, payloadPath);

  return {
    submissionId: handoff.submissionId,
    preparedAt: new Date().toISOString(),
    deliveryStatus: "prepared",
    recipient: {
      email: handoff.recipient.email,
      fullName: handoff.recipient.fullName,
    },
    tier: handoff.tier,
    language: handoff.language,
    artifacts: {
      reportDocxPath: relativeDocxPath,
      reportPdfPath: relativePdfPath,
      reportPayloadPath: relativePayloadPath,
    },
    email: {
      templateType,
      subject: toEmailSubject(handoff.tier),
      bodyText: buildBodyText(handoff.tier, handoff.recipient.fullName),
    },
    followUp: {
      reportLinkedWindowDays: handoff.tier === "executive" ? 7 : 0,
      mode: handoff.tier === "executive" ? "bounded_report_linked_chat" : "none",
    },
  };
}

export function registerAmcSubmissionBridge(app: Express, serverDir: string): void {
  const repoRoot = path.resolve(serverDir, "..", "..");
  const templatePath =
    process.env.AMC_TEMPLATE_PATH ||
    path.resolve(repoRoot, "templates", "AMC_Strategic_Career_Decision_Template_v3_4_working.docx");
  const opsSecret = String(process.env.AMC_OPS_SECRET || "").trim();

  function requireOpsAuth(req: Request, res: Response): boolean {
    if (!opsSecret) {
      res.status(403).json({
        ok: false,
        error: "Ops endpoint is disabled: AMC_OPS_SECRET is not configured.",
      });
      return false;
    }

    const provided = String(req.header("x-amc-ops-secret") || "").trim();
    if (!provided || provided !== opsSecret) {
      res.status(401).json({
        ok: false,
        error: "Unauthorized.",
      });
      return false;
    }

    return true;
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "amc_submission_bridge",
    });
  });

  const deliverReportForSubmission = async (params: {
    submissionId: string;
    sendEmail: boolean;
    force: boolean;
  }): Promise<
    | {
        ok: true;
        httpCode: number;
        body: Record<string, unknown>;
      }
    | {
        ok: false;
        httpCode: number;
        body: Record<string, unknown>;
      }
  > => {
    const submissionSafe = sanitizeSegment(params.submissionId);
    const submissionDir = path.resolve(repoRoot, "output", "submissions", submissionSafe);
    const handoffPath = path.join(submissionDir, "submission_handoff.json");
    const intakePath = path.join(submissionDir, "intake_raw.json");
    const payloadPath = path.join(submissionDir, "amc_docx_payload.json");
    const docxPath = path.join(submissionDir, "AMC_Report.docx");
    const emailHandoffPath = path.join(submissionDir, "email_handoff.json");
    const runnerLogPath = path.join(submissionDir, "runner.log");
    const pdfExportLogPath = path.join(submissionDir, "pdf_export.log");

    if (!fs.existsSync(handoffPath)) {
      return {
        ok: false,
        httpCode: 404,
        body: {
          ok: false,
          status: "not_ready",
          submissionId: params.submissionId,
          error: "Submission handoff not found. Submit the case first.",
        },
      };
    }

    let handoff: SubmissionHandoff;
    try {
      const raw = JSON.parse(fs.readFileSync(handoffPath, "utf-8")) as unknown;
      handoff = submissionHandoffSchema.parse(raw) as SubmissionHandoff;
    } catch (error) {
      return {
        ok: false,
        httpCode: 400,
        body: {
          ok: false,
          status: "invalid",
          submissionId: params.submissionId,
          error: error instanceof Error ? error.message : "Invalid stored submission handoff.",
        },
      };
    }

    const existingDelivery = readExistingEmailDeliveryStatus(submissionDir);
    if (params.sendEmail && !params.force && existingDelivery.alreadyDelivered) {
      return {
        ok: true,
        httpCode: 200,
        body: {
          ok: true,
          submissionId: handoff.submissionId,
          status: "already_delivered",
          tier: handoff.tier,
          language: handoff.language,
          recipient: handoff.recipient,
          emailDelivery: {
            status: "sent",
            resultPath: toRepoRelative(repoRoot, existingDelivery.resultPath),
          },
          artifacts: {
            submissionDir: toRepoRelative(repoRoot, submissionDir),
            handoffPath: toRepoRelative(repoRoot, handoffPath),
          },
        },
      };
    }

    if (!handoff.recipient.email.trim()) {
      return {
        ok: false,
        httpCode: 400,
        body: {
          ok: false,
          status: "invalid",
          submissionId: handoff.submissionId,
          error: "Recipient email is required for report delivery.",
        },
      };
    }

    fs.mkdirSync(submissionDir, { recursive: true });
    fs.writeFileSync(intakePath, JSON.stringify(handoff.intakeRaw, null, 2));

    const runnerArgs = [
      "--dir",
      "manus-ui",
      "exec",
      "tsx",
      "../scripts/run_amc_report.ts",
      "--template",
      templatePath,
      "--intake",
      intakePath,
      "--payload",
      payloadPath,
      "--out",
      docxPath,
      "--strict-undeclared",
      "--lang",
      handoff.language,
    ];

    const runner = await runCommand("pnpm", runnerArgs, repoRoot);
    const combinedLog = `${runner.stdout}\n${runner.stderr}`.trim();
    fs.writeFileSync(runnerLogPath, combinedLog);

    if (runner.code !== 0) {
      return {
        ok: false,
        httpCode: 500,
        body: {
          ok: false,
          submissionId: handoff.submissionId,
          status: "generation_failed",
          tier: handoff.tier,
          language: handoff.language,
          recipient: handoff.recipient,
          artifacts: {
            submissionDir: toRepoRelative(repoRoot, submissionDir),
            handoffPath: toRepoRelative(repoRoot, handoffPath),
            intakePath: toRepoRelative(repoRoot, intakePath),
            runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
          },
          error: "AMC report generation failed.",
        },
      };
    }

    const summary = parseSummaryFromStdout(runner.stdout);
    const pdfExport = await convertDocxToPdf({
      repoRoot,
      submissionDir,
      docxPath,
    });
    fs.writeFileSync(pdfExportLogPath, pdfExport.log);
    if (!pdfExport.ok) {
      return {
        ok: false,
        httpCode: 500,
        body: {
          ok: false,
          submissionId: handoff.submissionId,
          status: "generation_failed",
          tier: handoff.tier,
          language: handoff.language,
          recipient: handoff.recipient,
          artifacts: {
            submissionDir: toRepoRelative(repoRoot, submissionDir),
            handoffPath: toRepoRelative(repoRoot, handoffPath),
            intakePath: toRepoRelative(repoRoot, intakePath),
            payloadPath: toRepoRelative(repoRoot, payloadPath),
            docxPath: toRepoRelative(repoRoot, docxPath),
            runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
            pdfExportLogPath: toRepoRelative(repoRoot, pdfExportLogPath),
          },
          error: pdfExport.error,
        },
      };
    }
    const emailHandoff = buildEmailHandoff(handoff, repoRoot, docxPath, pdfExport.pdfPath, payloadPath);
    fs.writeFileSync(emailHandoffPath, JSON.stringify(emailHandoff, null, 2));

    let emailDeliveryResult:
      | {
          status: "sent" | "failed";
          messageId?: string;
          resultPath: string;
          error?: string;
        }
      | undefined;

    if (params.sendEmail) {
      const sent = await sendPreparedEmail({
        repoRoot,
        emailHandoffPath,
      });
      emailDeliveryResult = {
        status: sent.result.status,
        messageId: sent.result.messageId,
        resultPath: toRepoRelative(repoRoot, sent.resultPath),
        error: sent.result.error,
      };

      if (sent.result.status !== "sent") {
        return {
          ok: false,
          httpCode: 500,
          body: {
            ok: false,
            submissionId: handoff.submissionId,
            status: "report_email_failed",
            tier: handoff.tier,
            language: handoff.language,
            recipient: handoff.recipient,
            email: {
              templateType: emailHandoff.email.templateType,
              subject: emailHandoff.email.subject,
            },
            emailDelivery: emailDeliveryResult,
            artifacts: {
              submissionDir: toRepoRelative(repoRoot, submissionDir),
              payloadPath: toRepoRelative(repoRoot, payloadPath),
              docxPath: toRepoRelative(repoRoot, docxPath),
              pdfPath: toRepoRelative(repoRoot, pdfExport.pdfPath),
              emailHandoffPath: toRepoRelative(repoRoot, emailHandoffPath),
              runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
              pdfExportLogPath: toRepoRelative(repoRoot, pdfExportLogPath),
            },
            error: sent.result.error || "Report delivery email failed.",
          },
        };
      }
    }

    return {
      ok: true,
      httpCode: 201,
      body: {
        ok: true,
        submissionId: handoff.submissionId,
        status: params.sendEmail ? "report_email_sent" : "report_prepared_for_delivery",
        tier: handoff.tier,
        language: handoff.language,
        recipient: handoff.recipient,
        summary,
        deliveryStatus: emailHandoff.deliveryStatus,
        email: {
          templateType: emailHandoff.email.templateType,
          subject: emailHandoff.email.subject,
        },
        followUp: emailHandoff.followUp,
        emailDelivery: emailDeliveryResult,
        artifacts: {
          submissionDir: toRepoRelative(repoRoot, submissionDir),
          handoffPath: toRepoRelative(repoRoot, handoffPath),
          intakePath: toRepoRelative(repoRoot, intakePath),
          payloadPath: toRepoRelative(repoRoot, payloadPath),
          docxPath: toRepoRelative(repoRoot, docxPath),
          pdfPath: toRepoRelative(repoRoot, pdfExport.pdfPath),
          emailHandoffPath: toRepoRelative(repoRoot, emailHandoffPath),
          runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
          pdfExportLogPath: toRepoRelative(repoRoot, pdfExportLogPath),
        },
      },
    };
  };

  app.post("/api/submissions", async (req, res) => {
    const parsed = submissionHandoffSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "Invalid submission handoff payload.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const handoff = parsed.data as SubmissionHandoff;
    const submissionSafe = sanitizeSegment(handoff.submissionId);
    const submissionDir = path.resolve(repoRoot, "output", "submissions", submissionSafe);
    fs.mkdirSync(submissionDir, { recursive: true });

    const handoffPath = path.join(submissionDir, "submission_handoff.json");
    const intakePath = path.join(submissionDir, "intake_raw.json");
    const payloadPath = path.join(submissionDir, "amc_docx_payload.json");
    const docxPath = path.join(submissionDir, "AMC_Report.docx");
    const emailHandoffPath = path.join(submissionDir, "email_handoff.json");
    const runnerLogPath = path.join(submissionDir, "runner.log");
    const pdfExportLogPath = path.join(submissionDir, "pdf_export.log");

    fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2));
    fs.writeFileSync(intakePath, JSON.stringify(handoff.intakeRaw, null, 2));

    const runnerArgs = [
      "--dir",
      "manus-ui",
      "exec",
      "tsx",
      "../scripts/run_amc_report.ts",
      "--template",
      templatePath,
      "--intake",
      intakePath,
      "--payload",
      payloadPath,
      "--out",
      docxPath,
      "--strict-undeclared",
      "--lang",
      handoff.language,
    ];

    const runner = await runCommand("pnpm", runnerArgs, repoRoot);
    const combinedLog = `${runner.stdout}\n${runner.stderr}`.trim();
    fs.writeFileSync(runnerLogPath, combinedLog);

    if (runner.code !== 0) {
      res.status(500).json({
        ok: false,
        submissionId: handoff.submissionId,
        status: "generation_failed",
        tier: handoff.tier,
        language: handoff.language,
        recipient: handoff.recipient,
        artifacts: {
          submissionDir: toRepoRelative(repoRoot, submissionDir),
          handoffPath: toRepoRelative(repoRoot, handoffPath),
          intakePath: toRepoRelative(repoRoot, intakePath),
          runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
        },
        error: "AMC report generation failed.",
      });
      return;
    }

    const summary = parseSummaryFromStdout(runner.stdout);
    const pdfExport = await convertDocxToPdf({
      repoRoot,
      submissionDir,
      docxPath,
    });
    fs.writeFileSync(pdfExportLogPath, pdfExport.log);
    if (!pdfExport.ok) {
      res.status(500).json({
        ok: false,
        submissionId: handoff.submissionId,
        status: "generation_failed",
        tier: handoff.tier,
        language: handoff.language,
        recipient: handoff.recipient,
        artifacts: {
          submissionDir: toRepoRelative(repoRoot, submissionDir),
          handoffPath: toRepoRelative(repoRoot, handoffPath),
          intakePath: toRepoRelative(repoRoot, intakePath),
          payloadPath: toRepoRelative(repoRoot, payloadPath),
          docxPath: toRepoRelative(repoRoot, docxPath),
          runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
          pdfExportLogPath: toRepoRelative(repoRoot, pdfExportLogPath),
        },
        error: pdfExport.error,
      });
      return;
    }
    const emailHandoff = buildEmailHandoff(handoff, repoRoot, docxPath, pdfExport.pdfPath, payloadPath);
    fs.writeFileSync(emailHandoffPath, JSON.stringify(emailHandoff, null, 2));
    const autoSendEnabled = process.env.AMC_AUTO_SEND_EMAIL_ON_SUBMISSION === "1";
    let emailDeliveryResult:
      | {
          status: "sent" | "failed";
          messageId?: string;
          resultPath: string;
          error?: string;
        }
      | undefined;

    if (autoSendEnabled) {
      const sent = await sendPreparedEmail({
        repoRoot,
        emailHandoffPath,
      });
      emailDeliveryResult = {
        status: sent.result.status,
        messageId: sent.result.messageId,
        resultPath: toRepoRelative(repoRoot, sent.resultPath),
        error: sent.result.error,
      };
    }

    res.status(201).json({
      ok: true,
      submissionId: handoff.submissionId,
      status: "report_generated",
      tier: handoff.tier,
      language: handoff.language,
      recipient: handoff.recipient,
      delivery: handoff.delivery,
      summary,
      deliveryStatus: emailHandoff.deliveryStatus,
      email: {
        templateType: emailHandoff.email.templateType,
        subject: emailHandoff.email.subject,
      },
      followUp: emailHandoff.followUp,
      emailDelivery: emailDeliveryResult,
      artifacts: {
        submissionDir: toRepoRelative(repoRoot, submissionDir),
        handoffPath: toRepoRelative(repoRoot, handoffPath),
        intakePath: toRepoRelative(repoRoot, intakePath),
        payloadPath: toRepoRelative(repoRoot, payloadPath),
        docxPath: toRepoRelative(repoRoot, docxPath),
        pdfPath: toRepoRelative(repoRoot, pdfExport.pdfPath),
        emailHandoffPath: toRepoRelative(repoRoot, emailHandoffPath),
        runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
        pdfExportLogPath: toRepoRelative(repoRoot, pdfExportLogPath),
      },
    });
  });

  app.post("/api/submissions/receipt", async (req, res) => {
    const parsed = submissionHandoffSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "Invalid submission handoff payload.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const handoff = parsed.data as SubmissionHandoff;
    if (!handoff.recipient.email.trim()) {
      res.status(400).json({
        ok: false,
        error: "Recipient email is required.",
      });
      return;
    }

    const submissionSafe = sanitizeSegment(handoff.submissionId);
    const submissionDir = path.resolve(repoRoot, "output", "submissions", submissionSafe);
    fs.mkdirSync(submissionDir, { recursive: true });

    const handoffPath = path.join(submissionDir, "submission_handoff.json");
    const receiptEmailHandoffPath = path.join(submissionDir, "receipt_email_handoff.json");
    fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2));

    const receiptEmailHandoff = buildReceiptEmailHandoff(handoff);
    fs.writeFileSync(receiptEmailHandoffPath, JSON.stringify(receiptEmailHandoff, null, 2));

    const sent = await sendSubmissionReceiptEmail({
      repoRoot,
      receiptEmailHandoffPath,
    });

    if (sent.result.status !== "sent") {
      res.status(500).json({
        ok: false,
        status: sent.result.status,
        submissionId: sent.result.submissionId,
        error: sent.result.error || "Receipt email sending failed.",
        resultPath: toRepoRelative(repoRoot, sent.resultPath),
      });
      return;
    }

    res.status(201).json({
      ok: true,
      submissionId: handoff.submissionId,
      status: "case_received",
      tier: handoff.tier,
      language: handoff.language,
      recipient: handoff.recipient,
      email: {
        templateType: receiptEmailHandoff.email.templateType,
        subject: receiptEmailHandoff.email.subject,
      },
      emailDelivery: {
        status: sent.result.status,
        messageId: sent.result.messageId,
        resultPath: toRepoRelative(repoRoot, sent.resultPath),
      },
      artifacts: {
        submissionDir: toRepoRelative(repoRoot, submissionDir),
        handoffPath: toRepoRelative(repoRoot, handoffPath),
        receiptEmailHandoffPath: toRepoRelative(repoRoot, receiptEmailHandoffPath),
      },
    });
  });

  app.post("/api/submissions/report-delivery", async (req, res) => {
    if (!requireOpsAuth(req, res)) {
      return;
    }

    const body = (req.body || {}) as { submissionId?: string; sendEmail?: boolean; force?: boolean };
    const submissionId = String(body.submissionId || "").trim();
    const sendEmail = body.sendEmail !== false;
    const force = body.force === true;

    if (!submissionId) {
      res.status(400).json({
        ok: false,
        error: "submissionId is required.",
      });
      return;
    }

    const result = await deliverReportForSubmission({
      submissionId,
      sendEmail,
      force,
    });
    res.status(result.httpCode).json(result.body);
  });

  app.post("/api/submissions/report-delivery/trigger", async (req, res) => {
    if (!requireOpsAuth(req, res)) {
      return;
    }

    const body = (req.body || {}) as {
      submissionId?: string;
      limit?: number;
      force?: boolean;
    };
    const submissionId = String(body.submissionId || "").trim();
    const force = body.force === true;
    const requestedLimit = Number(body.limit ?? 20);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(100, Math.floor(requestedLimit)))
      : 20;

    if (submissionId) {
      const result = await deliverReportForSubmission({
        submissionId,
        sendEmail: true,
        force,
      });
      res.status(result.httpCode).json(result.body);
      return;
    }

    const submissionsRoot = path.resolve(repoRoot, "output", "submissions");
    if (!fs.existsSync(submissionsRoot)) {
      res.status(200).json({
        ok: true,
        status: "no_pending_submissions",
        processedCount: 0,
        deliveredCount: 0,
        alreadyDeliveredCount: 0,
        failedCount: 0,
        results: [],
      });
      return;
    }

    const candidates = fs
      .readdirSync(submissionsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const results: Array<Record<string, unknown>> = [];
    let deliveredCount = 0;
    let alreadyDeliveredCount = 0;
    let failedCount = 0;
    let processedCount = 0;

    for (const candidate of candidates) {
      if (processedCount >= limit) {
        break;
      }

      const submissionDir = path.resolve(submissionsRoot, candidate);
      const handoffPath = path.join(submissionDir, "submission_handoff.json");
      if (!fs.existsSync(handoffPath)) {
        continue;
      }

      const result = await deliverReportForSubmission({
        submissionId: candidate,
        sendEmail: true,
        force,
      });
      processedCount += 1;
      results.push(result.body);

      const status = String((result.body as { status?: string }).status || "");
      if (status === "report_email_sent") {
        deliveredCount += 1;
      } else if (status === "already_delivered") {
        alreadyDeliveredCount += 1;
      } else {
        failedCount += 1;
      }
    }

    res.status(failedCount > 0 ? 207 : 200).json({
      ok: failedCount === 0,
      status: "trigger_completed",
      processedCount,
      deliveredCount,
      alreadyDeliveredCount,
      failedCount,
      limit,
      force,
      results,
    });
  });
}
