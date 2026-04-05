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
  const singleContext = inferSingleConditionsContext(normalized, structuralFlags);

  const output: DecisionConditionsOutput = {
    section: "decision_conditions",
    title: "결정이 가능한 조건",
    caseType,
    validationCondition: buildValidationCondition(validation, caseType, singleContext),
    readinessCondition: buildReadinessCondition(readiness, caseType, singleContext),
    supportCondition: buildSupportCondition(support, caseType, singleContext),
    commitmentCondition: buildCommitmentCondition(commitment, caseType, singleContext),
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
      ? "The key condition is not simply proving external attractiveness, but confirming that an overseas move remains sustainable for family life, schooling continuity, and downside protection."
      : reemploymentVsSearchCase
        ? "The key condition is not simply whether income resumes quickly, but whether short-term relief justifies the risk of entering a weaker and less stable role too early."
        : buildComparativeReading(validation, readiness, support);

    if (familyAsiaTransitionCase) {
      output.validationCondition =
        "Validation should focus on whether the overseas path is truly viable for family stability, schooling continuity, and medium-term role durability.";
      output.readinessCondition =
        "Readiness depends less on interest alone and more on confirming relocation timing, family adjustment capacity, and realistic execution thresholds.";
      output.supportCondition =
        "Support conditions become stronger only when housing, education, and practical transition backing are concrete rather than assumed.";
      output.commitmentCondition =
        "Commitment becomes more defensible only when overseas upside does not come at the cost of family stability or elevated early-exit risk.";
    } else if (reemploymentVsSearchCase) {
      output.validationCondition =
        "Validation should focus on whether the current offer is merely relieving short-term anxiety or genuinely providing a stable and defensible next step.";
      output.readinessCondition =
        "Readiness depends on distinguishing emotional relief from structural fit, especially under recent exhaustion, urgency, and confidence loss.";
      output.supportCondition =
        "Support conditions become stronger only when the downside of accepting a weaker company and lower pay is clearly outweighed by near-term stability needs.";
      output.commitmentCondition =
        "Commitment becomes more defensible only when immediate reemployment does not materially weaken longer-term positioning or close off better search options too early.";
    }
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
type SingleConditionsContext = {
  runwaySignal: boolean;
  recoverySignal: boolean;
  relocationSignal: boolean;
};

function inferSingleConditionsContext(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
): SingleConditionsContext {
  const text = [
    normalized.mainDecision,
    normalized.nonNegotiable,
    normalized.biggestRisks,
    normalized.mustAnswerQuestion,
    normalized.stayScenario12to18m,
    ...(normalized.topPriorities || []),
  ]
    .join(" ")
    .toLowerCase();
  return {
    runwaySignal:
      flags.weakSafetyNet || /(runway|cash burn|income continuity|buffer|liquidity|benefits end|monthly burn)/.test(text),
    recoverySignal: /(recovery|psychological|strain|exhaustion|confidence loss|anxiety)/.test(text),
    relocationSignal: /(relocat|overseas|abroad|cross-market|international)/.test(text),
  };
}

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

function buildValidationCondition(
  bucket: ValidationBucket,
  caseType: "single" | "comparative",
  context: SingleConditionsContext,
): string {
  if (bucket === "proof_gap") {
    return caseType === "single" && context.runwaySignal
      ? "Defensibility improves when proof closes the gap between movement logic and verifiable runway sustainability."
      : "Defensibility improves when external proof closes the remaining gap between movement logic and verifiable evidence.";
  }
  if (bucket === "comparison_clarity") {
    return "Comparative defensibility requires clearer side-by-side evidence across burden, readiness, and future-fit conditions.";
  }
  if (bucket === "transferability_validation") {
    return caseType === "single" && context.relocationSignal
      ? "Defensibility remains conditional on firmer validation of cross-market transferability and market readability."
      : "Defensibility remains conditional on firmer validation of transferability and market readability.";
  }
  return caseType === "comparative"
    ? "Signal consolidation remains important so comparative differences reflect validated structure rather than interpretation gaps."
    : "Validation quality depends on distinguishing directional interest from executable fit with clearer signal consolidation.";
}

function buildReadinessCondition(
  bucket: ReadinessBucket,
  caseType: "single" | "comparative",
  context: SingleConditionsContext,
): string {
  if (bucket === "execution_alignment") {
    return "Readiness becomes more defensible when execution logic and timing alignment remain stable under pressure.";
  }
  if (bucket === "timing_sync") {
    return "Timing and readiness appear directionally close, though not yet fully synchronized under current pressure.";
  }
  if (bucket === "threshold_definition") {
    return caseType === "single" && context.recoverySignal
      ? "Readiness depends on clearer sequencing, explicit thresholds, and recovery-aware proof discipline before stronger commitment."
      : "Readiness depends on clearer sequencing, explicit thresholds, and proof discipline before stronger commitment.";
  }
  return caseType === "comparative"
    ? "Readiness must be validated per path, rather than carrying directional intent across both options."
    : "Readiness depends on movement logic being supported by evidence rather than directional intent alone.";
}

function buildSupportCondition(
  bucket: SupportBucket,
  caseType: "single" | "comparative",
  context: SingleConditionsContext,
): string {
  if (bucket === "sponsor_safety") {
    return "Support defensibility improves with clearer sponsor backing and stronger downside safety coverage.";
  }
  if (bucket === "resource_backing") {
    return "Support structure becomes more stable with stronger resource backing across timing, capacity, and execution load.";
  }
  if (bucket === "fallback_protection") {
    return caseType === "single" && context.runwaySignal
      ? "Fallback protection remains important for stabilizing defensibility while runway-sensitive transition conditions continue to form."
      : "Fallback protection remains important for stabilizing defensibility while transition conditions continue to form.";
  }
  return caseType === "comparative"
    ? "Support logic appears present, though not yet equally reinforced across both paths."
    : "Support logic appears present, though not yet sufficiently reinforced across the broader decision frame.";
}

function buildCommitmentCondition(
  bucket: CommitmentBucket,
  caseType: "single" | "comparative",
  context: SingleConditionsContext,
): string {
  if (bucket === "aligned_conditions") {
    return "Firmer commitment becomes defensible when validation, readiness, and support conditions remain aligned over time.";
  }
  if (bucket === "threshold_commitment") {
    return caseType === "single" && context.recoverySignal
      ? "Commitment is more defensible under explicit thresholds and recovery-protective pacing than under accumulated pressure."
      : "Commitment is more defensible under explicit thresholds than under accumulated pressure.";
  }
  if (bucket === "proof_before_speed") {
    return "Commitment quality depends on reducing the gap between directional logic and execution proof before pace accelerates.";
  }
  return caseType === "comparative"
    ? "Commitment quality depends less on speed and more on condition consolidation across both paths."
    : "Commitment quality depends less on speed than on condition consolidation.";
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
