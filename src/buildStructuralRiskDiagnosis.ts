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
        "Risk concentration is centered on incomplete consolidation between direction, readiness, and timing.",
      secondaryRisk:
        "A secondary exposure cluster sits in uneven support depth and fragmented signal quality.",
      distortionRisk:
        "Distortion risk sits in signal mixing, where directional pull and executable readiness are not cleanly separated.",
      handlingLine:
        "Risk posture is best managed through staged evaluation, stronger validation depth, and explicit thresholds.",
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
      ? "Primary exposure sits in single-path movement logic running ahead of re-entry proof and internal consolidation."
      : "Primary exposure sits in movement logic running ahead of execution proof and internal consolidation.";
  }
  if (bucket === "ambiguity_timing") {
    return "Primary exposure sits in prolonged ambiguity under rising timing pressure and incomplete decision consolidation.";
  }
  if (bucket === "fragile_support") {
    return caseType === "single" && context.runwayExposure
      ? "Primary exposure sits in a fragile single-path structure carried by uneven support and runway-sensitive downside risk."
      : "Primary exposure sits in a fragile move structure carried by uneven support and constrained downside protection.";
  }
  if (bucket === "external_overread") {
    return "Primary exposure sits in over-reading external upside before transition infrastructure is sufficiently reinforced.";
  }
  return caseType === "comparative"
    ? "Primary exposure sits in carrying a two-path frame without sufficiently differentiated internal risk evidence."
    : context.reentryExposure
      ? "Primary exposure sits in maintaining the current path while re-entry viability and repositioning logic remain under-validated."
      : "Primary exposure sits in remaining within a weakening internal structure without clarified repositioning logic.";
}

function buildSecondaryRisk(
  bucket: SecondaryRiskBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "uneven_support") {
    return caseType === "single" && context.recoveryExposure
      ? "Secondary exposure clusters in uneven support depth across sponsor backing, safety coverage, and recovery capacity."
      : "Secondary exposure clusters in uneven support conditions across sponsor backing, safety coverage, and timing resilience.";
  }
  if (bucket === "fragmented_signals") {
    return "Secondary exposure clusters in fragmented signal visibility and partial narrative transferability across decision conditions.";
  }
  if (bucket === "comparison_overload") {
    return "Secondary exposure clusters in high-burden comparison handling without sufficiently separated evidence thresholds.";
  }
  if (bucket === "translation_difficulty") {
    return "Secondary exposure clusters in translation difficulty, where directional intent remains stronger than external legibility.";
  }
  return caseType === "comparative"
    ? "Secondary exposure clusters in background restructuring instability that may shift comparative assumptions over time."
    : "Secondary exposure clusters in restructuring-related instability that can weaken single-path planning reliability.";
}

function buildDistortionRisk(
  bucket: DistortionBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "urgency_compression") {
    return "Distortion pressure is urgency compression before the underlying structure is sufficiently validated.";
  }
  if (bucket === "interest_vs_readiness") {
    return caseType === "single" && context.reentryExposure
      ? "Distortion pressure is conflating directional interest with executable readiness while key re-entry conditions remain uneven."
      : "Distortion pressure is conflating directional interest with executable readiness while key conditions remain uneven.";
  }
  if (bucket === "upside_bias") {
    return "Distortion pressure is upside overweighting relative to conversion and execution burden.";
  }
  if (bucket === "familiarity_bias") {
    return caseType === "comparative"
      ? "Distortion pressure is familiarity overweighting relative to future-fit requirements in the comparative frame."
      : "Distortion pressure is familiarity overweighting relative to longer-horizon fit and adaptability.";
  }
  return "Distortion pressure is mixed-signal loading, generating false confidence or false paralysis.";
}

function buildHandlingLine(
  bucket: HandlingBucket,
  caseType: "single" | "comparative",
  context: SingleRiskContext,
): string {
  if (bucket === "condition_based") {
    return "Risk management quality is highest under condition-based evaluation and disciplined side-by-side thresholding.";
  }
  if (bucket === "threshold_staged") {
    if (caseType === "single") {
      return context.runwayExposure
        ? "Diagnostic priority is to map and monitor runway-linked burden nodes before they compound into commitment instability."
        : "Diagnostic priority is to map burden concentration by sequence stage before governance thresholds are tightened.";
    }
    return "Risk control is strongest with explicit thresholds, staged validation, and sequencing discipline.";
  }
  if (bucket === "evidence_sequencing") {
    return caseType === "single"
      ? "Diagnostic priority is to separate signal quality from directional pull so pressure is tracked by node, not mood."
      : "Risk defensibility rises when evidence strengthening and sequence control precede commitment tightening.";
  }
  return caseType === "comparative"
    ? "Risk handling requires separating directional preference from path-specific readiness conditions."
    : "Diagnostic priority is to isolate where single-path strain is accumulating before governance thresholds are tightened.";
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
