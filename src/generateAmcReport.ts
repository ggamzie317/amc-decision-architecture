import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildAmcDocxPayload } from "./buildAmcDocxPayload";

export interface GenerateAmcReportOptions {
  templatePath: string;
  outPath: string;
  payloadPath?: string;
  pythonBin?: string;
  now?: () => Date;
}

export interface AmcRenderInput {
  docxPayload: ReturnType<typeof buildAmcDocxPayload>;
  mergePayload: Record<string, string>;
}

export function buildAmcRenderInput(rawIntake: any, options: { now?: () => Date } = {}): AmcRenderInput {
  const docxPayload = buildAmcDocxPayload(rawIntake, options);
  const mergePayload = docxPayload.templatePayload;
  return { docxPayload, mergePayload };
}

export function generateAmcReport(rawIntake: any, options: GenerateAmcReportOptions) {
  const pythonBin = options.pythonBin || "python3";
  const payloadPath = options.payloadPath || path.join("output", "amc_docx_payload_latest.json");
  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFile);
  const mergeScriptPath = path.join(thisDir, "merge_docx.py");

  const { docxPayload, mergePayload } = buildAmcRenderInput(rawIntake, {
    now: options.now,
  });

  fs.mkdirSync(path.dirname(payloadPath), { recursive: true });
  fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
  fs.writeFileSync(payloadPath, JSON.stringify(mergePayload, null, 2) + "\n", "utf-8");

  execFileSync(
    pythonBin,
    [
      mergeScriptPath,
      "--template",
      options.templatePath,
      "--payload",
      payloadPath,
      "--out",
      options.outPath,
    ],
    { stdio: "pipe" },
  );

  return {
    payloadPath,
    outPath: options.outPath,
    docxPayload,
  };
}
