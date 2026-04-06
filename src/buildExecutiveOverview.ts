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
    overviewLine: buildOverviewLine(normalized, structuralFlags, caseType),
    structuralTension: tension,
    readingLine: buildReadingLine(normalized, structuralFlags, caseType),
    implicationLine: buildImplicationLine(normalized, structuralFlags, caseType),
  };
}

function inferStructuralTension(flags: AmcDerivedFlags, caseType: "single" | "comparative"): string {
  if (flags.highUrgency && (flags.weakSafetyNet || flags.lowDecisionClarity)) {
    return "The core tension is timing pressure against readiness depth.";
  }
  if (flags.weakSafetyNet || flags.highExternalExposure) {
    return "The core tension is downside stability versus upside pursuit.";
  }
  if (flags.lowDecisionClarity || flags.uncertainSponsorSupport || flags.someRestructuringRisk) {
    return "The defining tension is credibility continuity versus transition friction.";
  }
  if (caseType === "comparative") {
    return "The comparative tension is internal continuity versus external repositioning.";
  }
  return "The central tension is exploration intent against structural safety requirements.";
}

function buildOverviewLine(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  caseType: "single" | "comparative",
): string {
  const decision = clean(normalized.mainDecision);
  const singleContext = inferSingleContext(normalized, flags);

  if (caseType === "comparative") {
    if (decision) {
      return `The case is framed as a two-path decision around ${decision}, with exposure concentrated in different places by path.`;
    }
    return "The case is framed as an explicit two-path comparison, not a single-path reflection.";
  }

  if (decision) {
    if (singleContext.relocationPressure) {
      return `The case is handled as a single-path structural assessment around ${decision}, with cross-market transition burden treated as first-order.`;
    }
    if (singleContext.runwayPressure) {
      return `The case is handled as a single-path structural assessment around ${decision}, with runway stability and downside control treated as first-order.`;
    }
    return `The case is handled as a single-path structural assessment around ${decision}.`;
  }
  return "The case is being handled as a single-path structural review under current conditions.";
}

function buildReadingLine(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  caseType: "single" | "comparative",
): string {
  const singleContext = inferSingleContext(normalized, flags);
  if (caseType === "comparative") {
    if (flags.structurallyFragileMove || flags.highExecutionRisk) {
      return "At comparison level, exposure is asymmetric across continuity, mobility, and execution readiness.";
    }
    return "Preference alone is insufficient; structural exposure is uneven across paths.";
  }

  if (flags.structurallySupportedMove && !flags.highExecutionRisk) {
    return "The active path is structurally serviceable, but still contingent on disciplined execution control.";
  }
  if (flags.structurallyFragileMove || flags.highExecutionRisk) {
    if (singleContext.runwayPressure) {
      return "Single-path exposure is concentrated in runway pressure, readiness uncertainty, and execution load.";
    }
    return "Decision exposure is concentrated across stability, clarity, and execution conditions.";
  }
  if (singleContext.identityLoad) {
    return "The single-path frame is shaped by a gap between role continuity and longer-horizon identity fit.";
  }
  return "The case is shaped less by preference and more by structural alignment with future direction.";
}

function buildImplicationLine(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  caseType: "single" | "comparative",
): string {
  const singleContext = inferSingleContext(normalized, flags);
  if (flags.highExecutionRisk) {
    return "Implication: sequence in stages, hold explicit evidence gates, and keep commitment reversible.";
  }
  if (flags.highInterpretiveNeed) {
    return "Implication: resolve signal gaps through staged structural evaluation, not accelerated commitment.";
  }
  if (caseType === "comparative") {
    return "Implication: side-by-side condition testing is more defensible than a one-time preference call.";
  }
  if (singleContext.recoveryLoad) {
    return "Implication: protect recovery capacity while execution proof and support depth are consolidated.";
  }
  return "Implication: commitment quality follows structural conditions, not directional confidence alone.";
}

function inferSingleContext(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
): { runwayPressure: boolean; relocationPressure: boolean; identityLoad: boolean; recoveryLoad: boolean } {
  const text = [
    normalized.mainDecision,
    normalized.optionsUnderConsideration,
    normalized.biggestRisks,
    normalized.nonNegotiable,
    normalized.mustAnswerQuestion,
    ...(normalized.topPriorities || []),
  ]
    .join(" ")
    .toLowerCase();

  return {
    runwayPressure:
      flags.weakSafetyNet ||
      /(runway|cash burn|buffer|income|liquidity|benefits end|monthly burn)/.test(text),
    relocationPressure: /(relocat|overseas|abroad|cross-market|international)/.test(text),
    identityLoad: /(identity|fit|meaning|role coherence|future fit|platform value)/.test(text),
    recoveryLoad: /(recovery|psychological|strain|anxiety|exhaustion|confidence loss)/.test(text),
  };
}

function clean(text: string): string {
  return (text || "").trim();
}
