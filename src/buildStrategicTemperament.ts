import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcInputSummary } from "./amc/buildInputSummary";
import { inferCaseType } from "./amc/inferCaseType";

export interface StrategicTemperamentOutput {
  section: "strategic_temperament";
  title: "Strategic Temperament";
  caseType: "single" | "comparative";
  postureLine: string;
  evidenceLine: string;
  paceLine: string;
  disciplineLine: string;
  comparativeReading?: string;
}

export function buildStrategicTemperament(args: {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
}): StrategicTemperamentOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: StrategicTemperamentOutput = {
      section: "strategic_temperament",
      title: "Strategic Temperament",
      caseType,
      postureLine: "The case appears to carry a cautious but not inactive decision posture.",
      evidenceLine:
        "Evidence appears present in part, though not yet fully consolidated into a stable validation base.",
      paceLine: "Pace appears generally measured, though not entirely free from ambiguity or timing pressure.",
      disciplineLine:
        "This increases the importance of clearer thresholds, staged validation, and disciplined pace control.",
    };

    if (caseType === "comparative") {
      fallback.comparativeReading =
        "The comparison appears to pull decision posture in different directions without yielding a single dominant handling mode.";
    }

    return fallback;
  }

  const posture = inferPostureBucket(structuralFlags);
  const evidence = inferEvidenceBucket(structuralFlags);
  const pace = inferPaceBucket(structuralFlags);
  const discipline = inferDisciplineBucket(structuralFlags, caseType);

  const output: StrategicTemperamentOutput = {
    section: "strategic_temperament",
    title: "Strategic Temperament",
    caseType,
    postureLine: buildPostureLine(posture, caseType),
    evidenceLine: buildEvidenceLine(evidence, caseType),
    paceLine: buildPaceLine(pace, caseType),
    disciplineLine: buildDisciplineLine(discipline, caseType),
  };

  if (caseType === "comparative") {
    output.comparativeReading = buildComparativeReading(posture, evidence, pace, discipline);
  }

  return output;
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

type PostureBucket = "cautious" | "exploratory" | "serious_but_split" | "pressure_shaped";
type EvidenceBucket = "validated" | "emerging" | "interpretation_exposed";
type PaceBucket = "measured" | "uneven" | "compressed";
type DisciplineBucket = "thresholds" | "sequencing" | "separation" | "pace_control";

function inferPostureBucket(flags: AmcDerivedFlags): PostureBucket {
  if (flags.highUrgency && (flags.highExecutionRisk || flags.lowDecisionClarity)) {
    return "pressure_shaped";
  }
  if (flags.downsideProtectiveStyle && !flags.highUrgency) {
    return "cautious";
  }
  if (flags.upsideMaximizingStyle && (flags.mediumDecisionClarity || flags.highInterpretiveNeed)) {
    return "exploratory";
  }
  return "serious_but_split";
}

function inferEvidenceBucket(flags: AmcDerivedFlags): EvidenceBucket {
  if (flags.structurallySupportedMove && flags.highDecisionClarity && !flags.highInterpretiveNeed) {
    return "validated";
  }
  if (flags.highInterpretiveNeed || flags.lowDecisionClarity || flags.someRestructuringRisk) {
    return "interpretation_exposed";
  }
  return "emerging";
}

function inferPaceBucket(flags: AmcDerivedFlags): PaceBucket {
  if (flags.highUrgency && (flags.highExecutionRisk || flags.weakSafetyNet || flags.lowDecisionClarity)) {
    return "compressed";
  }
  if (flags.mediumUrgency || flags.highInterpretiveNeed || flags.mediumDecisionClarity) {
    return "uneven";
  }
  return "measured";
}

function inferDisciplineBucket(flags: AmcDerivedFlags, caseType: "single" | "comparative"): DisciplineBucket {
  if (flags.highExecutionRisk || flags.structurallyFragileMove) {
    return "thresholds";
  }
  if (caseType === "comparative") {
    return "separation";
  }
  if (flags.highInterpretiveNeed || flags.someRestructuringRisk || flags.unclearMarketOutlook) {
    return "sequencing";
  }
  return "pace_control";
}

function buildPostureLine(bucket: PostureBucket, caseType: "single" | "comparative"): string {
  if (bucket === "cautious") {
    return "The case appears to show a cautious but directionally serious decision posture.";
  }
  if (bucket === "exploratory") {
    return "The decision posture appears exploratory, though not yet fully consolidated into execution logic.";
  }
  if (bucket === "pressure_shaped") {
    return "The posture appears meaningfully shaped by timing pressure and constrained readiness conditions.";
  }
  return caseType === "comparative"
    ? "The posture appears pulled between movement interest and preservation logic across the two paths."
    : "The case suggests a serious but split posture, with directional intent moderated by structural caution.";
}

function buildEvidenceLine(bucket: EvidenceBucket, caseType: "single" | "comparative"): string {
  if (bucket === "validated") {
    return "Judgment appears evidence-aware with a relatively stable proof base supporting directional assessment.";
  }
  if (bucket === "interpretation_exposed") {
    return caseType === "comparative"
      ? "The current posture suggests directional interest is exposed to interpretation gaps across the comparative frame."
      : "The current posture suggests directional interest is running ahead of fully validated evidence.";
  }
  return "The case appears to rely on emerging evidence rather than fully consolidated proof.";
}

function buildPaceLine(bucket: PaceBucket, caseType: "single" | "comparative"): string {
  if (bucket === "measured") {
    return "Movement pace appears measured and generally deliberate rather than impulsive.";
  }
  if (bucket === "compressed") {
    return caseType === "comparative"
      ? "Decision tempo appears compressed in parts of the comparison relative to current readiness depth."
      : "Decision tempo appears somewhat compressed relative to current readiness.";
  }
  return caseType === "comparative"
    ? "The case suggests uneven pacing between reflection, evidence gathering, and comparative commitment pressure."
    : "Pace appears measured, though not fully detached from timing pressure and ambiguity.";
}

function buildDisciplineLine(bucket: DisciplineBucket, caseType: "single" | "comparative"): string {
  if (bucket === "thresholds") {
    return "This posture increases the importance of explicit thresholds and staged validation discipline.";
  }
  if (bucket === "sequencing") {
    return "This case appears better suited to sequencing discipline than to rapid commitment logic.";
  }
  if (bucket === "separation") {
    return "The current posture suggests that separating exploration from commitment remains structurally important.";
  }
  return caseType === "comparative"
    ? "This increases the value of clearer evidence rules and pace control across both paths."
    : "This increases the value of clearer evidence rules and steady pace control.";
}

function buildComparativeReading(
  posture: PostureBucket,
  evidence: EvidenceBucket,
  pace: PaceBucket,
  discipline: DisciplineBucket,
): string {
  if (pace === "compressed" || evidence === "interpretation_exposed") {
    return "One path may invite movement through directional pull, while the other invites caution through heavier proof demands.";
  }
  if (discipline === "separation" || posture === "serious_but_split") {
    return "The comparison suggests different decision postures rather than a simple strong-versus-weak preference.";
  }
  return "The contrast appears to lie in how each option affects pacing, proof standards, and commitment discipline.";
}
