import type { V2State } from "./amcV2Model";
import { v2PublicSearchTarget } from "./amcV2Analysis";
import {
  unavailableIntelligence,
  type ExternalIntelligenceV2,
} from "./externalIntelligenceV2";
import {
  parseV2EvidenceRequest,
  type V2EvidenceRequest,
} from "../../../shared/externalIntelligenceV2Request";

/** Explicit click only. No decision prose, internal bands, notes, or simulator state. */
export function buildV2EvidenceRequest(
  state: V2State
): V2EvidenceRequest | null {
  return parseV2EvidenceRequest({
    caseType: state.caseType,
    externalAreas: state.externalAreas,
    targetGeography: state.targetGeography,
    targetLabel: v2PublicSearchTarget(state),
    language: state.language,
  });
}

export async function requestV2Evidence(
  request: V2EvidenceRequest,
  fetchImpl: typeof fetch = fetch
): Promise<ExternalIntelligenceV2> {
  const fallback = () =>
    unavailableIntelligence(request.caseType, request.language);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetchImpl("/api/amc/external-intelligence-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify(request),
    });
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
    value.evidenceBlocks.length < 2 ||
    value.evidenceBlocks.length > 4
  )
    return null;
  const blocks = value.evidenceBlocks;
  if (
    !blocks.every(block => {
      if (!block || typeof block !== "object" || Array.isArray(block))
        return false;
      const item = block as Record<string, unknown>;
      return (
        item.provenance === "EXTERNAL_EVIDENCE" &&
        ["supportive", "caution", "mixed"].includes(String(item.direction)) &&
        ["dimension", "headline", "fact", "whyItMatters", "sourceLabel"].every(
          key =>
            typeof item[key] === "string" &&
            (item[key] as string).trim().length > 0
        ) &&
        typeof item.sourceUrl === "string" &&
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
    typeof value.implication !== "string"
  )
    return null;
  return value as ExternalIntelligenceV2;
}
