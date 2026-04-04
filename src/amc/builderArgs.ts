import type { AmcNormalizedIntake } from "./normalizeIntake";
import type { AmcDerivedFlags } from "./deriveFlags";
import type { AmcInputSummary } from "./buildInputSummary";
import type { InputNativeMetadata } from "./nativeMetadata";

export type AmcSectionBuilderArgs = {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
  nativeMetadata: InputNativeMetadata;
};
