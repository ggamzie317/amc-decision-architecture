import type { AmcNormalizedIntake } from "./normalizeIntake";
import type { AmcDerivedFlags } from "./deriveFlags";
import type { AmcInputSummary } from "./buildInputSummary";

export function hasDecisionText(normalized: AmcNormalizedIntake, summary: AmcInputSummary): boolean {
  return (
    (normalized.mainDecision || "").trim().length > 0 ||
    (normalized.optionsUnderConsideration || "").trim().length > 0 ||
    (summary.decisionSnapshot.optionsUnderConsideration || "").trim().length > 0
  );
}

export function isWeakEvidence(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  summary: AmcInputSummary,
  options: { hasAdditionalEvidence?: boolean } = {},
): boolean {
  const hasCoreDecisionText = hasDecisionText(normalized, summary);
  const hasAdditionalEvidence = options.hasAdditionalEvidence === true;

  return !hasCoreDecisionText && !hasAdditionalEvidence && flags.highInterpretiveNeed;
}
