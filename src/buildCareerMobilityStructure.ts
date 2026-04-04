import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcSectionBuilderArgs } from "./amc/builderArgs";
import { isWeakEvidence } from "./amc/weakEvidence";
import { inferCaseType } from "./amc/inferCaseType";

export interface CareerMobilityStructureOutput {
  section: "career_mobility_structure";
  title: "이동 가능성";
  caseType: "single" | "comparative";
  mobilityLine: string;
  portabilityLine: string;
  burdenLine: string;
  timingLine: string;
  comparativeReading?: string;
}

export function buildCareerMobilityStructure(args: AmcSectionBuilderArgs): CareerMobilityStructureOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: CareerMobilityStructureOutput = {
      section: "career_mobility_structure",
      title: "이동 가능성",
      caseType,
      mobilityLine:
        "Mobility appears directionally present, though not yet fully consolidated across the broader decision structure.",
      portabilityLine:
        "Profile portability appears partial, with external transferability depending on clearer articulation and proof.",
      burdenLine:
        "Transition burden appears meaningful but not necessarily prohibitive, provided supporting conditions become clearer.",
      timingLine: "Timing appears conditionally viable, though stronger validation would improve decision defensibility.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparison suggests different movement structures rather than a simple feasible-versus-infeasible split.";
    }

    return fallback;
  }

  const mobility = inferMobilityBucket(structuralFlags);
  const portability = inferPortabilityBucket(structuralFlags);
  const burden = inferBurdenBucket(structuralFlags);
  const timing = inferTimingBucket(structuralFlags);

  const output: CareerMobilityStructureOutput = {
    section: "career_mobility_structure",
    title: "이동 가능성",
    caseType,
    mobilityLine: buildMobilityLine(mobility, caseType),
    portabilityLine: buildPortabilityLine(portability, caseType),
    burdenLine: buildBurdenLine(burden, caseType),
    timingLine: buildTimingLine(timing, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(mobility, portability, burden, timing);
  }

  return output;
}



type MobilityBucket = "supported" | "partial" | "constrained";
type PortabilityBucket = "strong" | "partial" | "limited";
type BurdenBucket = "manageable" | "meaningful" | "elevated";
type TimingBucket = "open" | "conditional" | "compressed";

function inferMobilityBucket(flags: AmcDerivedFlags): MobilityBucket {
  if (flags.structurallySupportedMove && !flags.highExecutionRisk && !flags.highExternalExposure) {
    return "supported";
  }
  if (flags.structurallyFragileMove || flags.highExecutionRisk || flags.lowDecisionClarity) {
    return "constrained";
  }
  return "partial";
}

function inferPortabilityBucket(flags: AmcDerivedFlags): PortabilityBucket {
  if (flags.highDifferentiation && !flags.lowDecisionClarity) {
    return "strong";
  }
  if (flags.lowDifferentiation || flags.highExternalExposure || flags.lowDecisionClarity) {
    return "limited";
  }
  return "partial";
}

function inferBurdenBucket(flags: AmcDerivedFlags): BurdenBucket {
  const burdenSignals = [
    flags.weakSafetyNet,
    flags.lowSponsorSupport,
    flags.lowDecisionClarity,
    flags.highExecutionRisk,
    flags.highExternalExposure,
  ].filter(Boolean).length;

  if (burdenSignals >= 3) {
    return "elevated";
  }
  if (burdenSignals >= 1) {
    return "meaningful";
  }
  return "manageable";
}

function inferTimingBucket(flags: AmcDerivedFlags): TimingBucket {
  if (flags.highUrgency && (flags.highExecutionRisk || flags.lowDecisionClarity || flags.weakSafetyNet)) {
    return "compressed";
  }
  if (flags.mediumUrgency || flags.highInterpretiveNeed || flags.someRestructuringRisk) {
    return "conditional";
  }
  return "open";
}

function buildMobilityLine(bucket: MobilityBucket, caseType: "single" | "comparative"): string {
  if (bucket === "supported") {
    return "Mobility appears structurally supported, with movement logic backed by relatively coherent transition conditions.";
  }
  if (bucket === "constrained") {
    return caseType === "comparative"
      ? "Mobility appears constrained in parts of the comparison, with structure carrying more burden than directional interest."
      : "Mobility appears constrained more by structural conditions than by directional interest.";
  }
  return "Mobility appears structurally possible, though not yet fully consolidated at the current stage.";
}

function buildPortabilityLine(bucket: PortabilityBucket, caseType: "single" | "comparative"): string {
  if (bucket === "strong") {
    return caseType === "comparative"
      ? "Profile portability appears strong in at least one path, with manageable translation effort across contexts."
      : "The profile appears externally portable, with translation effort that remains manageable in principle.";
  }
  if (bucket === "limited") {
    return caseType === "comparative"
      ? "Portability appears uneven across paths, with selective transferability across sector, geography, and role logic."
      : "The current profile appears credible internally, though only selectively transferable externally.";
  }
  return "Portability appears partial and depends on clearer narrative packaging and stronger proof signals.";
}

function buildBurdenLine(bucket: BurdenBucket, caseType: "single" | "comparative"): string {
  if (bucket === "manageable") {
    return "Transition burden appears moderate and manageable under disciplined signal formation and sequencing.";
  }
  if (bucket === "elevated") {
    return caseType === "comparative"
      ? "Transition burden appears elevated, with asymmetry in repositioning effort and proof requirements across paths."
      : "Transition burden remains elevated due to timing, evidence, and support gaps.";
  }
  return "The move appears to carry meaningful repositioning and proof burden, though not necessarily prohibitive.";
}

function buildTimingLine(bucket: TimingBucket, caseType: "single" | "comparative"): string {
  if (bucket === "open") {
    return "Timing appears open, though stronger validation would improve movement defensibility.";
  }
  if (bucket === "compressed") {
    return caseType === "comparative"
      ? "Timing appears compressed relative to current readiness, especially where mobility friction is more concentrated."
      : "Timing appears somewhat compressed relative to current readiness and support depth.";
  }
  return caseType === "comparative"
    ? "Timing remains conditionally viable, with commitment quality depending on path-specific validation discipline."
    : "Timing appears conditionally favorable rather than clearly mature under current evidence conditions.";
}

function buildComparativeReading(
  mobility: MobilityBucket,
  portability: PortabilityBucket,
  burden: BurdenBucket,
  timing: TimingBucket,
): string {
  if (burden === "elevated" || timing === "compressed") {
    return "One path may offer lower transition burden, while the other offers broader upside with heavier mobility friction.";
  }
  if (portability === "limited") {
    return "The key contrast appears to lie in portability, timing, and burden distribution rather than in absolute feasibility.";
  }
  if (mobility === "supported" && burden === "manageable") {
    return "The comparison suggests different movement structures rather than a simple feasible-versus-infeasible split.";
  }
  return "The comparison indicates path-specific mobility conditions, with different mixes of transferability, burden, and timing exposure.";
}
