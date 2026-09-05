import type { ProductApplicationV3 } from "./amcProductApplicationV3";
import type { ExternalSnapshot } from "./customerLanguageFirewall";

export type FounderOpsDerivedContext = {
  productApplication: ProductApplicationV3;
  externalSnapshot: ExternalSnapshot;
  language: "en" | "ko";
  caseType: string;
  missingPoint: string;
  decisionConditions: string[];
  primaryRisk: { name: string; meaning: string };
  comparisonRows: ReadonlyArray<Record<string, unknown>>;
  internalSignals: ReadonlyArray<Record<string, unknown>>;
};

export function buildFounderOpsDerivedPatch(context: FounderOpsDerivedContext) {
  const { productApplication, externalSnapshot } = context;
  const persistedEvidenceMode = externalSnapshot.status === "unverified"
    ? "fallback"
    : externalSnapshot.status === "checking"
      ? null
      : externalSnapshot.status;
  return {
    language: context.language,
    caseType: context.caseType,
    structuralOutputJson: {
      caseType: context.caseType,
      currentStructuralPosture: productApplication.currentStructuralPosture,
      postureEvidenceCoverage: productApplication.postureEvidenceCoverage,
      postureBasis: productApplication.postureBasis,
      why: productApplication.why,
      changingPlays: productApplication.changingPlays,
      safetyMargin: productApplication.safetyMargin,
      decisionSwitches: productApplication.decisionSwitches,
      nextStepExperiment: productApplication.nextStepExperiment,
      analysisSequence: productApplication.analysisSequence,
      primaryRisk: context.primaryRisk,
      comparisonRows: context.comparisonRows,
      internalSignals: context.internalSignals,
      decisionStructure: productApplication.decisionStructure,
    },
    missingPoint: context.missingPoint,
    alternativePath: productApplication.changingPlays[0]?.move ?? null,
    decisionConditionsJson: context.decisionConditions,
    safetyMarginStructuredData: {
      ...productApplication.safetyMargin,
      safetyMarginInputs: productApplication.safetyMargin.inputs,
      band: productApplication.postureBasis.safetyMargin.band,
      source: productApplication.postureBasis.safetyMargin.source,
      reversibility: productApplication.postureBasis.reversibility,
    },
    existingFifwmStructuredData: {
      ...productApplication.decisionStructure.fifwm,
      source: productApplication.decisionStructure.fifwmSource,
    },
    externalEvidenceMode: persistedEvidenceMode,
    externalEvidenceConfidence: externalSnapshot.confidence,
    externalEvidenceJson: externalSnapshot,
  };
}

export function founderOpsDerivedFingerprint(
  patch: ReturnType<typeof buildFounderOpsDerivedPatch>,
) {
  return JSON.stringify({
    externalEvidenceMode: patch.externalEvidenceMode,
    externalEvidenceConfidence: patch.externalEvidenceConfidence,
    externalEvidenceGeneratedAt: patch.externalEvidenceJson.generatedAtLabel,
    currentStructuralPosture: patch.structuralOutputJson.currentStructuralPosture,
    changingPlays: patch.structuralOutputJson.changingPlays,
    safetyMarginBand: patch.safetyMarginStructuredData.band,
    decisionSwitches: patch.structuralOutputJson.decisionSwitches,
  });
}
