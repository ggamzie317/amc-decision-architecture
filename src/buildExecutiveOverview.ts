import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcSectionBuilderArgs } from "./amc/builderArgs";
import { inferCaseType } from "./amc/inferCaseType";

export interface ExecutiveOverviewOutput {
  section: "executive_overview";
  title: "이번 결정의 핵심 구조";
  caseType: "single" | "comparative";
  overviewLine: string;
  structuralTension: string;
  readingLine: string;
  implicationLine: string;
}

export function buildExecutiveOverview(args: AmcSectionBuilderArgs): ExecutiveOverviewOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const tension = inferStructuralTension(structuralFlags, caseType);

  return {
    section: "executive_overview",
    title: "이번 결정의 핵심 구조",
    caseType,
    overviewLine: buildOverviewLine(normalized, caseType),
    structuralTension: tension,
    readingLine: buildReadingLine(structuralFlags, caseType),
    implicationLine: buildImplicationLine(structuralFlags, caseType),
  };
}

function inferStructuralTension(flags: AmcDerivedFlags, caseType: "single" | "comparative"): string {
  if (flags.highUrgency && (flags.weakSafetyNet || flags.lowDecisionClarity)) {
    return "Timing pressure versus readiness gap remains the central structural tension.";
  }
  if (flags.weakSafetyNet || flags.highExternalExposure) {
    return "Stability versus upside remains the key tension in the current decision structure.";
  }
  if (flags.lowDecisionClarity || flags.uncertainSponsorSupport || flags.someRestructuringRisk) {
    return "Credibility versus transition friction appears to be the defining structural tension.";
  }
  if (caseType === "comparative") {
    return "Internal continuity versus external repositioning remains the core comparative tension.";
  }
  return "Exploration intent versus structural safety needs remains the central decision tension.";
}

function buildOverviewLine(normalized: AmcNormalizedIntake, caseType: "single" | "comparative"): string {
  const decision = clean(normalized.mainDecision);

  if (caseType === "comparative") {
    if (decision) {
      return `This case is structured as a two-path decision around ${decision}, with exposure distributed differently across each path.`;
    }
    return "This case is framed as an explicit two-path comparison rather than a single-path reflection.";
  }

  if (decision) {
    return `This case is handled as a single-path structural assessment around ${decision}.`;
  }
  return "This case is being handled as a single-path structural review under current conditions.";
}

function buildReadingLine(flags: AmcDerivedFlags, caseType: "single" | "comparative"): string {
  if (caseType === "comparative") {
    if (flags.structurallyFragileMove || flags.highExecutionRisk) {
      return "The comparison indicates asymmetric exposure across continuity, mobility, and execution readiness.";
    }
    return "The comparison indicates that preference alone is insufficient because structural exposure remains uneven across paths.";
  }

  if (flags.structurallySupportedMove && !flags.highExecutionRisk) {
    return "The current path appears structurally serviceable, while still dependent on disciplined execution control.";
  }
  if (flags.structurallyFragileMove || flags.highExecutionRisk) {
    return "The decision structure appears constrained by concentrated exposure across stability, clarity, and execution conditions.";
  }
  return "The case appears to be shaped less by preference and more by how current structure aligns with future direction.";
}

function buildImplicationLine(flags: AmcDerivedFlags, caseType: "single" | "comparative"): string {
  if (flags.highExecutionRisk) {
    return "This increases the importance of staged sequencing, explicit evidence thresholds, and reversible commitment logic.";
  }
  if (flags.highInterpretiveNeed) {
    return "This indicates that unresolved signals should be handled through staged structural evaluation rather than accelerated commitment.";
  }
  if (caseType === "comparative") {
    return "This makes side-by-side condition testing more defensible than a one-time preference call.";
  }
  return "This indicates that commitment quality depends on maintaining structural conditions rather than directional confidence alone.";
}

function clean(text: string): string {
  return (text || "").trim();
}
