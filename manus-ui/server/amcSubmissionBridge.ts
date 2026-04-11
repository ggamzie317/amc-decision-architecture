import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Express } from "express";
import { z } from "zod";

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
    res.status(201).json({
      ok: true,
      submissionId: handoff.submissionId,
      status: "report_generated",
      tier: handoff.tier,
      language: handoff.language,
      recipient: handoff.recipient,
      delivery: handoff.delivery,
      summary,
      artifacts: {
        submissionDir: toRepoRelative(repoRoot, submissionDir),
        handoffPath: toRepoRelative(repoRoot, handoffPath),
        intakePath: toRepoRelative(repoRoot, intakePath),
        payloadPath: toRepoRelative(repoRoot, payloadPath),
        docxPath: toRepoRelative(repoRoot, docxPath),
        runnerLogPath: toRepoRelative(repoRoot, runnerLogPath),
      },
    });
  });
}
