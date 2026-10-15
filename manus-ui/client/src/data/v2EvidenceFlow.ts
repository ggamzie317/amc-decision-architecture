import type { ExternalIntelligenceV2 } from "./externalIntelligenceV2";
import type { V2State } from "./amcV2Model";
import type { V2Language } from "./v2Language";
import type { V2EvidenceHttpObservation } from "../../../shared/v2EvidenceProtocol";
import { allowedV2ExternalAreas } from "../../../shared/externalIntelligenceV2Request";

/**
 * Small pure rules for the page's evidence flow. Presentation and request
 * bookkeeping only: nothing here scores, ranks or recommends.
 */

/** Topic picks that belong to the given case family; picks from another family would make the request invalid. */
export function v2AreasForCase(
  areas: V2State["externalAreas"],
  caseType: V2State["caseType"]
): V2State["externalAreas"] {
  const allowed = allowedV2ExternalAreas(caseType);
  return areas.filter(area => allowed.includes(area));
}

/** Apply a case-type change and drop topic picks from the old family in the same step. */
export function v2WithCaseType(state: V2State, caseType: V2State["caseType"]): V2State {
  const externalAreas = v2AreasForCase(state.externalAreas, caseType);
  return {
    ...state,
    caseType,
    publicSearchTarget: undefined,
    ...(externalAreas.length === state.externalAreas.length ? {} : { externalAreas }),
  };
}

/**
 * One automatic retry per topic only when another attempt can plausibly
 * help: no response (timeout/network), 429, a 5xx other than "provider not
 * configured", or a successful response without usable evidence.
 */
export function v2ShouldRetryTopic(
  observation: V2EvidenceHttpObservation | null,
  result: Pick<ExternalIntelligenceV2, "status">
): boolean {
  if (result.status === "live") return false;
  if (!observation) return true;
  if (observation.reason === "provider_not_configured") return false;
  const status = observation.status;
  if (status === 429) return true;
  if (status >= 500) return true;
  return status >= 200 && status < 300;
}

/** Prefer a usable snapshot (live/demo) in the UI language, then in the research language. */
export function v2PickEvidence(
  byLanguage: Record<V2Language, ExternalIntelligenceV2 | null>,
  language: V2Language,
  researchLanguage: V2Language
): ExternalIntelligenceV2 | null {
  const usable = (value: ExternalIntelligenceV2 | null) =>
    value && (value.status === "live" || value.status === "demo") ? value : null;
  return usable(byLanguage[language]) ?? usable(byLanguage[researchLanguage]) ??
    byLanguage[language] ?? byLanguage[researchLanguage] ?? null;
}

/**
 * Store a merged snapshot under its research language and its translation
 * under the other language. Without a translation the other entry is
 * cleared, so an older translation can never show a different card set.
 */
export function v2StoreEvidence(
  previous: Record<V2Language, ExternalIntelligenceV2 | null>,
  researchLanguage: V2Language,
  merged: ExternalIntelligenceV2,
  pendingAreas: string[] = []
): Record<V2Language, ExternalIntelligenceV2 | null> {
  const other: V2Language = researchLanguage === "ko" ? "en" : "ko";
  const { translation, ...primary } = merged;
  const pending = (snapshot: ExternalIntelligenceV2): ExternalIntelligenceV2 => {
    const { pendingAreas: _old, ...rest } = snapshot;
    return pendingAreas.length ? { ...rest, pendingAreas: [...pendingAreas] } : rest;
  };
  return {
    ...previous,
    [researchLanguage]: pending(primary),
    [other]: translation ? pending(translation) : null,
  } as Record<V2Language, ExternalIntelligenceV2 | null>;
}

/** Client-only field; never accepted from a server response. */
export function v2WithoutPending(snapshot: ExternalIntelligenceV2): ExternalIntelligenceV2 {
  const { pendingAreas: _pending, translation, ...rest } = snapshot;
  return translation ? { ...rest, translation: v2WithoutPending(translation) } : rest;
}

/** Topic groups from an earlier run that still need a search (missing or failed). */
export function v2MissingGroups<T>(lives: readonly (T | undefined)[]): number[] {
  return lives.flatMap((live, index) => (live ? [] : [index]));
}
