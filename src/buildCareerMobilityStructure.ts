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
  const context = buildMobilityContext(normalized, structuralFlags);

  const output: CareerMobilityStructureOutput = {
    section: "career_mobility_structure",
    title: "이동 가능성",
    caseType,
    mobilityLine: buildMobilityLine(mobility, caseType, context),
    portabilityLine: buildPortabilityLine(portability, caseType, context),
    burdenLine: buildBurdenLine(burden, caseType, context),
    timingLine: buildTimingLine(timing, caseType, context),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(mobility, portability, burden, timing, context);
  }

  return output;
}



type MobilityBucket = "supported" | "partial" | "constrained";
type PortabilityBucket = "strong" | "partial" | "limited";
type BurdenBucket = "manageable" | "meaningful" | "elevated";
type TimingBucket = "open" | "conditional" | "compressed";
type MobilityContext = {
  relocationSignal: boolean;
  industryConversionSignal: boolean;
  marketTransferSignal: boolean;
  familyLoadSignal: boolean;
};

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

function buildMobilityContext(normalized: AmcNormalizedIntake, flags: AmcDerivedFlags): MobilityContext {
  const text = [
    normalized.mainDecision,
    normalized.optionsUnderConsideration,
    normalized.biggestRisks,
    normalized.marketDemandReason,
    normalized.stayScenario12to18m,
    normalized.mustAnswerQuestion,
    ...(normalized.topPriorities || []),
  ]
    .join(" ")
    .toLowerCase();

  return {
    relocationSignal: /(relocat|overseas|abroad|singapore|china|move country|international)/.test(text),
    industryConversionSignal: /(industry|sector|startup|domain|role conversion|re-entry|conversion)/.test(text),
    marketTransferSignal:
      flags.highExternalExposure || /(market transfer|market readability|portability|external role|hiring selectivity)/.test(text),
    familyLoadSignal: /(family|children|education|school|housing|household)/.test(text),
  };
}

function buildMobilityLine(
  bucket: MobilityBucket,
  caseType: "single" | "comparative",
  context: MobilityContext,
): string {
  if (bucket === "supported") {
    return context.relocationSignal
      ? "Movement structure appears serviceable, including relocation channels that are materially usable under current constraints."
      : "Movement structure appears serviceable, with transition channels that are materially usable under current conditions.";
  }
  if (bucket === "constrained") {
    return caseType === "comparative"
      ? "Mobility structure is constrained in parts of the comparison, with conversion burden exceeding directional pull across paths."
      : "Mobility structure is constrained more by conversion conditions than by directional interest.";
  }
  return context.industryConversionSignal
    ? "Movement remains structurally possible, though industry and role-conversion pathways are not yet fully consolidated."
    : "Movement remains structurally possible, though conversion pathways are not yet fully consolidated.";
}

function buildPortabilityLine(
  bucket: PortabilityBucket,
  caseType: "single" | "comparative",
  context: MobilityContext,
): string {
  if (bucket === "strong") {
    return caseType === "comparative"
      ? "Portability is strong in at least one path, with manageable translation effort across role, market, and context boundaries."
      : "The profile is externally portable, with translation effort that remains manageable in practice.";
  }
  if (bucket === "limited") {
    return caseType === "comparative"
      ? "Portability is uneven across paths, with selective transferability by sector, geography, and role framing."
      : context.marketTransferSignal
        ? "The profile remains internally credible, though market-transfer readability is externally selective."
        : "The current profile remains internally credible, though externally transferable only in selective contexts.";
  }
  return context.relocationSignal
    ? "Portability remains partial and depends on clearer cross-market packaging and stronger legibility proof."
    : "Portability remains partial and still depends on clearer packaging and stronger market-legibility proof.";
}

function buildBurdenLine(
  bucket: BurdenBucket,
  caseType: "single" | "comparative",
  context: MobilityContext,
): string {
  if (bucket === "manageable") {
    return "Conversion burden remains moderate and manageable under disciplined sequencing.";
  }
  if (bucket === "elevated") {
    return caseType === "comparative"
      ? "Conversion burden is elevated, with asymmetric repositioning effort and proof demand across paths."
      : context.familyLoadSignal
        ? "Conversion burden remains elevated due to timing, support, and family-adjustment load."
        : "Conversion burden remains elevated due to timing, evidence, and support gaps.";
  }
  return context.relocationSignal
    ? "The move carries meaningful repositioning, relocation, and proof burden, though not necessarily prohibitive."
    : "The move carries meaningful repositioning and proof burden, though not necessarily prohibitive.";
}

function buildTimingLine(
  bucket: TimingBucket,
  caseType: "single" | "comparative",
  context: MobilityContext,
): string {
  if (bucket === "open") {
    return "Timing window appears open, while stronger validation would improve mobility defensibility.";
  }
  if (bucket === "compressed") {
    return caseType === "comparative"
      ? "Timing window is compressed relative to readiness depth, especially where mobility friction is concentrated."
      : "Timing window appears somewhat compressed relative to readiness and support depth.";
  }
  return caseType === "comparative"
    ? "Timing remains conditionally viable, with mobility quality tied to path-specific validation discipline."
    : context.marketTransferSignal
      ? "Timing remains conditionally viable, with transfer-readiness still maturing under current evidence."
      : "Timing remains conditionally viable rather than fully mature under current evidence.";
}

function buildComparativeReading(
  mobility: MobilityBucket,
  portability: PortabilityBucket,
  burden: BurdenBucket,
  timing: TimingBucket,
  context: MobilityContext,
): string {
  if (burden === "elevated" || timing === "compressed") {
    return context.relocationSignal
      ? "One path appears to offer lower relocation burden, while the other carries broader upside with heavier mobility friction."
      : "One path may offer lower transition burden, while the other offers broader upside with heavier mobility friction.";
  }
  if (portability === "limited") {
    return "The key contrast appears to lie in portability, timing, and burden distribution rather than in absolute feasibility.";
  }
  if (mobility === "supported" && burden === "manageable") {
    return "The comparison suggests different movement structures rather than a simple feasible-versus-infeasible split.";
  }
  return "The comparison indicates path-specific mobility conditions, with different mixes of transferability, burden, and timing exposure.";
}
