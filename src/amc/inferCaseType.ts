import type { AmcNormalizedIntake } from "./normalizeIntake";
import type { AmcInputSummary } from "./buildInputSummary";

export type AmcCaseType = "single" | "comparative";

const comparativeSignals = ["option a", "option b", "option 1", "option 2", " vs ", "versus", "compared"];

export function inferCaseType(
  normalized: AmcNormalizedIntake,
  summary: AmcInputSummary,
): AmcCaseType {
  const text = [normalized.optionsUnderConsideration, summary.decisionSnapshot.optionsUnderConsideration]
    .join(" ")
    .toLowerCase();

  if (comparativeSignals.some((signal) => text.includes(signal))) {
    return "comparative";
  }

  return "single";
}
