import type { ExternalSnapshot } from "./customerLanguageFirewall";
import type { ExternalIntelligenceV2 } from "./externalIntelligenceV2";

/** Adapt genuine public context to the existing current-case helper. All band
 * derivation stays there; access checks do not verify personal fit. Missing
 * confidence is never replaced by card counts, URL access or a default. */
export function v2ExternalContext(snapshot?: ExternalIntelligenceV2): ExternalSnapshot {
  const unverified: ExternalSnapshot = {
    status: "unverified", confidence: "low", generatedAtLabel: "",
    externalSignals: [], sourceNotes: [], uncertaintyNotes: [], implication: "",
  };
  if (!snapshot || snapshot.status !== "live" || snapshot.sourceCoverage !== "complete" ||
      !["low", "medium", "high"].includes(snapshot.contextConfidence ?? "") ||
      !snapshot.generatedAt || Number.isNaN(Date.parse(snapshot.generatedAt)) || !snapshot.evidenceBlocks.length ||
      !snapshot.evidenceBlocks.every(block => block.provenance === "EXTERNAL_EVIDENCE" &&
        block.sourceUrl?.startsWith("https://"))) return unverified;
  return {
    status: "live",
    confidence: snapshot.contextConfidence!,
    generatedAtLabel: snapshot.generatedAt,
    externalSignals: snapshot.evidenceBlocks.map(block => ({
      label: block.dimension, direction: block.direction, reading: block.fact,
    })),
    sourceNotes: snapshot.evidenceBlocks.map(block => ({
      sourceLabel: block.sourceLabel, note: block.whyItMatters, evidenceType: "general",
    })),
    uncertaintyNotes: snapshot.uncertainties,
    implication: snapshot.implication,
  };
}
