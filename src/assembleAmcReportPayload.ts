import { normalizeIntake } from "./amc/normalizeIntake";
import { deriveFlags } from "./amc/deriveFlags";
import { buildInputSummary } from "./amc/buildInputSummary";

import { buildExecutiveOverview } from "./buildExecutiveOverview";
import { buildExternalSnapshot } from "./buildExternalSnapshot";
import { buildInternalStructuralSnapshot } from "./buildInternalStructuralSnapshot";
import { buildStructuralRiskDiagnosis } from "./buildStructuralRiskDiagnosis";
import { buildCareerValueStructure } from "./buildCareerValueStructure";
import { buildCareerMobilityStructure } from "./buildCareerMobilityStructure";
import { buildStrategicTemperament } from "./buildStrategicTemperament";
import { buildDecisionConditions } from "./buildDecisionConditions";

const normalizeAmcIntake = normalizeIntake;
const deriveStructuralFlags = deriveFlags;

type AssemblerOptions = {
  now?: () => Date;
};

export function assembleAmcReportPayload(rawIntake: any, options: AssemblerOptions = {}) {
  const now = options.now ?? (() => new Date());

  const normalized = normalizeAmcIntake(rawIntake || {});
  const structuralFlags = deriveStructuralFlags(normalized);
  const inputSummary = buildInputSummary(normalized, structuralFlags);

  const builderArgs = {
    normalized,
    structuralFlags,
    inputSummary,
  };

  const sections = [
    buildExecutiveOverview(builderArgs),
    buildExternalSnapshot(builderArgs),
    buildInternalStructuralSnapshot(builderArgs),
    buildStructuralRiskDiagnosis(builderArgs),
    buildCareerValueStructure(builderArgs),
    buildCareerMobilityStructure(builderArgs),
    buildStrategicTemperament(builderArgs),
    buildDecisionConditions(builderArgs),
  ];

  return {
    meta: {
      reportType: "amc_report_payload",
      version: "v1",
      generatedAt: now().toISOString(),
    },
    inputs: {
      normalized,
      structuralFlags,
      inputSummary,
    },
    sections,
  };
}
