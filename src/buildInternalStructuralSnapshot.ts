import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcInputSummary } from "./amc/buildInputSummary";

export interface InternalStructuralSnapshotOutput {
  section: "internal_structural_snapshot";
  title: "Internal Structural Snapshot";
  caseType: "single" | "comparative";
  clarityLine: string;
  readinessLine: string;
  supportLine: string;
  strainLine: string;
  comparativeReading?: string;
}

export function buildInternalStructuralSnapshot(args: {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
}): InternalStructuralSnapshotOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: InternalStructuralSnapshotOutput = {
      section: "internal_structural_snapshot",
      title: "Internal Structural Snapshot",
      caseType,
      clarityLine: "Internal direction appears present, though decision clarity is not yet fully consolidated.",
      readinessLine: "Readiness appears partial, with movement logic ahead of full execution proof.",
      supportLine:
        "Support conditions appear present in part, though not yet sufficiently reinforced across the full decision structure.",
      strainLine:
        "This suggests that internal strain is being carried through ambiguity, timing pressure, and incomplete consolidation rather than through a single dominant trigger.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparative frame appears to reflect different internal load profiles rather than a settled directional conclusion.";
    }

    return fallback;
  }

  const clarity = inferClarityBucket(structuralFlags, caseType);
  const readiness = inferReadinessBucket(structuralFlags);
  const support = inferSupportBucket(structuralFlags);
  const strain = inferStrainBucket(structuralFlags);

  const output: InternalStructuralSnapshotOutput = {
    section: "internal_structural_snapshot",
    title: "Internal Structural Snapshot",
    caseType,
    clarityLine: buildClarityLine(clarity, caseType),
    readinessLine: buildReadinessLine(readiness, caseType),
    supportLine: buildSupportLine(support, caseType),
    strainLine: buildStrainLine(strain, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(clarity, readiness, support, strain);
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

type ClarityBucket = "formed" | "partial" | "weak";
type ReadinessBucket = "supported" | "partial" | "weak";
type SupportBucket = "intact" | "partial" | "fragile";
type StrainBucket = "mismatch" | "ambiguity" | "timing" | "safety_vs_mobility";

function inferClarityBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): ClarityBucket {
  if (caseType === "comparative" && (flags.mediumDecisionClarity || flags.highInterpretiveNeed)) {
    return "partial";
  }
  if (flags.highDecisionClarity && !flags.urgencyUnclear) {
    return "formed";
  }
  if (flags.lowDecisionClarity || flags.urgencyUnclear) {
    return "weak";
  }
  return "partial";
}

function inferReadinessBucket(flags: AmcDerivedFlags): ReadinessBucket {
  if (flags.structurallySupportedMove && !flags.highExecutionRisk) {
    return "supported";
  }
  if (flags.highExecutionRisk || flags.structurallyFragileMove) {
    return "weak";
  }
  return "partial";
}

function inferSupportBucket(flags: AmcDerivedFlags): SupportBucket {
  const positive = [flags.strongSafetyNet, flags.strongSponsorSupport, flags.highCompanyStability].filter(Boolean).length;
  const negative = [flags.weakSafetyNet, flags.lowSponsorSupport, flags.lowCompanyStability].filter(Boolean).length;

  if (positive >= 2 && negative === 0) {
    return "intact";
  }
  if (negative >= 2) {
    return "fragile";
  }
  return "partial";
}

function inferStrainBucket(flags: AmcDerivedFlags): StrainBucket {
  if (flags.highUrgency && (flags.weakSafetyNet || flags.lowDecisionClarity)) {
    return "timing";
  }
  if (flags.weakSafetyNet || flags.highExternalExposure) {
    return "safety_vs_mobility";
  }
  if (flags.highInterpretiveNeed || flags.unclearMarketOutlook || flags.someRestructuringRisk) {
    return "ambiguity";
  }
  return "mismatch";
}

function buildClarityLine(bucket: ClarityBucket, caseType: "single" | "comparative"): string {
  if (bucket === "formed") {
    return "Decision clarity appears relatively formed, with directional intent supported by a coherent internal frame.";
  }
  if (bucket === "weak") {
    return "Decision clarity appears limited, with movement intent present but not yet consolidated into a stable internal frame.";
  }
  return caseType === "comparative"
    ? "The comparative frame suggests meaningful interest in both paths rather than a fully settled directional conviction."
    : "Directional intent appears present, though internal clarity remains only partially consolidated.";
}

function buildReadinessLine(bucket: ReadinessBucket, caseType: "single" | "comparative"): string {
  if (bucket === "supported") {
    return "Readiness appears supported by practical traction and a transition logic that remains executable under current constraints.";
  }
  if (bucket === "weak") {
    return "Readiness appears uneven, with movement intent running ahead of full execution proof and support depth.";
  }
  return caseType === "comparative"
    ? "Readiness appears uneven across paths, with internal momentum present but conversion capacity not yet uniformly formed."
    : "Readiness appears partial, with internal momentum present but execution consolidation still in progress.";
}

function buildSupportLine(bucket: SupportBucket, caseType: "single" | "comparative"): string {
  if (bucket === "intact") {
    return "Support conditions appear reasonably intact across sponsorship, stability, and downside coverage.";
  }
  if (bucket === "fragile") {
    return "Support conditions appear fragile, with key backing elements not yet sufficiently reinforced for full defensibility.";
  }
  return caseType === "comparative"
    ? "Support conditions appear partial and uneven across paths, especially across timing, resources, and validation backing."
    : "Support conditions appear partial, with relevant backing present but not yet fully reinforced across the decision structure.";
}

function buildStrainLine(bucket: StrainBucket, caseType: "single" | "comparative"): string {
  if (bucket === "timing") {
    return "Internal strain appears shaped by timing pressure interacting with incomplete readiness and still-forming clarity.";
  }
  if (bucket === "safety_vs_mobility") {
    return "Internal strain appears concentrated in the tension between movement intent and structural safety needs.";
  }
  if (bucket === "ambiguity") {
    return "Internal pressure appears shaped more by ambiguity and accumulated delay than by a single immediate trigger.";
  }
  return caseType === "comparative"
    ? "The internal strain appears tied to carrying two viable directions with different burden and readiness profiles."
    : "The main internal strain appears linked to prolonged mismatch between current structure and future directional intent.";
}

function buildComparativeReading(
  clarity: ClarityBucket,
  readiness: ReadinessBucket,
  support: SupportBucket,
  strain: StrainBucket,
): string {
  if (readiness === "weak" || support === "fragile") {
    return "The contrast appears less about simple preference and more about how readiness burden and support fragility are distributed.";
  }
  if (clarity === "formed" && readiness === "supported") {
    return "The contrast indicates different internal load profiles, with familiarity and ambition carrying different execution demands.";
  }
  if (strain === "timing" || strain === "ambiguity") {
    return "The main difference appears to lie in clarity timing, readiness burden, and how internal strain is carried across paths.";
  }
  return "The comparative reading suggests uneven distribution of familiarity, ambition, and execution burden rather than a single dominant direction.";
}
