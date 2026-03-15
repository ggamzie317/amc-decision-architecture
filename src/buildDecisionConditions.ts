import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcInputSummary } from "./amc/buildInputSummary";

export interface DecisionConditionsOutput {
  section: "decision_conditions";
  title: "Decision Conditions";
  caseType: "single" | "comparative";
  validationCondition: string;
  readinessCondition: string;
  supportCondition: string;
  commitmentCondition: string;
  comparativeReading?: string;
}

export function buildDecisionConditions(args: {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
}): DecisionConditionsOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: DecisionConditionsOutput = {
      section: "decision_conditions",
      title: "Decision Conditions",
      caseType,
      validationCondition: "Clearer validation would improve the defensibility of the broader decision structure.",
      readinessCondition:
        "Readiness appears directionally present, though further consolidation would strengthen timing and execution alignment.",
      supportCondition:
        "Support conditions appear partially present, but stronger reinforcement would improve structural stability.",
      commitmentCondition:
        "Firmer commitment becomes more defensible when validation, readiness, and support conditions are more clearly aligned.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparison appears to require different validation emphases rather than a single shared condition set.";
    }

    return fallback;
  }

  const validation = inferValidationBucket(structuralFlags, caseType);
  const readiness = inferReadinessBucket(structuralFlags);
  const support = inferSupportBucket(structuralFlags);
  const commitment = inferCommitmentBucket(structuralFlags, caseType);

  const output: DecisionConditionsOutput = {
    section: "decision_conditions",
    title: "Decision Conditions",
    caseType,
    validationCondition: buildValidationCondition(validation, caseType),
    readinessCondition: buildReadinessCondition(readiness, caseType),
    supportCondition: buildSupportCondition(support, caseType),
    commitmentCondition: buildCommitmentCondition(commitment, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(validation, readiness, support);
  }

  return output;
}

function inferCaseType(normalized: AmcNormalizedIntake, summary: AmcInputSummary): "single" | "comparative" {
  const text = [normalized.optionsUnderConsideration, summary.decisionSnapshot.optionsUnderConsideration]
    .join(" ")
    .toLowerCase();

  const comparativeSignals = ["option a", "option b", "option 1", "option 2", " vs ", "versus", "compared"];
  if (comparativeSignals.some((signal) => text.includes(signal))) {
    return "comparative";
  }
  return "single";
}

function isWeakEvidence(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  summary: AmcInputSummary,
): boolean {
  const hasDecisionText =
    (normalized.mainDecision || "").trim().length > 0 ||
    (normalized.optionsUnderConsideration || "").trim().length > 0 ||
    (summary.decisionSnapshot.optionsUnderConsideration || "").trim().length > 0;

  return !hasDecisionText && flags.highInterpretiveNeed;
}

type ValidationBucket = "proof_gap" | "comparison_clarity" | "transferability_validation" | "signal_consolidation";
type ReadinessBucket = "execution_alignment" | "timing_sync" | "threshold_definition" | "interest_vs_readiness_gap";
type SupportBucket = "sponsor_safety" | "resource_backing" | "fallback_protection" | "support_partial";
type CommitmentBucket = "aligned_conditions" | "threshold_commitment" | "proof_before_speed" | "consolidation_over_pressure";

function inferValidationBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): ValidationBucket {
  if (caseType === "comparative" && (flags.mediumDifferentiation || flags.highInterpretiveNeed)) {
    return "comparison_clarity";
  }
  if (flags.lowDifferentiation || flags.highExternalExposure || flags.lowDecisionClarity) {
    return "transferability_validation";
  }
  if (flags.highInterpretiveNeed || flags.unclearMarketOutlook || flags.someRestructuringRisk) {
    return "signal_consolidation";
  }
  return "proof_gap";
}

function inferReadinessBucket(flags: AmcDerivedFlags): ReadinessBucket {
  if (flags.highExecutionRisk || flags.lowDecisionClarity) {
    return "interest_vs_readiness_gap";
  }
  if (flags.highUrgency && (flags.mediumDecisionClarity || flags.someRestructuringRisk)) {
    return "timing_sync";
  }
  if (flags.structurallyFragileMove || flags.highInterpretiveNeed) {
    return "threshold_definition";
  }
  return "execution_alignment";
}

function inferSupportBucket(flags: AmcDerivedFlags): SupportBucket {
  if (flags.lowSponsorSupport || flags.weakSafetyNet) {
    return "sponsor_safety";
  }
  if (flags.lowCompanyStability || flags.someRestructuringRisk) {
    return "resource_backing";
  }
  if (flags.moderateSafetyNet || flags.uncertainSponsorSupport) {
    return "fallback_protection";
  }
  return "support_partial";
}

function inferCommitmentBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): CommitmentBucket {
  if (flags.structurallySupportedMove && flags.highDecisionClarity && !flags.highExecutionRisk) {
    return "aligned_conditions";
  }
  if (flags.highExecutionRisk || flags.structurallyFragileMove) {
    return "threshold_commitment";
  }
  if (flags.highUrgency || flags.allInCommitmentStyle) {
    return "proof_before_speed";
  }
  if (caseType === "comparative" || flags.highInterpretiveNeed) {
    return "consolidation_over_pressure";
  }
  return "consolidation_over_pressure";
}

function buildValidationCondition(bucket: ValidationBucket, caseType: "single" | "comparative"): string {
  if (bucket === "proof_gap") {
    return "Clearer external proof would improve the defensibility of movement logic under the current structure.";
  }
  if (bucket === "comparison_clarity") {
    return "The case would benefit from more explicit comparison evidence across risk burden, readiness, and future-fit logic.";
  }
  if (bucket === "transferability_validation") {
    return "Firmer validation of transferability and market readability would strengthen structural defensibility.";
  }
  return caseType === "comparative"
    ? "Signal consolidation remains important so that comparative differences reflect validated structure rather than interpretation gaps."
    : "Stronger differentiation between directional interest and executable fit remains important for validation quality.";
}

function buildReadinessCondition(bucket: ReadinessBucket, caseType: "single" | "comparative"): string {
  if (bucket === "execution_alignment") {
    return "Readiness would become more defensible with clearer execution logic and stable timing alignment.";
  }
  if (bucket === "timing_sync") {
    return "Timing and readiness appear directionally close, though not yet fully synchronized under current pressure conditions.";
  }
  if (bucket === "threshold_definition") {
    return "Execution readiness would benefit from clearer sequencing, threshold definition, and proof discipline.";
  }
  return caseType === "comparative"
    ? "Stronger readiness depends on path-specific evidence rather than directional intent carried across both options."
    : "Stronger readiness depends on movement logic being supported by evidence rather than directional intent alone.";
}

function buildSupportCondition(bucket: SupportBucket, caseType: "single" | "comparative"): string {
  if (bucket === "sponsor_safety") {
    return "Support conditions would strengthen with clearer sponsor backing and stronger downside safety logic.";
  }
  if (bucket === "resource_backing") {
    return "The structure would become more stable with stronger practical support across timing, resources, and execution capacity.";
  }
  if (bucket === "fallback_protection") {
    return "Fallback protection remains important for stabilizing defensibility while transition conditions are still forming.";
  }
  return caseType === "comparative"
    ? "Support logic appears present, though not yet equally reinforced across the two paths."
    : "Support logic appears present, though not yet sufficiently reinforced across the broader decision frame.";
}

function buildCommitmentCondition(bucket: CommitmentBucket, caseType: "single" | "comparative"): string {
  if (bucket === "aligned_conditions") {
    return "Firmer commitment becomes more defensible once validation, readiness, and support conditions remain aligned over time.";
  }
  if (bucket === "threshold_commitment") {
    return "Commitment appears more defensible under explicit thresholds rather than under accumulated pressure.";
  }
  if (bucket === "proof_before_speed") {
    return "Stronger commitment depends on reducing the gap between directional logic and execution proof before pace accelerates.";
  }
  return caseType === "comparative"
    ? "Commitment quality depends less on speed and more on condition consolidation across both paths."
    : "This suggests that commitment quality depends less on speed than on condition consolidation.";
}

function buildComparativeReading(
  validation: ValidationBucket,
  readiness: ReadinessBucket,
  support: SupportBucket,
): string {
  if (validation === "comparison_clarity" || readiness === "interest_vs_readiness_gap") {
    return "The key difference appears to lie in what must be validated, not simply in which option appears stronger.";
  }
  if (support === "sponsor_safety" || support === "resource_backing") {
    return "One path may require less transition validation, while the other requires stronger proof of portability and burden manageability.";
  }
  return "The two paths appear to require different condition sets across risk, support, and readiness alignment.";
}
