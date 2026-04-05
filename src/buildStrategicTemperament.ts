import type { AmcNormalizedIntake } from "./amc/normalizeIntake";
import type { AmcDerivedFlags } from "./amc/deriveFlags";
import type { AmcSectionBuilderArgs } from "./amc/builderArgs";
import { isWeakEvidence } from "./amc/weakEvidence";
import { inferCaseType } from "./amc/inferCaseType";

export interface StrategicTemperamentOutput {
  section: "strategic_temperament";
  title: "성향과 선택의 적합성";
  caseType: "single" | "comparative";
  postureLine: string;
  evidenceLine: string;
  paceLine: string;
  disciplineLine: string;
  comparativeReading?: string;
}

export function buildStrategicTemperament(args: AmcSectionBuilderArgs): StrategicTemperamentOutput {
  const { normalized, structuralFlags, inputSummary } = args;

  const caseType = inferCaseType(normalized, inputSummary);
  const weakEvidence = isWeakEvidence(normalized, structuralFlags, inputSummary);

  if (weakEvidence) {
    const fallback: StrategicTemperamentOutput = {
      section: "strategic_temperament",
      title: "성향과 선택의 적합성",
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
    title: "성향과 선택의 적합성",
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
    return "Decision posture is cautious but directionally serious, with protective bias still active.";
  }
  if (bucket === "exploratory") {
    return "Decision posture is exploratory, though not yet consolidated into stable execution posture.";
  }
  if (bucket === "pressure_shaped") {
    return "Decision posture is materially shaped by timing pressure and constrained readiness conditions.";
  }
  return caseType === "comparative"
    ? "Posture is split across the two paths, with movement interest and preservation logic pulling in different directions."
    : "Posture remains serious but split, with directional intent moderated by structural caution.";
}

function buildEvidenceLine(bucket: EvidenceBucket, caseType: "single" | "comparative"): string {
  if (bucket === "validated") {
    return "Judgment discipline appears evidence-aware, with a relatively stable proof base supporting directional assessment.";
  }
  if (bucket === "interpretation_exposed") {
    return caseType === "comparative"
      ? "Directional pull remains exposed to interpretation gaps across the comparative frame."
      : "Directional pull appears to be running ahead of fully validated evidence.";
  }
  return "Current judgment relies on emerging evidence rather than fully consolidated proof.";
}

function buildPaceLine(bucket: PaceBucket, caseType: "single" | "comparative"): string {
  if (bucket === "measured") {
    return "Commitment pace appears measured and deliberate rather than impulsive.";
  }
  if (bucket === "compressed") {
    return caseType === "comparative"
      ? "Commitment tempo appears compressed in parts of the comparison relative to readiness depth."
      : "Commitment tempo appears somewhat compressed relative to current readiness.";
  }
  return caseType === "comparative"
    ? "Pacing remains uneven between reflection, evidence gathering, and comparative commitment pressure."
    : "Pacing remains measured, though not fully detached from timing pressure and ambiguity.";
}

function buildDisciplineLine(bucket: DisciplineBucket, caseType: "single" | "comparative"): string {
  if (bucket === "thresholds") {
    return "Posture control requires explicit thresholds and staged validation discipline.";
  }
  if (bucket === "sequencing") {
    return "Behavioral control is better served by sequencing discipline than by rapid commitment logic.";
  }
  if (bucket === "separation") {
    return "Posture governance requires clear separation between exploration mode and commitment mode.";
  }
  return caseType === "comparative"
    ? "This posture is best sustained by clear evidence rules and pace control across both paths."
    : "This posture is best sustained by clear evidence rules and steady pace control.";
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
