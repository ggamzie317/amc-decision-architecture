import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Express } from "express";
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

function toLanguageGreeting(language: "ko" | "en" | "zh", name: string): string {
  if (language === "ko") {
    return name ? `${name}님,` : "안녕하세요,";
  }
  if (language === "zh") {
    return name ? `${name}，您好：` : "您好：";
  }
  return name ? `${name},` : "Hello,";
}

function toEmailSubject(language: "ko" | "en" | "zh", tier: "essential" | "executive"): string {
  if (language === "ko") {
    return tier === "executive"
      ? "[AMC] 구조 리포트 전달 및 Executive 후속 안내"
      : "[AMC] 구조 리포트 전달 안내";
  }
  if (language === "zh") {
    return tier === "executive"
      ? "[AMC] 您的结构报告与 Executive 跟进说明"
      : "[AMC] 您的 AMC 结构报告已准备完成";
  }
  return tier === "executive"
    ? "[AMC] Your structural report and Executive follow-up details"
    : "[AMC] Your AMC structural report is ready";
}

function buildBodyText(
  language: "ko" | "en" | "zh",
  tier: "essential" | "executive",
  recipientName: string,
  relativeDocxPath: string,
): string {
  const greeting = toLanguageGreeting(language, recipientName);

  if (language === "ko") {
    const lines = [
      greeting,
      "",
      "AMC 리포트가 준비되었습니다.",
      `리포트 파일: ${relativeDocxPath}`,
      "",
      "AMC는 구조를 먼저 읽는 리포트 중심 서비스입니다.",
      "이번 전달에는 동일한 핵심 리포트가 포함됩니다.",
    ];
    if (tier === "executive") {
      lines.push(
        "",
        "Executive에는 리포트 전달 후 7일간의 리포트 연동 후속 해석/질의 레이어가 포함됩니다.",
        "해당 후속은 오픈형 코칭이 아닌, 리포트 기반의 제한된 확인/정리 용도입니다.",
      );
    }
    lines.push("", "감사합니다.", "AMC");
    return lines.join("\n");
  }

  if (language === "zh") {
    const lines = [
      greeting,
      "",
      "您的 AMC 报告已准备完成。",
      `报告文件：${relativeDocxPath}`,
      "",
      "AMC 是以结构先行为核心的报告型服务。",
      "本次交付包含同一份核心报告。",
    ];
    if (tier === "executive") {
      lines.push(
        "",
        "Executive 包含报告交付后 7 天的报告关联式跟进说明/澄清层。",
        "该跟进并非开放式辅导，而是基于报告的边界内解释支持。",
      );
    }
    lines.push("", "谢谢。", "AMC");
    return lines.join("\n");
  }

  const lines = [
    greeting,
    "",
    "Your AMC report is now prepared.",
    `Report file: ${relativeDocxPath}`,
    "",
    "AMC is a report-led, structure-first service.",
    "This delivery includes the same core report.",
  ];
  if (tier === "executive") {
    lines.push(
      "",
      "Executive includes a 7-day report-linked clarification layer after report delivery.",
      "It is bounded follow-up support, not open-ended coaching.",
    );
  }
  lines.push("", "Thank you,", "AMC");
  return lines.join("\n");
}

function toReceiptSubject(language: "ko" | "en" | "zh"): string {
  if (language === "ko") {
    return "[AMC] 케이스 접수 완료 안내";
  }
  if (language === "zh") {
    return "[AMC] 你的案例已成功接收";
  }
  return "[AMC] Your case has been received";
}

function buildReceiptBodyText(
  language: "ko" | "en" | "zh",
  tier: "essential" | "executive",
  recipientName: string,
): string {
  const greeting = toLanguageGreeting(language, recipientName);
  if (language === "ko") {
    const lines = [
      greeting,
      "",
      "AMC 케이스가 접수되었습니다.",
      `선택 포맷: ${tier === "executive" ? "Executive" : "Essential"}`,
      "리포트는 3시간 이내 이메일로 전달됩니다.",
    ];
    if (tier === "executive") {
      lines.push("Executive 후속 안내는 리포트 전달 시 함께 제공됩니다.");
    }
    lines.push("", "감사합니다.", "AMC");
    return lines.join("\n");
  }
  if (language === "zh") {
    const lines = [
      greeting,
      "",
      "你的 AMC 案例已成功接收。",
      `已选形式：${tier === "executive" ? "Executive" : "Essential"}`,
      "报告将在 3 小时内通过邮件送达。",
    ];
    if (tier === "executive") {
      lines.push("Executive 跟进说明将随报告一并发送。");
    }
    lines.push("", "谢谢。", "AMC");
    return lines.join("\n");
  }
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
      subject: toReceiptSubject(handoff.language),
      bodyText: buildReceiptBodyText(handoff.language, handoff.tier, handoff.recipient.fullName),
    },
  };
}

function buildEmailHandoff(
  handoff: SubmissionHandoff,
  repoRoot: string,
  docxPath: string,
  payloadPath: string,
): EmailHandoff {
  const templateType: EmailTemplateType =
    handoff.tier === "executive" ? "report_delivery_executive" : "report_delivery_essential";
  const relativeDocxPath = toRepoRelative(repoRoot, docxPath);
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
      reportPayloadPath: relativePayloadPath,
    },
    email: {
      templateType,
      subject: toEmailSubject(handoff.language, handoff.tier),
      bodyText: buildBodyText(handoff.language, handoff.tier, handoff.recipient.fullName, relativeDocxPath),
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

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "amc_submission_bridge",
    });
  });

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
    const emailHandoff = buildEmailHandoff(handoff, repoRoot, docxPath, payloadPath);
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
        emailHandoffPath: toRepoRelative(repoRoot, emailHandoffPath),
        runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
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
}
