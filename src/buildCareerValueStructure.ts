import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcSectionBuilderArgs } from "./amc/builderArgs";
import type { AmcInputSummary } from "./amc/buildInputSummary";
import { isWeakEvidence } from "./amc/weakEvidence";
import { inferCaseType } from "./amc/inferCaseType";

export interface CareerValueStructureOutput {
  section: "career_value_structure";
  title: "가치 구조 비교";
  caseType: "single" | "comparative";
  primaryValueLine: string;
  secondaryValueLine: string;
  tensionLine: string;
  alignmentLine: string;
  comparativeReading?: string;
}

export function buildCareerValueStructure(args: AmcSectionBuilderArgs): CareerValueStructureOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidenceForValueStructure(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: CareerValueStructureOutput = {
      section: "career_value_structure",
      title: "가치 구조 비교",
      caseType,
      primaryValueLine:
        "The case appears to be organized around a mixed value structure rather than a single dominant criterion.",
      secondaryValueLine:
        "Secondary value drivers remain present, though not yet clearly ranked across the broader decision frame.",
      tensionLine:
        "The main tension appears to lie in how continuity, mobility, and future fit are being weighted against one another.",
      alignmentLine:
        "Current alignment appears partial, with the existing structure supporting some but not all of the value logic implied by the case.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparison appears to reflect different value emphases rather than a single dominant value hierarchy.";
    }

    return fallback;
  }

  const context = buildValueContext(normalized, structuralFlags);
  const primary = inferPrimaryValueBucket(normalized, structuralFlags, context);
  const secondary = inferSecondaryValueBucket(normalized, structuralFlags, primary, context);
  const tension = inferTensionBucket(primary, secondary, structuralFlags, caseType);
  const alignment = inferAlignmentBucket(primary, structuralFlags);

  const output: CareerValueStructureOutput = {
    section: "career_value_structure",
    title: "가치 구조 비교",
    caseType,
    primaryValueLine: buildPrimaryValueLine(primary, context),
    secondaryValueLine: buildSecondaryValueLine(secondary, context),
    tensionLine: buildTensionLine(tension, caseType, context),
    alignmentLine: buildAlignmentLine(alignment, caseType, context),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(primary, secondary, tension, context);
  }

  return output;
}


function isWeakEvidenceForValueStructure(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  summary: AmcInputSummary,
): boolean {
  const hasPriorityText =
    Array.isArray(normalized.topPriorities) &&
    normalized.topPriorities.some((x) => (x || "").trim().length > 0);

  return isWeakEvidence(normalized, flags, summary, { hasAdditionalEvidence: hasPriorityText });
}

type ValueBucket =
  | "stability_safety"
  | "growth_upside"
  | "autonomy_ownership"
  | "identity_fit"
  | "optionality_flexibility"
  | "financial_logic";

type TensionBucket =
  | "security_vs_expansion"
  | "credibility_vs_future_fit"
  | "continuity_vs_mobility"
  | "stability_vs_optionality";

type AlignmentBucket = "aligned" | "partial" | "misaligned";

type ValueContext = {
  continuitySignal: boolean;
  compensationSignal: boolean;
  growthSignal: boolean;
  identityLifestyleSignal: boolean;
  familyStabilitySignal: boolean;
  relocationTransitionSignal: boolean;
  optionValueSignal: boolean;
  reemploymentVsSearchSignal: boolean;
  exitPackageVsStaySignal: boolean;
};

function inferPrimaryValueBucket(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  context: ValueContext,
): ValueBucket {
  const text = [normalized.mainDecision, normalized.nonNegotiable, normalized.biggestRisks, ...(normalized.topPriorities || [])]
    .join(" ")
    .toLowerCase();

  const score: Record<ValueBucket, number> = {
    stability_safety: 0,
    growth_upside: 0,
    autonomy_ownership: 0,
    identity_fit: 0,
    optionality_flexibility: 0,
    financial_logic: 0,
  };

  if (context.compensationSignal) score.financial_logic += 2;
  if (flags.weakSafetyNet) score.financial_logic += 2;
  if (flags.highUrgency) score.financial_logic += 1;
  if (context.reemploymentVsSearchSignal) score.financial_logic += 1;

  if (context.continuitySignal) score.stability_safety += 2;
  if (context.familyStabilitySignal) score.stability_safety += 2;
  if (flags.downsideProtectiveStyle || flags.lowRiskComfort) score.stability_safety += 1;

  if (context.growthSignal) score.growth_upside += 2;
  if (flags.upsideMaximizingStyle) score.growth_upside += 2;
  if (flags.highDifferentiation || flags.mediumDifferentiation) score.growth_upside += 1;

  if (context.identityLifestyleSignal) score.identity_fit += 2;
  if (flags.highDifferentiation) score.identity_fit += 1;
  if (text.includes("meaning") || text.includes("fit") || text.includes("identity")) score.identity_fit += 1;

  if (context.optionValueSignal) score.optionality_flexibility += 2;
  if (flags.reversibleCommitmentStyle || flags.gradualCommitmentStyle) score.optionality_flexibility += 1;
  if (flags.strongSafetyNet) score.optionality_flexibility += 1;

  if (text.includes("autonomy") || text.includes("ownership") || text.includes("independent")) {
    score.autonomy_ownership += 3;
  }
  if (flags.highRiskComfort && flags.upsideMaximizingStyle) {
    score.autonomy_ownership += 1;
  }

  if (context.relocationTransitionSignal && context.familyStabilitySignal) {
    score.stability_safety += 1;
    score.identity_fit += 1;
    score.growth_upside += 1;
  }
  if (context.exitPackageVsStaySignal) {
    score.financial_logic += 1;
    score.optionality_flexibility += 1;
  }

  const tieOrder: ValueBucket[] = [
    "identity_fit",
    "growth_upside",
    "stability_safety",
    "financial_logic",
    "optionality_flexibility",
    "autonomy_ownership",
  ];

  let best = tieOrder[0];
  for (const bucket of tieOrder) {
    if (score[bucket] > score[best]) {
      best = bucket;
    }
  }

  if (score[best] === 0) {
    return "optionality_flexibility";
  }
  return best;
}

function inferSecondaryValueBucket(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  primary: ValueBucket,
  context: ValueContext,
): ValueBucket {
  const text = [normalized.mainDecision, normalized.nonNegotiable, normalized.biggestRisks, ...(normalized.topPriorities || [])]
    .join(" ")
    .toLowerCase();

  const candidates: ValueBucket[] = [];
  if (context.familyStabilitySignal || flags.highUrgency || text.includes("timing")) {
    candidates.push("stability_safety");
  }
  if (context.optionValueSignal || flags.strongSafetyNet || text.includes("flexib")) {
    candidates.push("optionality_flexibility");
  }
  if (
    context.identityLifestyleSignal ||
    flags.mediumDifferentiation ||
    flags.highDifferentiation ||
    text.includes("credibility") ||
    text.includes("status")
  ) {
    candidates.push("identity_fit");
  }
  if (context.growthSignal || flags.upsideMaximizingStyle) {
    candidates.push("growth_upside");
  }
  if (context.compensationSignal || flags.moderateSafetyNet) {
    candidates.push("financial_logic");
  }
  if (text.includes("autonomy") || text.includes("ownership")) {
    candidates.push("autonomy_ownership");
  }
  candidates.push("identity_fit", "growth_upside", "optionality_flexibility", "stability_safety", "financial_logic");

  for (const candidate of candidates) {
    if (candidate !== primary) {
      return candidate;
    }
  }
  return "optionality_flexibility";
}

function inferTensionBucket(
  primary: ValueBucket,
  secondary: ValueBucket,
  flags: AmcDerivedFlags,
  caseType: "single" | "comparative",
): TensionBucket {
  if (
    (primary === "stability_safety" && (secondary === "growth_upside" || secondary === "optionality_flexibility")) ||
    (primary === "financial_logic" && secondary === "growth_upside")
  ) {
    return "security_vs_expansion";
  }
  if (
    primary === "identity_fit" ||
    secondary === "identity_fit" ||
    flags.lowDifferentiation ||
    (flags.highDifferentiation && flags.highExternalExposure)
  ) {
    return "credibility_vs_future_fit";
  }
  if (caseType === "comparative" || flags.highExternalExposure || flags.weakSafetyNet) {
    return "continuity_vs_mobility";
  }
  return "stability_vs_optionality";
}

function inferAlignmentBucket(primary: ValueBucket, flags: AmcDerivedFlags): AlignmentBucket {
  const supportSignals = [
    flags.highDecisionClarity,
    flags.strongSponsorSupport,
    flags.strongSafetyNet,
    flags.highCompanyStability,
  ].filter(Boolean).length;

  const strainSignals = [
    flags.lowDecisionClarity,
    flags.weakSafetyNet,
    flags.lowSponsorSupport,
    flags.highExecutionRisk,
    flags.highExternalExposure,
  ].filter(Boolean).length;

  if (primary === "stability_safety" && supportSignals >= 2 && strainSignals <= 1) {
    return "aligned";
  }
  if ((primary === "growth_upside" || primary === "autonomy_ownership") && strainSignals >= 3) {
    return "misaligned";
  }
  return "partial";
}

function buildValueContext(normalized: AmcNormalizedIntake, flags: AmcDerivedFlags): ValueContext {
  const text = [
    normalized.mainDecision,
    normalized.optionsUnderConsideration,
    normalized.nonNegotiable,
    normalized.biggestRisks,
    normalized.stayScenario12to18m,
    normalized.mustAnswerQuestion,
    ...(normalized.topPriorities || []),
    ...(normalized.reportValueExpectation || []),
  ]
    .join(" ")
    .toLowerCase();

  return {
    continuitySignal:
      flags.downsideProtectiveStyle ||
      /(stay|continuity|stable|safety|runway|buffer|cash-flow|income continuity)/.test(text),
    compensationSignal:
      flags.weakSafetyNet ||
      /(salary|compensation|income|cash burn|monthly burn|liquidity|financial)/.test(text),
    growthSignal:
      flags.upsideMaximizingStyle ||
      /(growth|upside|expansion|trajectory|ceiling|mobility|repositioning)/.test(text),
    identityLifestyleSignal:
      /(identity|fit|meaning|role coherence|credibility|lifestyle|family|children|education|housing)/.test(text),
    familyStabilitySignal: /(family|children|education|school|housing|household)/.test(text),
    relocationTransitionSignal: /(overseas|abroad|singapore|china|relocat|international)/.test(text),
    optionValueSignal:
      /(optionality|optional|option value|preserve optionality|search window|continued search|runway extension)/.test(text),
    reemploymentVsSearchSignal:
      /(lower-paid|lower paid|unemployment benefits|continued search|reemployment|benefits end)/.test(text),
    exitPackageVsStaySignal:
      /(retirement package|package|stay in role|staying in role|accept package|exit package)/.test(text),
  };
}

function buildPrimaryValueLine(bucket: ValueBucket, context: ValueContext): string {
  if (bucket === "stability_safety") {
    return context.familyStabilitySignal
      ? "The value hierarchy is anchored in continuity and family-facing stability, with downside containment prioritized over expansion speed."
      : "The value hierarchy is anchored in continuity, safety, and reputational stability.";
  }
  if (bucket === "growth_upside") {
    return context.continuitySignal
      ? "The value hierarchy is anchored in growth and longer-horizon upside, while still carrying continuity constraints in the background."
      : "The value hierarchy is anchored in growth, expansion, and longer-horizon upside logic.";
  }
  if (bucket === "autonomy_ownership") {
    return "The value hierarchy is anchored in autonomy, ownership, and directional control.";
  }
  if (bucket === "identity_fit") {
    return context.growthSignal
      ? "The value hierarchy is anchored in identity fit and role coherence, while still requiring growth-legible positioning."
      : "The value hierarchy is anchored in identity fit, role coherence, and credibility continuity.";
  }
  if (bucket === "financial_logic") {
    return context.exitPackageVsStaySignal
      ? "The value hierarchy is anchored in package-adjusted runway protection, compensation continuity, and downside containment."
      : "The value hierarchy is anchored in compensation continuity, downside protection, and liquidity resilience.";
  }
  return "The value hierarchy is anchored in optionality, flexibility, and longer-horizon adaptability.";
}

function buildSecondaryValueLine(bucket: ValueBucket, context: ValueContext): string {
  if (bucket === "stability_safety") {
    return context.compensationSignal
      ? "A secondary value priority appears in execution manageability so compensation stability is not weakened during transition."
      : "A secondary value priority appears in family stability and execution manageability under current constraints.";
  }
  if (bucket === "growth_upside") {
    return context.identityLifestyleSignal
      ? "A secondary value priority appears in expansion capacity, provided identity coherence is preserved while upside is pursued."
      : "A secondary value priority appears in longer-term expansion and directional development capacity.";
  }
  if (bucket === "autonomy_ownership") {
    return "A secondary value priority appears in ownership intensity and decision-making latitude.";
  }
  if (bucket === "identity_fit") {
    return "A secondary value priority appears in status continuity and externally legible professional identity.";
  }
  if (bucket === "financial_logic") {
    return context.reemploymentVsSearchSignal
      ? "A secondary value priority appears in avoiding a weak early lock-in that undermines medium-term compensation recovery."
      : context.optionValueSignal
        ? "A secondary value priority appears in preserving option value so downside control does not foreclose higher-quality later positioning."
      : "A secondary value priority appears in compensation continuity and practical downside containment.";
  }
  return "Optionality and future flexibility remain materially relevant as secondary criteria.";
}

function buildTensionLine(
  bucket: TensionBucket,
  caseType: "single" | "comparative",
  context: ValueContext,
): string {
  if (bucket === "security_vs_expansion") {
    if (context.reemploymentVsSearchSignal) {
      return "The core tension sits between immediate income relief and preserving option value for a structurally stronger re-entry.";
    }
    return context.compensationSignal
      ? "The value trade-off centers on compensation/runway protection versus expansion-oriented upside expression."
      : "The value trade-off centers on security preservation versus expansion-oriented upside expression.";
  }
  if (bucket === "credibility_vs_future_fit") {
    return context.identityLifestyleSignal
      ? "The value structure is pulled between credibility continuity and future-fit requirements tied to identity and lifestyle."
      : "The value structure is pulled between credibility continuity and broader future-fit logic.";
  }
  if (bucket === "continuity_vs_mobility") {
    return caseType === "comparative"
      ? context.relocationTransitionSignal
        ? "The value structure appears split between continuity preservation and cross-market repositioning across paths."
        : "The value structure appears split between continuity preservation and mobility-oriented repositioning across paths."
      : context.optionValueSignal
        ? "The value structure is split between preserving continuity now and preserving option value for higher-quality later repositioning."
        : "The value structure is split between continuity preservation and mobility upside.";
  }
  return "The core value tension sits between current stability logic and longer-horizon optionality logic.";
}

function buildAlignmentLine(
  bucket: AlignmentBucket,
  caseType: "single" | "comparative",
  context: ValueContext,
): string {
  if (bucket === "aligned") {
    return context.growthSignal
      ? "Current structure appears broadly aligned with active value priorities, though growth expression still requires disciplined maintenance."
      : "Current structure appears broadly aligned with the active value logic, while still requiring disciplined maintenance.";
  }
  if (bucket === "misaligned") {
    return context.reemploymentVsSearchSignal
      ? "Current structure appears to reward short-term relief while straining medium-term value recovery and role quality."
      : context.optionValueSignal
        ? "Current structure appears to reward immediate stability but strain the stated option-value and future-positioning logic."
        : "Current structure appears to reward continuity but strain the stated value direction under present conditions.";
  }
  return caseType === "comparative"
    ? context.exitPackageVsStaySignal
      ? "Alignment appears partial, with one path protecting near-term runway while the other protects continuity credibility and deferred upside."
      : "Alignment appears partial, with each path protecting different value sets rather than one integrated value profile."
    : context.continuitySignal
      ? "Alignment is partial: continuity and compensation priorities are better protected than expansion-oriented value expression."
      : "Alignment is partial: continuity is protected more clearly than expansion-oriented value expression.";
}

function buildComparativeReading(
  primary: ValueBucket,
  secondary: ValueBucket,
  tension: TensionBucket,
  context: ValueContext,
): string {
  if (context.relocationTransitionSignal && context.familyStabilitySignal) {
    return "One path appears to protect household continuity value, while the other expresses cross-border growth value with higher adjustment burden.";
  }
  if (context.reemploymentVsSearchSignal) {
    return "One path appears to secure immediate relief, while the other protects search optionality and medium-term value recovery.";
  }
  if (context.exitPackageVsStaySignal) {
    return "One path appears to crystallize package-linked runway value, while the other preserves continuity credibility and longer-horizon platform value.";
  }
  if (tension === "continuity_vs_mobility" || tension === "security_vs_expansion") {
    return context.compensationSignal
      ? "One path appears to protect compensation and continuity value, while the other expresses growth and repositioning value more directly."
      : "One path appears to protect continuity-based values, while the other expresses growth and repositioning values more directly.";
  }
  if (primary === "identity_fit" || secondary === "identity_fit") {
    return "The comparison suggests different value emphases rather than a simple better-worse distinction.";
  }
  return "The key difference appears to lie in which values are protected now versus deferred for later expression.";
}
