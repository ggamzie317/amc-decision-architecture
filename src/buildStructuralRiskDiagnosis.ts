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

  const output: StructuralRiskDiagnosisOutput = {
    section: "structural_risk_diagnosis",
    title: "Structural Risk Diagnosis",
    caseType,
    primaryRisk: buildPrimaryRisk(primaryBucket, caseType),
    secondaryRisk: buildSecondaryRisk(secondaryBucket, caseType),
    distortionRisk: buildDistortionRisk(distortionBucket, caseType),
    handlingLine: buildHandlingLine(handlingBucket, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(primaryBucket, secondaryBucket, distortionBucket);
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

function buildPrimaryRisk(bucket: PrimaryRiskBucket, caseType: "single" | "comparative"): string {
  if (bucket === "readiness_ahead") {
    return "The main risk appears to be movement logic running ahead of execution proof and internal consolidation.";
  }
  if (bucket === "ambiguity_timing") {
    return "The main risk appears to be prolonged ambiguity under rising timing pressure and incomplete decision consolidation.";
  }
  if (bucket === "fragile_support") {
    return "The main risk appears to be a fragile move structure carried by uneven support and constrained downside protection.";
  }
  if (bucket === "external_overread") {
    return "The main risk appears to be over-reading external upside before transition infrastructure is sufficiently reinforced.";
  }
  return caseType === "comparative"
    ? "The main risk appears to be carrying a two-path frame without sufficiently differentiated internal risk evidence."
    : "The main risk appears to be remaining in a weakening internal structure without clarified repositioning logic.";
}

function buildSecondaryRisk(bucket: SecondaryRiskBucket, caseType: "single" | "comparative"): string {
  if (bucket === "uneven_support") {
    return "A secondary risk lies in uneven support conditions across sponsor backing, safety coverage, and timing resilience.";
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
    : "A secondary risk remains in restructuring-related instability that can weaken planning reliability.";
}

function buildDistortionRisk(bucket: DistortionBucket, caseType: "single" | "comparative"): string {
  if (bucket === "urgency_compression") {
    return "Urgency may compress judgment before the underlying structure is sufficiently validated.";
  }
  if (bucket === "interest_vs_readiness") {
    return "Directional interest may be mistaken for executable readiness while key conditions remain uneven.";
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

function buildHandlingLine(bucket: HandlingBucket, caseType: "single" | "comparative"): string {
  if (bucket === "condition_based") {
    return "This increases the importance of condition-based evaluation and disciplined side-by-side thresholding.";
  }
  if (bucket === "threshold_staged") {
    return "This suggests handling the case through explicit thresholds, staged validation, and sequencing discipline.";
  }
  if (bucket === "evidence_sequencing") {
    return "This increases the value of evidence strengthening and sequence control before commitment logic is tightened.";
  }
  return caseType === "comparative"
    ? "This indicates that handling quality depends on separating directional preference from path-specific readiness conditions."
    : "This indicates that handling quality depends on separating directional interest from executable readiness.";
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
