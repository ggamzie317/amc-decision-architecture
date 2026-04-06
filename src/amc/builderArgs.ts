import type { AmcNormalizedIntake } from "./normalizeIntake";
import type { AmcDerivedFlags } from "./deriveFlags";
import type { AmcInputSummary } from "./buildInputSummary";
import type { InputNativeMetadata } from "./nativeMetadata";
import type { AmcExternalSnapshotOverride } from "./externalSnapshotOverride";

export type AmcSectionBuilderArgs = {
  normalized: AmcNormalizedIntake;
  structuralFlags: AmcDerivedFlags;
  inputSummary: AmcInputSummary;
  nativeMetadata: InputNativeMetadata;
  externalSnapshotOverride?: AmcExternalSnapshotOverride;
};
