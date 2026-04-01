import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcInputSummary } from "./amc/buildInputSummary";
import { isWeakEvidence } from "./amc/weakEvidence";
import { inferCaseType } from "./amc/inferCaseType";

export interface ExternalSnapshotOutput {
  section: "external_snapshot";
  title: "External Snapshot";
  caseType: "single" | "comparative";
  marketLine: string;
  positionLine: string;
  frictionLine: string;
  signalLine: string;
  comparativeReading?: string;
  comparativeStatus?: {
    optionA: ComparativeStatusSet;
    optionB: ComparativeStatusSet;
    source: "native_bucket" | "native_option_signal_hybrid";
  };
  comparativeOptionSignals?: {
    optionA: ComparativeStatusSet;
    optionB: ComparativeStatusSet;
    nativeDimensions: {
      market: boolean;
      competition: boolean;
      economic: boolean;
      transition: boolean;
    };
    source: "option_text_signal";
  };
  nativeMetadata?: {
    weakEvidence: boolean;
    demandBucket: DemandBucket;
    portabilityBucket: PortabilityBucket;
    frictionBucket: FrictionBucket;
    signalBucket: SignalBucket;
  };
}

type MarketStatus = "▲ Supportive" | "◆ Mixed" | "▼ Constrained";
type PressureStatus = "○ Contained" | "◐ Moderate" | "● Elevated";

interface ComparativeStatusSet {
  marketStatus: MarketStatus;
  competitionStatus: PressureStatus;
  economicStatus: PressureStatus;
  transitionStatus: PressureStatus;
}

export function buildExternalSnapshot(args: {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
}): ExternalSnapshotOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: ExternalSnapshotOutput = {
      section: "external_snapshot",
      title: "External Snapshot",
      caseType,
      marketLine: "External readability appears present but not yet fully consolidated.",
      positionLine:
        "The profile shows some portable elements, though market positioning remains only partially explicit.",
      frictionLine:
        "Transition friction appears manageable in principle, but depends on clearer signal formation and execution proof.",
      signalLine:
        "This increases the value of stronger external evidence, clearer articulation, and staged validation.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparison appears shaped by asymmetric external visibility rather than by a simple quality ranking.";
      fallback.comparativeStatus = buildComparativeStatus("mixed", "partial", "moderate", "fragmented");
      fallback.comparativeOptionSignals = {
        optionA: fallback.comparativeStatus.optionA,
        optionB: fallback.comparativeStatus.optionB,
        nativeDimensions: {
          market: false,
          competition: false,
          economic: false,
          transition: false,
        },
        source: "option_text_signal",
      };
    }
    fallback.nativeMetadata = {
      weakEvidence: true,
      demandBucket: "mixed",
      portabilityBucket: "partial",
      frictionBucket: "moderate",
      signalBucket: "fragmented",
    };
    return fallback;
  }

  const demandBucket = inferDemandBucket(structuralFlags);
  const portabilityBucket = inferPortabilityBucket(structuralFlags, caseType);
  const frictionBucket = inferFrictionBucket(structuralFlags);
  const signalBucket = inferSignalBucket(structuralFlags);

  const output: ExternalSnapshotOutput = {
    section: "external_snapshot",
    title: "External Snapshot",
    caseType,
    marketLine: buildMarketLine(demandBucket, caseType),
    positionLine: buildPositionLine(portabilityBucket, caseType),
    frictionLine: buildFrictionLine(frictionBucket, caseType),
    signalLine: buildSignalLine(signalBucket, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(demandBucket, portabilityBucket, frictionBucket, signalBucket);
    const baseStatus = buildComparativeStatus(demandBucket, portabilityBucket, frictionBucket, signalBucket);
    const optionSignals = buildPerOptionComparativeSignals(normalized, inputSummary, baseStatus);
    output.comparativeStatus = {
      optionA: optionSignals.optionA,
      optionB: optionSignals.optionB,
      source:
        optionSignals.nativeDimensions.market ||
        optionSignals.nativeDimensions.competition ||
        optionSignals.nativeDimensions.economic ||
        optionSignals.nativeDimensions.transition
          ? "native_option_signal_hybrid"
          : "native_bucket",
    };
    output.comparativeOptionSignals = optionSignals;
  }

  output.nativeMetadata = {
    weakEvidence: false,
    demandBucket,
    portabilityBucket,
    frictionBucket,
    signalBucket,
  };

  return output;
}



type DemandBucket = "clear" | "mixed" | "weak";
type PortabilityBucket = "strong" | "partial" | "constrained";
type FrictionBucket = "low" | "moderate" | "high";
type SignalBucket = "visible" | "partial" | "fragmented";

function inferDemandBucket(flags: AmcDerivedFlags): DemandBucket {
  if (flags.growingMarketOutlook && !flags.highExternalExposure) {
    return "clear";
  }
  if (flags.decliningMarketOutlook || flags.highExternalExposure) {
    return "weak";
  }
  return "mixed";
}

function inferPortabilityBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): PortabilityBucket {
  if (flags.highDifferentiation && !flags.lowDecisionClarity && !flags.lowSponsorSupport) {
    return "strong";
  }
  if (flags.lowDifferentiation || flags.lowDecisionClarity || flags.lowSponsorSupport) {
    return "constrained";
  }
  if (caseType === "comparative" && flags.mediumDifferentiation) {
    return "partial";
  }
  return "partial";
}

function inferFrictionBucket(flags: AmcDerivedFlags): FrictionBucket {
  const frictionSignals = [
    flags.weakSafetyNet,
    flags.lowDecisionClarity,
    flags.majorRestructuringRisk,
    flags.highExternalExposure,
    flags.lowCompanyStability,
  ].filter(Boolean).length;

  if (frictionSignals >= 3) {
    return "high";
  }
  if (frictionSignals >= 1) {
    return "moderate";
  }
  return "low";
}

function inferSignalBucket(flags: AmcDerivedFlags): SignalBucket {
  if (
    flags.highInterpretiveNeed ||
    flags.urgencyUnclear ||
    flags.uncertainSponsorSupport ||
    flags.someRestructuringRisk ||
    flags.unclearMarketOutlook
  ) {
    return "fragmented";
  }
  if (flags.structurallySupportedMove && flags.strongSponsorSupport && !flags.highExternalExposure) {
    return "visible";
  }
  return "partial";
}

function buildMarketLine(bucket: DemandBucket, caseType: "single" | "comparative"): string {
  if (caseType === "comparative") {
    if (bucket === "clear") {
      return "External demand visibility appears clearer in at least one path, though timing sensitivity remains part of the comparison.";
    }
    if (bucket === "weak") {
      return "External demand visibility appears uneven across paths, with constrained readability in more exposed segments.";
    }
    return "External demand visibility appears mixed, with path-specific readability and uneven timing dependence.";
  }

  if (bucket === "clear") {
    return "External demand visibility appears clear, while defensibility remains shaped by timing and signal quality.";
  }
  if (bucket === "weak") {
    return "External demand visibility appears weak, with external readability constrained by current market conditions.";
  }
  return "External demand visibility appears mixed, with partial readability and uneven traction signals.";
}

function buildPositionLine(bucket: PortabilityBucket, caseType: "single" | "comparative"): string {
  if (bucket === "strong") {
    return caseType === "comparative"
      ? "Profile portability appears stronger in one path, with external narrative transfer remaining broadly legible."
      : "Profile portability appears strong, with external positioning largely legible across adjacent contexts.";
  }
  if (bucket === "constrained") {
    return caseType === "comparative"
      ? "Profile portability appears path-dependent, with translation frictions concentrated in the less familiar route."
      : "Profile portability appears constrained, with positioning requiring clearer external translation and proof.";
  }
  return caseType === "comparative"
    ? "Profile portability appears partial across paths, with credibility transfer varying by context and framing."
    : "Profile portability appears partial, with credible elements that remain only partly transferable externally.";
}

function buildFrictionLine(bucket: FrictionBucket, caseType: "single" | "comparative"): string {
  if (bucket === "high") {
    return caseType === "comparative"
      ? "Transition friction appears high overall, with asymmetry driven by translation burden, readiness gaps, and execution proof requirements."
      : "Transition friction appears high, shaped by translation burden, readiness gaps, and execution proof requirements.";
  }
  if (bucket === "low") {
    return caseType === "comparative"
      ? "Transition friction appears relatively contained, though path-specific calibration remains necessary."
      : "Transition friction appears relatively contained, with manageable conversion requirements under disciplined execution.";
  }
  return caseType === "comparative"
    ? "Transition friction appears moderate, with uneven burden across narrative translation and signal conversion."
    : "Transition friction appears moderate, with conversion burden concentrated in narrative articulation and proof sequencing.";
}

function buildSignalLine(bucket: SignalBucket, caseType: "single" | "comparative"): string {
  if (bucket === "visible") {
    return caseType === "comparative"
      ? "External signal visibility appears sufficiently formed for comparison, while defensibility still depends on sequence discipline."
      : "External signal visibility appears reasonably formed, though defensibility remains contingent on disciplined sequencing.";
  }
  if (bucket === "fragmented") {
    return caseType === "comparative"
      ? "External signal visibility remains fragmented, increasing the importance of staged validation before comparative commitment."
      : "External signal visibility remains fragmented, increasing the importance of staged validation before commitment conditions tighten.";
  }
  return caseType === "comparative"
    ? "External signal visibility appears partial, with defensibility depending on clearer articulation and balanced evidence across paths."
    : "External signal visibility appears partial, with defensibility depending on clearer articulation and stronger evidence consolidation.";
}

function buildComparativeReading(
  demand: DemandBucket,
  portability: PortabilityBucket,
  friction: FrictionBucket,
  signal: SignalBucket,
): string {
  if (friction === "high" || signal === "fragmented") {
    return "The comparison suggests that the main difference lies in portability and friction distribution rather than in absolute path quality.";
  }
  if (demand === "clear" && portability === "strong") {
    return "The comparison indicates a continuity-versus-repositioning contrast, with different external exposures across otherwise credible paths.";
  }
  return "The comparison appears shaped by uneven visibility, portability, and transition friction, not by a simple winner-loser split.";
}

function buildComparativeStatus(
  demand: DemandBucket,
  portability: PortabilityBucket,
  friction: FrictionBucket,
  signal: SignalBucket,
): {
  optionA: ComparativeStatusSet;
  optionB: ComparativeStatusSet;
  source: "native_bucket";
} {
  const optionA: ComparativeStatusSet = {
    marketStatus: "◆ Mixed",
    competitionStatus: "◐ Moderate",
    economicStatus: "◐ Moderate",
    transitionStatus: "◐ Moderate",
  };
  const optionB: ComparativeStatusSet = {
    marketStatus: "◆ Mixed",
    competitionStatus: "◐ Moderate",
    economicStatus: "◐ Moderate",
    transitionStatus: "● Elevated",
  };

  if (demand === "clear") {
    optionA.marketStatus = "▲ Supportive";
    optionB.marketStatus = "◆ Mixed";
  } else if (demand === "weak") {
    optionA.marketStatus = "◆ Mixed";
    optionB.marketStatus = "▼ Constrained";
  }

  if (portability === "strong") {
    optionA.competitionStatus = "○ Contained";
    optionB.competitionStatus = "◐ Moderate";
  } else if (portability === "constrained") {
    optionA.competitionStatus = "◐ Moderate";
    optionB.competitionStatus = "● Elevated";
  }

  if (signal === "visible") {
    optionA.economicStatus = "○ Contained";
    optionB.economicStatus = "◐ Moderate";
  } else if (signal === "fragmented") {
    optionA.economicStatus = "◐ Moderate";
    optionB.economicStatus = "● Elevated";
  }

  if (friction === "low") {
    optionA.transitionStatus = "○ Contained";
    optionB.transitionStatus = "◐ Moderate";
  } else if (friction === "moderate") {
    optionA.transitionStatus = "◐ Moderate";
    optionB.transitionStatus = "● Elevated";
  } else {
    optionA.transitionStatus = "● Elevated";
    optionB.transitionStatus = "● Elevated";
  }

  return { optionA, optionB, source: "native_bucket" };
}

function buildPerOptionComparativeSignals(
  normalized: AmcNormalizedIntake,
  summary: AmcInputSummary,
  baseStatus: {
    optionA: ComparativeStatusSet;
    optionB: ComparativeStatusSet;
    source: "native_bucket";
  },
): {
  optionA: ComparativeStatusSet;
  optionB: ComparativeStatusSet;
  nativeDimensions: { market: boolean; competition: boolean; economic: boolean; transition: boolean };
  source: "option_text_signal";
} {
  const uniqueSources = Array.from(
    new Set(
      [normalized.optionsUnderConsideration, summary.decisionSnapshot.optionsUnderConsideration]
        .map((item) => (item || "").trim())
        .filter((item) => item.length > 0),
    ),
  );
  const combined = uniqueSources.join("\n");
  const options = extractOptionTexts(combined);

  const aSignal = inferStatusFromOptionText(options.optionA);
  const bSignal = inferStatusFromOptionText(options.optionB);

  const nativeDimensions = {
    market: aSignal.signaled.market && bSignal.signaled.market,
    competition: aSignal.signaled.competition && bSignal.signaled.competition,
    economic: aSignal.signaled.economic && bSignal.signaled.economic,
    transition: aSignal.signaled.transition && bSignal.signaled.transition,
  };

  const optionA: ComparativeStatusSet = {
    marketStatus: nativeDimensions.market ? aSignal.status.marketStatus : baseStatus.optionA.marketStatus,
    competitionStatus: nativeDimensions.competition
      ? aSignal.status.competitionStatus
      : baseStatus.optionA.competitionStatus,
    economicStatus: nativeDimensions.economic ? aSignal.status.economicStatus : baseStatus.optionA.economicStatus,
    transitionStatus: nativeDimensions.transition
      ? aSignal.status.transitionStatus
      : baseStatus.optionA.transitionStatus,
  };

  const optionB: ComparativeStatusSet = {
    marketStatus: nativeDimensions.market ? bSignal.status.marketStatus : baseStatus.optionB.marketStatus,
    competitionStatus: nativeDimensions.competition
      ? bSignal.status.competitionStatus
      : baseStatus.optionB.competitionStatus,
    economicStatus: nativeDimensions.economic ? bSignal.status.economicStatus : baseStatus.optionB.economicStatus,
    transitionStatus: nativeDimensions.transition
      ? bSignal.status.transitionStatus
      : baseStatus.optionB.transitionStatus,
  };

  return {
    optionA,
    optionB,
    nativeDimensions,
    source: "option_text_signal",
  };
}

function extractOptionTexts(text: string): { optionA: string; optionB: string } {
  const normalized = (text || "").replace(/\r\n/g, "\n");
  const matchA = normalized.match(/option\s*a\s*:\s*([\s\S]*?)(?=option\s*b\s*:|$)/i);
  const matchB = normalized.match(/option\s*b\s*:\s*([\s\S]*?)$/i);
  return {
    optionA: (matchA?.[1] || "").trim(),
    optionB: (matchB?.[1] || "").trim(),
  };
}

function inferStatusFromOptionText(optionText: string): {
  status: ComparativeStatusSet;
  signaled: { market: boolean; competition: boolean; economic: boolean; transition: boolean };
} {
  const text = (optionText || "").toLowerCase();

  const marketSupportive = hasAny(text, ["growing", "expanding", "in-demand", "tailwind", "demand"]);
  const marketConstrained = hasAny(text, ["declining", "layoff", "headwind", "limited demand", "stagnant"]);
  const competitionContained = hasAny(text, ["niche", "internal", "known network", "differentiated"]);
  const competitionElevated = hasAny(text, ["elite", "highly competitive", "crowded", "saturated", "top-tier"]);
  const economicContained = hasAny(text, ["stable income", "promotion", "salary stable", "buffer", "savings"]);
  const economicElevated = hasAny(text, ["pay cut", "salary drop", "no buffer", "tuition", "income uncertainty"]);
  const transitionContained = hasAny(text, ["internal", "adjacent", "reversible", "pilot", "same company"]);
  const transitionElevated = hasAny(text, ["relocation", "visa", "phd", "degree", "career switch", "founder"]);

  const status: ComparativeStatusSet = {
    marketStatus: marketSupportive ? "▲ Supportive" : marketConstrained ? "▼ Constrained" : "◆ Mixed",
    competitionStatus: competitionContained ? "○ Contained" : competitionElevated ? "● Elevated" : "◐ Moderate",
    economicStatus: economicContained ? "○ Contained" : economicElevated ? "● Elevated" : "◐ Moderate",
    transitionStatus: transitionContained ? "○ Contained" : transitionElevated ? "● Elevated" : "◐ Moderate",
  };

  return {
    status,
    signaled: {
      market: marketSupportive || marketConstrained,
      competition: competitionContained || competitionElevated,
      economic: economicContained || economicElevated,
      transition: transitionContained || transitionElevated,
    },
  };
}

function hasAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}
