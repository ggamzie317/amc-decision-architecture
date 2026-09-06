import {
  deriveSafetyMarginCore,
  type ProductApplicationBuildInput,
  type SafetyMarginInputs,
  type StructuralLoad,
  type StructuralRisk,
  type StructuralSignal,
  type StructuralStrength,
} from "./amcProductApplicationV3";
import type { ExternalSnapshot } from "./customerLanguageFirewall";

export type CurrentCaseStructuredSelections = {
  17: StructuralStrength | null;
  19: StructuralStrength | null;
  20: StructuralStrength | null;
  21: StructuralRisk | null;
  23: StructuralStrength | null;
  25: StructuralLoad | null;
};

export type CurrentCaseStructuredQuestionId = keyof CurrentCaseStructuredSelections;

export const initialCurrentCaseStructuredSelections: CurrentCaseStructuredSelections = {
  17: null,
  19: null,
  20: null,
  21: null,
  23: null,
  25: null,
};

function unavailableSignal<TBand extends string>(): StructuralSignal<TBand> {
  return { band: "unknown" as TBand, source: "unavailable" };
}

function selectedSignal<TBand extends string>(band: TBand | null): StructuralSignal<TBand> {
  return band === null
    ? unavailableSignal<TBand>()
    : { band, source: "current-user-structured" };
}

function externalValidationSignal(snapshot: ExternalSnapshot): StructuralSignal<StructuralStrength> {
  if (snapshot.status !== "live") return unavailableSignal<StructuralStrength>();
  const supportive = snapshot.externalSignals.filter((signal) => signal.direction === "supportive").length;
  const caution = snapshot.externalSignals.filter((signal) => signal.direction === "caution").length;
  const band = snapshot.confidence === "high" && supportive > caution
    ? "strong"
    : snapshot.confidence === "low" && caution > supportive
      ? "weak"
      : "developing";
  return { band, source: "live-external-evidence" };
}

export function buildCurrentCaseStructuralSignals(input: {
  externalSnapshot: ExternalSnapshot;
  selections: CurrentCaseStructuredSelections;
}): {
  safetyMarginInputs: SafetyMarginInputs;
  structuralSignals: ProductApplicationBuildInput["structuralSignals"];
} {
  const safetyMarginInputs: SafetyMarginInputs = {
    financialRoom: selectedSignal(input.selections[19]),
    reversibility: selectedSignal(input.selections[20]),
    downsideExposure: selectedSignal(input.selections[21]),
  };
  const safetyMargin = deriveSafetyMarginCore(safetyMarginInputs);

  return {
    safetyMarginInputs,
    structuralSignals: {
      externalValidation: externalValidationSignal(input.externalSnapshot),
      internalReadiness: selectedSignal(input.selections[17]),
      safetyMargin: { band: safetyMargin.band, source: safetyMargin.source },
      reversibility: safetyMarginInputs.reversibility,
      optionBSupport: selectedSignal(input.selections[23]),
      structuralRisk: safetyMarginInputs.downsideExposure,
      constraintLoad: selectedSignal(input.selections[25]),
      missingPointImpact: unavailableSignal(),
    },
  };
}
