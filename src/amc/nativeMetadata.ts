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

  return {
    ...completeness,
    matrixBands: {
      marketOutlook: pickBand(structuralFlags.growingMarketOutlook, structuralFlags.decliningMarketOutlook),
      companyStability: pickBand(structuralFlags.highCompanyStability, structuralFlags.lowCompanyStability),
      fifwmRisk: pickBand(structuralFlags.strongSafetyNet, structuralFlags.weakSafetyNet),
      personalFit: pickBand(
        !!structuralFlags.highDecisionClarity && !!structuralFlags.highRiskComfort,
        !!structuralFlags.lowDecisionClarity || !!structuralFlags.lowRiskComfort,
      ),
      upsideDownside: pickBand(structuralFlags.structurallySupportedMove, structuralFlags.structurallyFragileMove),
    },
    optionLabels,
  };
}

function pickBand(strong: unknown, weak: unknown): MatrixBand {
  if (strong) {
    return "strong";
  }
  if (weak) {
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
