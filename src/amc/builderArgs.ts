import type { AmcNormalizedIntake } from "./normalizeIntake";
import type { AmcDerivedFlags } from "./deriveFlags";
import type { AmcInputSummary } from "./buildInputSummary";

export type AmcSectionBuilderArgs = {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
};
