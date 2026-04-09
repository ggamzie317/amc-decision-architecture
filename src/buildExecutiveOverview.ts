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
      return `This is a one-path structural viability memo centered on ${decision}, where cross-market conversion burden is the dominant frame.`;
    }
    if (singleContext.runwayPressure) {
      return `This is a one-path structural viability memo centered on ${decision}, where runway integrity and downside containment are first-order.`;
    }
    return `This is a one-path structural viability memo centered on ${decision}.`;
  }
  return "This case is treated as a one-path structural viability memo under current conditions.";
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
      return "The burden topology clusters around runway pressure, readiness gaps, and execution load concentration.";
    }
    return "The burden topology clusters across stability fragility, clarity gaps, and execution strain.";
  }
  if (singleContext.identityLoad) {
    return "The one-path frame is shaped by a mismatch between near-term continuity logic and longer-horizon identity fit.";
  }
  return "The frame is less preference-led and more dependent on whether this path can hold structural alignment over time.";
}

function buildImplicationLine(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  caseType: "single" | "comparative",
): string {
  const singleContext = inferSingleContext(normalized, flags);
  if (flags.highExecutionRisk) {
    return "Implication: treat commitment as staged governance, with evidence discipline and reversibility held throughout.";
  }
  if (flags.highInterpretiveNeed) {
    return "Implication: resolve signal ambiguity first, then tighten commitment only after structural coherence improves.";
  }
  if (caseType === "comparative") {
    return "Implication: side-by-side condition testing is more defensible than a one-time preference call.";
  }
  if (singleContext.recoveryLoad) {
    return "Implication: preserve recovery bandwidth while execution proof and support depth are consolidated.";
  }
  return "Implication: commitment quality should follow structural hold quality, not directional confidence alone.";
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
