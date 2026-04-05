import type { AmcDerivedFlags } from "./deriveFlags";
import type { AmcNormalizedIntake } from "./normalizeIntake";
import { computeInputCompletenessMetadata, type InputCompletenessMetadata } from "./inputCompleteness";

export type MatrixBand = "strong" | "partial" | "weak";

export interface InputNativeMetadata extends InputCompletenessMetadata {
  matrixBands: {
    marketOutlook: MatrixBand;
    companyStability: MatrixBand;
    fifwmRisk: MatrixBand;
    personalFit: MatrixBand;
    upsideDownside: MatrixBand;
  };
  optionLabels: {
    optionA: string;
    optionB: string;
    source: "parsed" | "missing";
  };
}

export function buildInputNativeMetadata(
  normalized: AmcNormalizedIntake,
  structuralFlags: AmcDerivedFlags,
): InputNativeMetadata {
  const completeness = computeInputCompletenessMetadata(normalized);
  const optionLabels = parseOptionLabels(normalized.optionsUnderConsideration || "");
  const profile = detectComparativeProfile(normalized);
  const matrixBands = deriveMatrixBands(normalized, structuralFlags, profile);

  return {
    ...completeness,
    matrixBands,
    optionLabels,
  };
}

type ComparativeProfile = "general" | "family_relocation" | "exit_package_vs_stay" | "reemployment_vs_search";

function detectComparativeProfile(normalized: AmcNormalizedIntake): ComparativeProfile {
  const text = [
    normalized.mainDecision,
    normalized.optionsUnderConsideration,
    normalized.nonNegotiable,
    normalized.biggestRisks,
    normalized.marketDemandReason,
    ...(normalized.topPriorities || []),
  ]
    .join(" ")
    .toLowerCase();

  const familyRelocation =
    /(china|beijing)/.test(text) &&
    /(overseas|abroad|singapore|asia transition|international)/.test(text) &&
    /(family|children|education|school|housing)/.test(text);

  if (familyRelocation) {
    return "family_relocation";
  }

  const exitPackageVsStay =
    /(retirement package|exit package|package)/.test(text) &&
    /(stay in role|staying in role|stay path|continue in role|current company path)/.test(text);
  if (exitPackageVsStay) {
    return "exit_package_vs_stay";
  }

  const reemploymentVsSearch =
    /(job offer|reemployment|lower-paid|unemployment benefits|continued search|benefits end|search)/.test(text) &&
    /(income stability|company stability|psychological recovery|weaker long-term position)/.test(text);
  if (reemploymentVsSearch) {
    return "reemployment_vs_search";
  }

  return "general";
}

function deriveMatrixBands(
  normalized: AmcNormalizedIntake,
  flags: AmcDerivedFlags,
  profile: ComparativeProfile,
): InputNativeMetadata["matrixBands"] {
  const sourceText = [
    normalized.mainDecision,
    normalized.optionsUnderConsideration,
    normalized.marketDemandReason,
    normalized.nonNegotiable,
    normalized.biggestRisks,
    normalized.mustAnswerQuestion,
    normalized.stayScenario12to18m,
    ...(normalized.topPriorities || []),
  ]
    .join(" ")
    .toLowerCase();

  const marketScore =
    score(
      0,
      flags.growingMarketOutlook ? 2 : 0,
      flags.decliningMarketOutlook ? -2 : 0,
      flags.highExternalExposure ? -1 : 0,
      /(struggl|selective|tight|uncertain|mixed|varies sharply)/.test(sourceText) ? -1 : 0,
      /(demand exists|opportunity|offer in hand|regional roles offer opportunity)/.test(sourceText) ? 1 : 0,
      profile === "reemployment_vs_search" ? -1 : 0,
      profile === "exit_package_vs_stay" ? -1 : 0,
    );

  const companyScore =
    score(
      0,
      flags.highCompanyStability ? 2 : 0,
      flags.highCompanyHealthConfidence ? 1 : 0,
      flags.lowCompanyStability ? -2 : 0,
      flags.lowCompanyHealthConfidence ? -2 : 0,
      flags.majorRestructuringRisk ? -2 : flags.someRestructuringRisk ? -1 : 0,
      profile === "reemployment_vs_search" ? -1 : 0,
    );

  const fifwmScore =
    score(
      0,
      flags.strongSafetyNet ? 2 : 0,
      flags.moderateSafetyNet ? 1 : 0,
      flags.weakSafetyNet ? -2 : 0,
      flags.lowSponsorSupport ? -1 : 0,
      flags.highUrgency ? -1 : 0,
      /(cash burn|runway|buffer|income cliff|benefits end|liquidity)/.test(sourceText) ? -1 : 0,
      profile === "family_relocation" ? -1 : 0,
      profile === "reemployment_vs_search" ? -1 : 0,
    );

  const personalScore =
    score(
      0,
      flags.highDecisionClarity ? 2 : 0,
      flags.mediumDecisionClarity ? 1 : 0,
      flags.lowDecisionClarity ? -2 : 0,
      flags.highRiskComfort ? 1 : 0,
      flags.lowRiskComfort ? -1 : 0,
      flags.lowSponsorSupport ? -1 : 0,
      /(exhaustion|recovery|psychological|strain|anxiety|confidence loss)/.test(sourceText) ? -1 : 0,
      profile === "family_relocation" ? 1 : 0,
      profile === "reemployment_vs_search" ? -1 : 0,
    );

  const upsideScore =
    score(
      0,
      flags.structurallySupportedMove ? 2 : 0,
      flags.structurallyFragileMove ? -2 : 0,
      flags.upsideMaximizingStyle ? 1 : 0,
      flags.downsideProtectiveStyle ? -1 : 0,
      flags.highDifferentiation ? 1 : 0,
      flags.someRestructuringRisk || flags.majorRestructuringRisk ? -1 : 0,
      profile === "family_relocation" ? 1 : 0,
      profile === "reemployment_vs_search" ? -1 : 0,
    );

  return {
    marketOutlook: bandFromScore(marketScore),
    companyStability: bandFromScore(companyScore),
    fifwmRisk: bandFromScore(fifwmScore),
    personalFit: bandFromScore(personalScore),
    upsideDownside: bandFromScore(upsideScore),
  };
}

function score(...parts: number[]): number {
  return parts.reduce((acc, cur) => acc + cur, 0);
}

function bandFromScore(scoreValue: number): MatrixBand {
  if (scoreValue >= 2) {
    return "strong";
  }
  if (scoreValue <= -1) {
    return "weak";
  }
  return "partial";
}

function parseOptionLabels(text: string): InputNativeMetadata["optionLabels"] {
  const optionA = extractLabeledOption(text, "A") || "";
  const optionB = extractLabeledOption(text, "B") || "";
  const source = optionA && optionB ? "parsed" : "missing";
  return { optionA, optionB, source };
}

function extractLabeledOption(source: string, label: "A" | "B"): string | null {
  const m = source.match(new RegExp(`Option\\s*${label}\\s*:\\s*([^\\n.]+)`));
  if (!m || !m[1]) {
    return null;
  }
  const value = m[1].trim();
  return value || null;
}
