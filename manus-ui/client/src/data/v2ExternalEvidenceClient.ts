import type { V2State } from "./amcV2Model";
import { v2t, type V2CopyKey } from "./v2Language";
import { v2PublicSearchTarget } from "./amcV2Analysis";
import {
  unavailableIntelligence,
  type ExternalIntelligenceV2,
} from "./externalIntelligenceV2";
import {
  parseV2EvidenceRequest,
  v2EvidenceAreas,
  type V2EvidenceRequest,
} from "../../../shared/externalIntelligenceV2Request";
import {
  v2BoundedText,
  v2EvidenceLimits as limit,
} from "../../../shared/externalIntelligenceV2Contract";
import {
  v2EvidenceStages, v2EvidenceDiagnostics, v2EvidenceDiagnosticFields,
  v2SourceFailures, v2EvidenceReasons, type V2EvidenceHttpObservation,
} from "../../../shared/v2EvidenceProtocol";

/** Explicit click only. No decision prose, internal bands, notes, or simulator state. */
export function buildV2EvidenceRequest(
  state: V2State
): V2EvidenceRequest | null {
  // A case-family default is too broad to support target-specific research.
  // The customer must explicitly provide both public target and geography.
  if (!v2PublicSearchTarget(state) || !state.targetGeography.trim()) return null;
  return parseV2EvidenceRequest({
    caseType: state.caseType,
    externalAreas: v2SituationalAreas(state),
    targetGeography: state.targetGeography,
    targetLabel: v2PublicSearchTarget(state),
    language: state.language,
  });
}

export async function requestV2Evidence(
  request: V2EvidenceRequest,
  fetchImpl: typeof fetch = fetch,
  onResponse?: (observation: V2EvidenceHttpObservation) => void
): Promise<ExternalIntelligenceV2> {
  const fallback = () =>
    unavailableIntelligence(request.caseType, request.language);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 270_000);
  try {
    const response = await fetchImpl("/api/amc/external-intelligence-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify(request),
    });
    // Keep only protocol metadata in browser memory for Preview QA. Never log
    // the body, customer input, credentials, or the provider response.
    const readLabel = <T extends string>(name: string, allowed: readonly T[]): T | undefined => {
      const value = response.headers.get(name);
      return value && allowed.includes(value as T) ? value as T : undefined;
    };
    const stage = readLabel("X-AMC-Evidence-Stage", v2EvidenceStages);
    const diagnostic = readLabel("X-AMC-Evidence-Diagnostic", v2EvidenceDiagnostics);
    const field = readLabel("X-AMC-Evidence-Field", v2EvidenceDiagnosticFields);
    const sourceFailure = readLabel("X-AMC-Source-Check", v2SourceFailures);
    const upstream = response.headers.get("X-AMC-Upstream-Status");
    try {
      onResponse?.({
        status: response.status,
        reason: readLabel("X-AMC-Evidence-Reason", v2EvidenceReasons) ?? null,
        ...(stage ? { stage } : {}),
        ...(diagnostic ? { diagnostic } : {}),
        ...(field ? { field } : {}),
        ...(sourceFailure ? { sourceFailure } : {}),
        ...(upstream && /^[1-5]\d{2}$/.test(upstream) ? { upstreamStatus: Number(upstream) } : {}),
      });
    } catch {
      /* QA metadata must never discard valid customer evidence. */
    }
    if (!response.ok) return fallback();
    const raw: unknown = await response.json();
    return acceptV2Evidence(raw, request) ?? fallback();
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}

/** Fail closed if the endpoint ever returns a malformed or mislabeled live snapshot. */
export function acceptV2Evidence(
  raw: unknown,
  request: V2EvidenceRequest
): ExternalIntelligenceV2 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (value.status === "unavailable")
    return unavailableIntelligence(request.caseType, request.language);
  if (
    value.status !== "live" ||
    value.caseType !== request.caseType ||
    typeof value.generatedAt !== "string" ||
    Number.isNaN(Date.parse(value.generatedAt)) ||
    !Array.isArray(value.evidenceBlocks) ||
    value.evidenceBlocks.length < 1 ||
    value.evidenceBlocks.length > limit.blocks
  )
    return null;
  const blocks = value.evidenceBlocks;
  if (value.sourceCoverage !== undefined && !["complete", "partial"].includes(String(value.sourceCoverage)))
    return null;
  if (value.contextConfidence !== undefined &&
      (value.sourceCoverage !== "complete" || !["low", "medium", "high"].includes(String(value.contextConfidence))))
    return null;
  const citedUrls = new Set<string>();
  if (
    !blocks.every(block => {
      if (!block || typeof block !== "object" || Array.isArray(block))
        return false;
      const item = block as Record<string, unknown>;
      const citationKey = `${String(item.sourceUrl)}\n${String(item.dimension)}`;
      if (typeof item.sourceUrl !== "string" || citedUrls.has(citationKey)) return false;
      citedUrls.add(citationKey);
      return (
        item.provenance === "EXTERNAL_EVIDENCE" &&
        (item.area === undefined || (v2EvidenceAreas(request).includes(String(item.area)) &&
          v2t("en", item.area as V2CopyKey) === item.dimension)) &&
        ["supportive", "caution", "mixed"].includes(String(item.direction)) &&
        v2BoundedText(item.dimension, limit.dimension) &&
        v2BoundedText(item.headline, limit.headline) &&
        v2BoundedText(item.fact, limit.fact) &&
        v2BoundedText(item.whyItMatters, limit.whyItMatters) &&
        (item.action === undefined || v2BoundedText(item.action, limit.signal)) &&
        v2BoundedText(item.sourceLabel, limit.headline) &&
        v2BoundedText(item.sourceUrl, limit.sourceUrl) &&
        /^https:\/\//.test(item.sourceUrl) &&
        ((item.sourceDate === undefined && item.sourceDateKind === undefined) ||
          (typeof item.sourceDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.sourceDate) &&
            (item.sourceDateKind === "published" ||
              item.sourceDateKind === "updated")))
      );
    })
  )
    return null;
  if (
    !Array.isArray(value.metrics) ||
    !Array.isArray(value.opportunitySignals) ||
    !Array.isArray(value.frictionSignals) ||
    !Array.isArray(value.uncertainties) ||
    !v2BoundedText(value.implication, limit.implication) ||
    ![
      [value.opportunitySignals, limit.opportunitySignals, 0],
      [value.frictionSignals, limit.frictionSignals, 0],
      [value.uncertainties, limit.uncertainties, 1],
    ].every(([rows, max, min]) =>
      Array.isArray(rows) &&
      rows.length >= (min as number) &&
      rows.length <= (max as number) &&
      rows.every(row => v2BoundedText(row, limit.signal))
    )
  )
    return null;
  const { translation: rawTranslation, ...primary } = value;
  // The other-language version must carry exactly the same cards; otherwise it
  // is dropped and the toggle shows the research language with a notice.
  const translation = rawTranslation && typeof rawTranslation === "object" && !("translation" in (rawTranslation as object))
    ? acceptV2Evidence(rawTranslation, { ...request, language: request.language === "ko" ? "en" : "ko" })
    : null;
  const key = (block: { sourceUrl?: string; dimension: string }) => `${block.sourceUrl}\n${block.dimension}`;
  const sameCards = translation?.status === "live" &&
    translation.evidenceBlocks.map(key).join("|") === (primary.evidenceBlocks as ExternalIntelligenceV2["evidenceBlocks"]).map(key).join("|");
  return (sameCards
    ? { ...primary, translation }
    : primary) as ExternalIntelligenceV2;
}

const domestic = /^(?:한국|대한민국|서울|부산|판교|인천|대구|대전|광주|south korea|korea|seoul|busan|pangyo)$/i;
/**
 * Default topics plus the ones the customer's situation implies (issue B2):
 * a degree abroad also needs living, family and mobility facts. Explicit
 * customer choices are kept as chosen.
 */
/**
 * Topics to research: the customer's picks first, then the case's standard
 * topics, so a framework section never stays empty because a topic was not
 * ticked (owner feedback 2026-10-14). At most 5 topics (3 parallel groups).
 */
export function v2SituationalAreas(state: Pick<V2State, "caseType" | "externalAreas" | "targetGeography">): V2State["externalAreas"] {
  const defaults = [...v2EvidenceAreas({ caseType: state.caseType, externalAreas: [] })];
  const geography = state.targetGeography.trim();
  if (state.caseType === "MBA / EMBA / PhD Decision" && geography && !domestic.test(geography) && !defaults.includes("geographyMobility"))
    defaults.push("geographyMobility");
  const areas = [...state.externalAreas, ...defaults].filter((area, i, all) => all.indexOf(area) === i).slice(0, Math.max(5, state.externalAreas.length));
  return areas as V2State["externalAreas"];
}
