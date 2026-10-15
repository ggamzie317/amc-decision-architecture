import type { ProductApplicationBuildInput, ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2Analysis } from "../data/amcV2Analysis";
import type { V2Sensitivity, V2State } from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2EngineSwitches } from "../data/v2EngineSwitches";
import type { V2Language } from "../data/v2Language";

/**
 * Decision Trace — read-only snapshot.
 *
 * The trace module never computes an analysis. It receives the outputs the
 * results screen already has, copies them, and freezes the copy, so nothing
 * the trace does can reach the engine, the dashboard or the report.
 * Engine switches are derived with the same existing function the
 * framework plan uses; no new rule is added here.
 */
export type V2TraceSnapshot = Readonly<{
  language: V2Language;
  state: V2State;
  input: ProductApplicationBuildInput;
  core: ProductApplicationV3;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  sensitivity: readonly V2Sensitivity[];
  engineSwitches: ReturnType<typeof v2EngineSwitches>;
  /** Areas whose topic search is still running (from the page; client only). */
  pendingAreas: readonly string[];
}>;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

export function buildV2TraceSnapshot(source: {
  state: V2State;
  input: ProductApplicationBuildInput;
  core: ProductApplicationV3;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  sensitivity: readonly V2Sensitivity[];
}): V2TraceSnapshot {
  // structuredClone first: freezing must never touch the page's own objects.
  const copy = structuredClone({
    state: source.state,
    input: source.input,
    core: source.core,
    analysis: source.analysis,
    intelligence: source.intelligence,
    sensitivity: source.sensitivity,
  });
  return deepFreeze({
    language: copy.state.language,
    ...copy,
    engineSwitches: v2EngineSwitches(copy.input, copy.core, copy.state.language),
    pendingAreas: (copy.intelligence as { pendingAreas?: string[] }).pendingAreas ?? [],
  });
}
