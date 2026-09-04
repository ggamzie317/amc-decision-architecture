export type ExternalSignalDirection = "supportive" | "mixed" | "caution";
export type ExternalEvidenceType = "market" | "company" | "education" | "region" | "role" | "general";

export type ExternalSnapshot = {
  status: "mock" | "live" | "fallback" | "checking" | "unverified";
  confidence: "low" | "medium" | "high";
  generatedAtLabel: string;
  externalSignals: Array<{
    label: string;
    direction: ExternalSignalDirection;
    reading: string;
  }>;
  sourceNotes: Array<{
    sourceLabel: string;
    note: string;
    evidenceType: ExternalEvidenceType;
  }>;
  uncertaintyNotes: string[];
  implication: string;
};

const customerExternalTextReplacements: Array<[RegExp, string]> = [
  [/canonical scorer/gi, "analysis method"],
  [/structured signal/gi, "decision indicator"],
  [/signal provenance/gi, "evidence source"],
  [/current-user-structured/gi, "current case"],
  [/current-case-derived/gi, "current case"],
  [/framework version/gi, "analysis version"],
  [/product version/gi, "release version"],
  [/FIFWM-SM-V2/gi, "AMC analysis"],
  [/AMC-LAUNCH-V3/gi, "AMC analysis"],
  [/Market\s*\/\s*Policy/gi, "external environment"],
  [/MarketPolicy/gi, "external environment"],
  [/FIFWM/gi, "decision structure"],
  [/\bFormal\b/gi, "defined"],
  [/\bInformal\b/gi, "relational"],
  [/\bFramework\b/gi, "approach"],
  [/\bWorkflow\b/gi, "operating path"],
  [/\bcanonical\b/gi, "established"],
  [/\bscorer\b/gi, "analysis"],
  [/\bsignal\b/gi, "indicator"],
  [/\bband\b/gi, "level"],
  [/\bnull\b/gi, "not yet established"],
  [/\bunavailable\b/gi, "not yet verified"],
  [/\bmock\b/gi, "preview"],
  [/\bfallback\b/gi, "limited context"],
  [/\bprovider\b/gi, "source"],
  [/\bAPI\b/gi, "service"],
  [/\bendpoint\b/gi, "service"],
  [/\bMVP\b/gi, "preview"],
  [/\bdeveloper\b/gi, "team"],
];

export function customerSafeExternalText(value: string) {
  return customerExternalTextReplacements.reduce(
    (safeValue, [pattern, replacement]) => safeValue.replace(pattern, replacement),
    value,
  );
}

export function customerSafeExternalSnapshot(snapshot: ExternalSnapshot): ExternalSnapshot {
  return {
    ...snapshot,
    generatedAtLabel: customerSafeExternalText(snapshot.generatedAtLabel),
    externalSignals: snapshot.externalSignals.map((item) => ({
      ...item,
      label: customerSafeExternalText(item.label),
      reading: customerSafeExternalText(item.reading),
    })),
    sourceNotes: snapshot.sourceNotes.map((item) => ({
      ...item,
      sourceLabel: customerSafeExternalText(item.sourceLabel),
      note: customerSafeExternalText(item.note),
    })),
    uncertaintyNotes: snapshot.uncertaintyNotes.map(customerSafeExternalText),
    implication: customerSafeExternalText(snapshot.implication),
  };
}
