import { assembleAmcReportPayload } from "./assembleAmcReportPayload";
import { buildAmcTemplatePayload } from "./buildAmcTemplatePayload";
import type { AmcExternalSnapshotOverride } from "./amc/externalSnapshotOverride";

type DocxOptions = {
  now?: () => Date;
  externalSnapshotOverride?: AmcExternalSnapshotOverride;
};

export function buildAmcDocxPayload(rawIntake: any, options: DocxOptions = {}) {
  const reportPayload = assembleAmcReportPayload(rawIntake, options);
  return buildAmcDocxPayloadFromReportPayload(reportPayload);
}

export function buildAmcDocxPayloadFromReportPayload(reportPayload: any) {
  const templatePayload = buildAmcTemplatePayload(reportPayload);

  const generatedAt =
    reportPayload?.meta?.generatedAt ||
    templatePayload?.meta_generated_at ||
    new Date().toISOString();

  const caseType =
    templatePayload?.case_type ||
    reportPayload?.sections?.[0]?.caseType ||
    "single";

  return {
    meta: {
      reportType: "amc_docx_payload",
      version: "v1",
      generatedAt,
      caseType,
    },
    reportPayload,
    templatePayload,
  };
}
