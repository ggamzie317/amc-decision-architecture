import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcSectionBuilderArgs } from "./amc/builderArgs";
import { isWeakEvidence } from "./amc/weakEvidence";
import { inferCaseType } from "./amc/inferCaseType";

export interface DecisionConditionsOutput {
  section: "decision_conditions";
  title: "결정이 가능한 조건";
  caseType: "single" | "comparative";
  validationCondition: string;
  readinessCondition: string;
  supportCondition: string;
  commitmentCondition: string;
  comparativeReading?: string;
  nativeMetadata?: {
    weakEvidence: boolean;
    validationBucket: ValidationBucket | "fallback";
    readinessBucket: ReadinessBucket | "fallback";
    supportBucket: SupportBucket | "fallback";
    commitmentBucket: CommitmentBucket | "fallback";
    reassessmentTriggerType: "signal_instability" | "timing_misalignment" | "support_erosion" | "risk_deterioration";
    explorationDesignHints: {
      experiment1: string;
      experiment2: string;
      experiment3: string;
    };
  };
}

export function buildDecisionConditions(args: AmcSectionBuilderArgs): DecisionConditionsOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: DecisionConditionsOutput = {
      section: "decision_conditions",
      title: "결정이 가능한 조건",
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
    fallback.nativeMetadata = {
      weakEvidence: true,
      validationBucket: "fallback",
      readinessBucket: "fallback",
      supportBucket: "fallback",
      commitmentBucket: "fallback",
      reassessmentTriggerType: "signal_instability",
      explorationDesignHints: {
        experiment1: "Use short market-readability checks to replace assumption-driven inference.",
        experiment2: "Use bounded execution probes to distinguish directional interest from readiness.",
        experiment3: "Use support resilience checks before increasing commitment intensity.",
      },
    };

    return fallback;
  }

  const validation = inferValidationBucket(structuralFlags, caseType);
  const readiness = inferReadinessBucket(structuralFlags);
  const support = inferSupportBucket(structuralFlags);
  const commitment = inferCommitmentBucket(structuralFlags, caseType);

  const output: DecisionConditionsOutput = {
    section: "decision_conditions",
    title: "결정이 가능한 조건",
    caseType,
    validationCondition: buildValidationCondition(validation, caseType),
    readinessCondition: buildReadinessCondition(readiness, caseType),
    supportCondition: buildSupportCondition(support, caseType),
    commitmentCondition: buildCommitmentCondition(commitment, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(validation, readiness, support);
  }
  output.nativeMetadata = {
    weakEvidence: false,
    validationBucket: validation,
    readinessBucket: readiness,
    supportBucket: support,
    commitmentBucket: commitment,
    reassessmentTriggerType: inferReassessmentTriggerType(structuralFlags),
    explorationDesignHints: {
      experiment1: buildExperiment1Hint(validation, caseType),
      experiment2: buildExperiment2Hint(readiness, caseType),
      experiment3: buildExperiment3Hint(support, caseType),
    },
  };

  return output;
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

function inferReassessmentTriggerType(
  flags: AmcDerivedFlags,
): "signal_instability" | "timing_misalignment" | "support_erosion" | "risk_deterioration" {
  if (flags.highExecutionRisk || flags.structurallyFragileMove) {
    return "risk_deterioration";
  }
  if (flags.highUrgency && flags.lowDecisionClarity) {
    return "timing_misalignment";
  }
  if (flags.lowSponsorSupport || flags.weakSafetyNet || flags.lowCompanyStability) {
    return "support_erosion";
  }
  return "signal_instability";
}

function buildExperiment1Hint(validation: ValidationBucket, caseType: "single" | "comparative"): string {
  if (validation === "comparison_clarity") {
    return "Use direct side-by-side validation checks to separate comparative signal from narrative preference.";
  }
  if (validation === "transferability_validation") {
    return "Use external transferability checks to validate portability assumptions against market evidence.";
  }
  if (validation === "proof_gap") {
    return "Use concise proof-gathering checks to close validation gaps before faster commitment moves.";
  }
  return caseType === "comparative"
    ? "Use staged signal consolidation checks so comparative differences remain evidence-linked."
    : "Use staged signal consolidation checks so directional interpretation remains evidence-linked.";
}

function buildExperiment2Hint(readiness: ReadinessBucket, caseType: "single" | "comparative"): string {
  if (readiness === "execution_alignment") {
    return "Use execution simulations to confirm that readiness logic remains stable under practical constraints.";
  }
  if (readiness === "timing_sync") {
    return "Use timing-readiness checkpoints to test whether current pace matches executable capacity.";
  }
  if (readiness === "threshold_definition") {
    return "Use explicit threshold checks to define minimum readiness before increasing commitment depth.";
  }
  return caseType === "comparative"
    ? "Use path-specific readiness probes to avoid carrying intent across options without execution proof."
    : "Use bounded readiness probes to separate directional intent from executable readiness.";
}

function buildExperiment3Hint(support: SupportBucket, caseType: "single" | "comparative"): string {
  if (support === "sponsor_safety") {
    return "Use support durability checks focused on sponsorship depth and downside coverage reliability.";
  }
  if (support === "resource_backing") {
    return "Use resource and capacity checks to confirm support resilience under real timing conditions.";
  }
  if (support === "fallback_protection") {
    return "Use fallback viability checks to confirm support continuity before stronger commitment.";
  }
  return caseType === "comparative"
    ? "Use cross-path support checks to confirm backing quality is not unevenly distributed."
    : "Use support reinforcement checks to confirm backing quality before stronger commitment.";
}
