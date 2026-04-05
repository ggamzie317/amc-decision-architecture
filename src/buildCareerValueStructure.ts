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

  const primary = inferPrimaryValueBucket(normalized, structuralFlags);
  const secondary = inferSecondaryValueBucket(normalized, structuralFlags, primary);
  const tension = inferTensionBucket(primary, secondary, structuralFlags, caseType);
  const alignment = inferAlignmentBucket(primary, structuralFlags);
  const context = buildValueContext(normalized, structuralFlags);

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
};

function inferPrimaryValueBucket(normalized: AmcNormalizedIntake, flags: AmcDerivedFlags): ValueBucket {
  const text = [normalized.mainDecision, normalized.nonNegotiable, normalized.biggestRisks, ...(normalized.topPriorities || [])]
    .join(" ")
    .toLowerCase();

  if (flags.weakSafetyNet || text.includes("income") || text.includes("salary") || text.includes("financial")) {
    return "financial_logic";
  }
  if (flags.downsideProtectiveStyle || text.includes("stability") || text.includes("security") || text.includes("family")) {
    return "stability_safety";
  }
  if (flags.upsideMaximizingStyle || text.includes("growth") || text.includes("upside") || text.includes("expand")) {
    return "growth_upside";
  }
  if (text.includes("autonomy") || text.includes("ownership") || text.includes("independent")) {
    return "autonomy_ownership";
  }
  if (text.includes("fit") || text.includes("meaning") || text.includes("identity")) {
    return "identity_fit";
  }
  return "optionality_flexibility";
}

function inferSecondaryValueBucket(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  primary: ValueBucket,
): ValueBucket {
  const text = [normalized.mainDecision, normalized.nonNegotiable, normalized.biggestRisks, ...(normalized.topPriorities || [])]
    .join(" ")
    .toLowerCase();

  const candidates: ValueBucket[] = [];
  if (flags.highUrgency || text.includes("timing") || text.includes("family") || text.includes("location")) {
    candidates.push("stability_safety");
  }
  if (flags.strongSafetyNet || text.includes("option") || text.includes("optional") || text.includes("flexib")) {
    candidates.push("optionality_flexibility");
  }
  if (flags.mediumDifferentiation || flags.highDifferentiation || text.includes("credibility") || text.includes("status")) {
    candidates.push("identity_fit");
  }
  if (text.includes("autonomy") || text.includes("ownership")) {
    candidates.push("autonomy_ownership");
  }
  if (flags.moderateSafetyNet || text.includes("income") || text.includes("compensation")) {
    candidates.push("financial_logic");
  }
  candidates.push("growth_upside", "optionality_flexibility", "stability_safety");

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
    return "The value hierarchy is anchored in compensation continuity, downside protection, and liquidity resilience.";
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
    return "A secondary value priority appears in compensation continuity and practical downside containment.";
  }
  return "Optionality and future flexibility remain materially relevant as secondary criteria.";
}

function buildTensionLine(
  bucket: TensionBucket,
  caseType: "single" | "comparative",
  context: ValueContext,
): string {
  if (bucket === "security_vs_expansion") {
    return context.compensationSignal
      ? "The main value tension sits between compensation/runway protection and expansion-oriented upside."
      : "The main value tension appears to lie between security preservation and expansion-oriented upside.";
  }
  if (bucket === "credibility_vs_future_fit") {
    return context.identityLifestyleSignal
      ? "The value structure reflects tension between current credibility continuity and future-fit requirements tied to identity and lifestyle."
      : "The value structure reflects tension between current credibility continuity and broader future fit.";
  }
  if (bucket === "continuity_vs_mobility") {
    return caseType === "comparative"
      ? context.relocationTransitionSignal
        ? "The value structure appears split between continuity preservation and cross-market repositioning across paths."
        : "The value structure appears split between continuity preservation and mobility-oriented repositioning across paths."
      : "The value structure appears split between continuity preservation and mobility upside.";
  }
  return "The core value tension appears to lie between current stability logic and longer-horizon optionality logic.";
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
    return "Stated direction and lived structure do not yet appear fully aligned under present conditions.";
  }
  return caseType === "comparative"
    ? "Alignment appears partial, with each path protecting different value sets rather than one integrated value profile."
    : context.continuitySignal
      ? "Alignment appears partial, with continuity and compensation priorities better protected than expansion-oriented value expression."
      : "Alignment appears partial, with continuity supported more clearly than expansion-oriented value expression.";
}

function buildComparativeReading(
  primary: ValueBucket,
  secondary: ValueBucket,
  tension: TensionBucket,
  context: ValueContext,
): string {
  if (tension === "continuity_vs_mobility" || tension === "security_vs_expansion") {
    if (context.relocationTransitionSignal && context.familyStabilitySignal) {
      return "One path appears to protect household continuity value, while the other expresses cross-border growth value with higher adjustment burden.";
    }
    return context.compensationSignal
      ? "One path appears to protect compensation and continuity value, while the other expresses growth and repositioning value more directly."
      : "One path appears to protect continuity-based values, while the other expresses growth and repositioning values more directly.";
  }
  if (primary === "identity_fit" || secondary === "identity_fit") {
    return "The comparison suggests different value emphases rather than a simple better-worse distinction.";
  }
  return "The key difference appears to lie in which values are protected now versus deferred for later expression.";
}
