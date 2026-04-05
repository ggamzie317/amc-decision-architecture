import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcSectionBuilderArgs } from "./amc/builderArgs";
import { isWeakEvidence } from "./amc/weakEvidence";
import { inferCaseType } from "./amc/inferCaseType";

export interface StructuralRiskDiagnosisOutput {
  section: "structural_risk_diagnosis";
  title: "Structural Risk Diagnosis";
  caseType: "single" | "comparative";
  primaryRisk: string;
  secondaryRisk: string;
  distortionRisk: string;
  handlingLine: string;
  comparativeReading?: string;
}

export function buildStructuralRiskDiagnosis(args: AmcSectionBuilderArgs): StructuralRiskDiagnosisOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: StructuralRiskDiagnosisOutput = {
      section: "structural_risk_diagnosis",
      title: "Structural Risk Diagnosis",
      caseType,
      primaryRisk:
        "The main structural risk appears to lie in incomplete consolidation between direction, readiness, and timing.",
      secondaryRisk:
        "A secondary risk remains in uneven support and signal conditions across the broader decision structure.",
      distortionRisk:
        "Mixed evidence may distort the case by blurring the line between directional interest and executable readiness.",
      handlingLine:
        "This increases the importance of staged evaluation, stronger validation, and disciplined threshold setting.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparison appears to distribute risk across different exposure types rather than indicating a single dominant path.";
    }
    return fallback;
  }

  const primaryBucket = inferPrimaryRiskBucket(structuralFlags);
  const secondaryBucket = inferSecondaryRiskBucket(structuralFlags, caseType);
  const distortionBucket = inferDistortionBucket(structuralFlags);
  const handlingBucket = inferHandlingBucket(structuralFlags, caseType);
  const singleContext = inferSingleRiskContext(normalized, structuralFlags);

  const output: StructuralRiskDiagnosisOutput = {
    section: "structural_risk_diagnosis",
    title: "Structural Risk Diagnosis",
    caseType,
    primaryRisk: buildPrimaryRisk(primaryBucket, caseType, singleContext),
    secondaryRisk: buildSecondaryRisk(secondaryBucket, caseType, singleContext),
    distortionRisk: buildDistortionRisk(distortionBucket, caseType, singleContext),
    handlingLine: buildHandlingLine(handlingBucket, caseType, singleContext),
  };

  if (caseType === "comparative") {
    const comparativeText = [
      normalized.mainDecision,
      normalized.optionsUnderConsideration,
      normalized.nonNegotiable,
      normalized.biggestRisks,
      ...(normalized.topPriorities || []),
    ]
      .join(" ")
      .toLowerCase();

    const familyAsiaTransitionCase =
      /(china|beijing)/.test(comparativeText) &&
      /(overseas|singapore|asia transition)/.test(comparativeText) &&
      /(family|children|education|school|housing)/.test(comparativeText);

    const reemploymentVsSearchCase =
      /(job offer|reemployment|lower-paid|startup|unemployment benefits|continued search|benefits)/.test(comparativeText) &&
      /(income stability|company stability|psychological recovery)/.test(comparativeText);

    output.comparativeReading = familyAsiaTransitionCase
      ? "One path carries the risk of long-term ceiling and eventual narrowing, while the other carries relocation burden, family adjustment risk, and possible early-exit exposure."
      : reemploymentVsSearchCase
        ? "One path reduces immediate income anxiety but may lock in weaker pay and company stability, while the other preserves search optionality but extends uncertainty and psychological strain."
        : buildComparativeReading(primaryBucket, secondaryBucket, distortionBucket);
  }

  return output;
}



type PrimaryRiskBucket =
  | "readiness_ahead"
  | "ambiguity_timing"
  | "fragile_support"
  | "external_overread"
  | "internal_stagnation";

type SecondaryRiskBucket =
  | "uneven_support"
  | "fragmented_signals"
  | "comparison_overload"
  | "translation_difficulty"
  | "restructuring_instability";

type DistortionBucket =
  | "urgency_compression"
  | "interest_vs_readiness"
  | "upside_bias"
  | "familiarity_bias"
  | "signal_fragmentation";

type HandlingBucket =
  | "condition_based"
  | "threshold_staged"
  | "evidence_sequencing"
  | "separate_interest_readiness";
type SingleRiskContext = {
  runwayExposure: boolean;
  recoveryExposure: boolean;
  reentryExposure: boolean;
};

function inferSingleRiskContext(normalized: AmcNormalizedIntake, flags: AmcDerivedFlags): SingleRiskContext {
  const text = [
    normalized.mainDecision,
    normalized.biggestRisks,
    normalized.nonNegotiable,
    normalized.mustAnswerQuestion,
    normalized.stayScenario12to18m,
    ...(normalized.topPriorities || []),
  ]
    .join(" ")
    .toLowerCase();

  return {
    runwayExposure:
      flags.weakSafetyNet || /(runway|cash burn|income cliff|liquidity|buffer|monthly burn|benefits end)/.test(text),
    recoveryExposure: /(psychological|recovery|exhaustion|strain|anxiety|confidence loss)/.test(text),
    reentryExposure: /(re-entry|search|conversion|market readability|weak early lock-in|lower-paid)/.test(text),
  };
}

function inferPrimaryRiskBucket(flags: AmcDerivedFlags): PrimaryRiskBucket {
  if (flags.highExecutionRisk && (flags.allInCommitmentStyle || flags.lowDecisionClarity)) {
    return "readiness_ahead";
  }
  if (flags.highUrgency && (flags.urgencyUnclear || flags.mediumDecisionClarity || flags.someRestructuringRisk)) {
    return "ambiguity_timing";
  }
  if (flags.structurallyFragileMove || flags.weakSafetyNet || flags.lowSponsorSupport) {
    return "fragile_support";
  }
  if (flags.highExternalExposure && flags.lowDecisionClarity) {
    return "external_overread";
  }
  return "internal_stagnation";
}

function inferSecondaryRiskBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): SecondaryRiskBucket {
  if (flags.lowSponsorSupport || flags.weakSafetyNet || flags.mediumDecisionClarity) {
    return "uneven_support";
  }
  if (flags.unclearMarketOutlook || flags.highInterpretiveNeed) {
    return "fragmented_signals";
  }
  if (caseType === "comparative" && (flags.mediumDifferentiation || flags.someRestructuringRisk)) {
    return "comparison_overload";
  }
  if (flags.lowDifferentiation || flags.lowDecisionClarity) {
    return "translation_difficulty";
  }
  return "restructuring_instability";
}

function inferDistortionBucket(flags: AmcDerivedFlags): DistortionBucket {
  if (flags.highUrgency) {
    return "urgency_compression";
  }
  if (flags.highExecutionRisk || flags.lowDecisionClarity) {
    return "interest_vs_readiness";
  }
  if (flags.upsideMaximizingStyle && flags.highExternalExposure) {
    return "upside_bias";
  }
  if (flags.highCompanyStability && flags.lowDifferentiation) {
    return "familiarity_bias";
  }
  return "signal_fragmentation";
}

function inferHandlingBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): HandlingBucket {
  if (flags.highExecutionRisk || flags.structurallyFragileMove) {
    return "threshold_staged";
  }
  if (caseType === "comparative") {
    return "condition_based";
  }
  if (flags.highInterpretiveNeed || flags.unclearMarketOutlook) {
    return "evidence_sequencing";
  }
  return "separate_interest_readiness";
}

function buildPrimaryRisk(
  bucket: PrimaryRiskBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "readiness_ahead") {
    return caseType === "single" && context.reentryExposure
      ? "The main risk appears to be single-path movement logic running ahead of re-entry proof and internal consolidation."
      : "The main risk appears to be movement logic running ahead of execution proof and internal consolidation.";
  }
  if (bucket === "ambiguity_timing") {
    return "The main risk appears to be prolonged ambiguity under rising timing pressure and incomplete decision consolidation.";
  }
  if (bucket === "fragile_support") {
    return caseType === "single" && context.runwayExposure
      ? "The main risk appears to be a fragile single-path structure carried by uneven support and runway-sensitive downside exposure."
      : "The main risk appears to be a fragile move structure carried by uneven support and constrained downside protection.";
  }
  if (bucket === "external_overread") {
    return "The main risk appears to be over-reading external upside before transition infrastructure is sufficiently reinforced.";
  }
  return caseType === "comparative"
    ? "The main risk appears to be carrying a two-path frame without sufficiently differentiated internal risk evidence."
    : context.reentryExposure
      ? "The main risk appears to be maintaining the current path while re-entry viability and repositioning logic remain under-validated."
      : "The main risk appears to be remaining in a weakening internal structure without clarified repositioning logic.";
}

function buildSecondaryRisk(
  bucket: SecondaryRiskBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "uneven_support") {
    return caseType === "single" && context.recoveryExposure
      ? "A secondary risk lies in uneven support depth across sponsor backing, safety coverage, and recovery capacity."
      : "A secondary risk lies in uneven support conditions across sponsor backing, safety coverage, and timing resilience.";
  }
  if (bucket === "fragmented_signals") {
    return "A secondary risk appears in fragmented signal visibility and partial narrative transferability across decision conditions.";
  }
  if (bucket === "comparison_overload") {
    return "A secondary risk lies in carrying a high-burden comparison without sufficiently separated evidence thresholds.";
  }
  if (bucket === "translation_difficulty") {
    return "A secondary risk appears in translation difficulty, where directional intent remains stronger than external legibility.";
  }
  return caseType === "comparative"
    ? "A secondary risk remains in background restructuring instability that may shift comparative assumptions over time."
    : "A secondary risk remains in restructuring-related instability that can weaken single-path planning reliability.";
}

function buildDistortionRisk(
  bucket: DistortionBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "urgency_compression") {
    return "Urgency may compress judgment before the underlying structure is sufficiently validated.";
  }
  if (bucket === "interest_vs_readiness") {
    return caseType === "single" && context.reentryExposure
      ? "Directional interest may be mistaken for executable readiness while key re-entry conditions remain uneven."
      : "Directional interest may be mistaken for executable readiness while key conditions remain uneven.";
  }
  if (bucket === "upside_bias") {
    return "External attractiveness may be overweighted relative to the burden of conversion and execution.";
  }
  if (bucket === "familiarity_bias") {
    return caseType === "comparative"
      ? "Internal familiarity may be overweighted relative to future-fit requirements in the comparative frame."
      : "Internal familiarity may be overweighted relative to longer-horizon fit and adaptability.";
  }
  return "Mixed signals may distort the process by generating either false confidence or false paralysis.";
}

function buildHandlingLine(
  bucket: HandlingBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "condition_based") {
    return "Risk handling quality depends on condition-based evaluation and disciplined side-by-side thresholding.";
  }
  if (bucket === "threshold_staged") {
    return caseType === "single" && context.runwayExposure
      ? "Risk control depends on explicit thresholds, staged validation, and runway-aware sequencing discipline."
      : "Risk control depends on explicit thresholds, staged validation, and sequencing discipline.";
  }
  if (bucket === "evidence_sequencing") {
    return "Risk defensibility improves when evidence strengthening and sequence control precede commitment tightening.";
  }
  return caseType === "comparative"
    ? "Risk handling requires separating directional preference from path-specific readiness conditions."
    : "Risk handling requires separating single-path directional interest from executable readiness.";
}

function buildComparativeReading(
  primary: PrimaryRiskBucket,
  secondary: SecondaryRiskBucket,
  distortion: DistortionBucket,
): string {
  if (primary === "fragile_support" || secondary === "uneven_support") {
    return "One path may carry continuity risk, while the other carries heavier translation and execution risk under uneven support.";
  }
  if (distortion === "familiarity_bias" || distortion === "upside_bias") {
    return "The comparison suggests different risk forms rather than a simple strong-versus-weak choice.";
  }
  return "The main contrast appears to lie in where uncertainty sits: stability erosion on one side and mobility burden on the other.";
}
