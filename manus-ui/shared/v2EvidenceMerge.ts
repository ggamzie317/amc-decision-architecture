import type { ExternalIntelligenceV2 } from "../client/src/data/externalIntelligenceV2.js";
import { v2EvidenceLimits as limit, v2TextLength } from "./externalIntelligenceV2Contract.js";
import { v2EvidenceAreas, type V2EvidenceRequest } from "./externalIntelligenceV2Request.js";

/**
 * Shared by the server and the browser: topic grouping, translation alignment
 * and merging of topic results, so a progressively filled snapshot is built
 * by exactly the same rules wherever it is assembled.
 */

export function limitedEvidence(
  live: ExternalIntelligenceV2,
  evidenceBlocks: ExternalIntelligenceV2["evidenceBlocks"],
  language: "en" | "ko"
): ExternalIntelligenceV2 {
  return {
    ...live,
    sourceCoverage: "partial",
    // The provider's confidence for this topic, kept apart from contextConfidence
    // (which requires complete coverage) so one excluded card does not discard it.
    ...(live.contextConfidence || (live as Confidence).topicConfidence
      ? { topicConfidence: live.contextConfidence ?? (live as Confidence).topicConfidence }
      : {}),
    contextConfidence: undefined,
    evidenceBlocks,
    metrics: [],
    opportunitySignals: [],
    frictionSignals: [],
    uncertainties: [language === "ko"
      ? "출처가 반복되거나 확인되지 않은 일부 카드를 제외했습니다. 남은 카드의 주장과 적용 범위도 원문에서 확인해야 합니다."
      : "Some cards repeated a source or could not be checked and were excluded. Compare each remaining claim and its scope with the source text."],
    implication: language === "ko"
      ? "서로 다른 출처의 일부 사실만 표시합니다. 제외된 카드에 의존할 수 있는 종합 해석은 표시하지 않습니다."
      : "Only facts from distinct remaining sources are shown. Provider summaries that may depend on excluded cards are omitted.",
  };
}

type Confidence = { topicConfidence?: "low" | "medium" | "high" };
const topicConfidenceOf = (live: ExternalIntelligenceV2) => live.contextConfidence ?? (live as Confidence).topicConfidence;

export const citationKey = (block: { sourceUrl?: string; dimension: string }) => `${block.sourceUrl}\n${block.dimension}`;

/** Keep the translation only for the primary's exact cards, in the same order and scope. */
export function alignTranslation(
  primary: ExternalIntelligenceV2,
  alternate: ExternalIntelligenceV2,
  language: "en" | "ko"
): ExternalIntelligenceV2 | undefined {
  const byKey = new Map(alternate.evidenceBlocks.map(block => [citationKey(block), block]));
  const blocks = primary.evidenceBlocks.map(block => byKey.get(citationKey(block)));
  if (!blocks.length || blocks.some(block => !block)) return undefined;
  const aligned = {
    ...alternate,
    generatedAt: primary.generatedAt,
    contextConfidence: primary.contextConfidence,
    evidenceBlocks: blocks as ExternalIntelligenceV2["evidenceBlocks"],
  };
  delete (aligned as { translation?: unknown }).translation;
  return primary.sourceCoverage === "partial"
    ? limitedEvidence(aligned, aligned.evidenceBlocks, language)
    : { ...aligned, sourceCoverage: primary.sourceCoverage };
}

/**
 * Topic groups for parallel searches (owner decision 2026-10-14). Narrow
 * searches reach the right official pages faster than one broad search.
 * Overseas relocation always researches visa/residency on its own.
 */
export function v2EvidenceGroups(request: V2EvidenceRequest): string[][] {
  const areas = [...v2EvidenceAreas(request)];
  if (areas.length <= 1) return [areas];
  if (request.caseType === "Overseas Relocation" && areas.includes("visaMobility")) {
    const rest = areas.filter(area => area !== "visaMobility");
    return [["visaMobility"], ...chunk(rest, 2)].slice(0, 4);
  }
  return chunk(areas, 2).slice(0, 4);
}
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const confidenceRank = { low: 0, medium: 1, high: 2 } as const;
/** Fit joined sentences within a limit without cutting a sentence. */
function fitSentences(parts: string[], max: number): string {
  let out = "";
  for (const part of parts) {
    const next = out ? `${out} ${part}` : part;
    if (v2TextLength(next) > max) break;
    out = next;
  }
  return out || parts[0];
}

function mergeSummaries(lives: ExternalIntelligenceV2[], language: "en" | "ko", base: ExternalIntelligenceV2): ExternalIntelligenceV2 {
  const pick = (key: "opportunitySignals" | "frictionSignals" | "uncertainties", max: number) => {
    const rows: string[] = [];
    for (let i = 0; rows.length < max && lives.some(live => live[key][i]); i++)
      for (const live of lives) if (live[key][i] && rows.length < max && !rows.includes(live[key][i])) rows.push(live[key][i]);
    return rows;
  };
  const merged: ExternalIntelligenceV2 = {
    ...base,
    evidenceBlocks: [],
    opportunitySignals: pick("opportunitySignals", limit.opportunitySignals),
    frictionSignals: pick("frictionSignals", limit.frictionSignals),
    uncertainties: pick("uncertainties", limit.uncertainties),
    implication: fitSentences(lives.map(live => live.implication), limit.implication),
  };
  // Every (topic, area) keeps its first card before any topic adds more, so
  // neither a later topic nor one area of a two-area topic is pushed out by
  // the cap and then shown as "no evidence" (issues B4, audit M3).
  const seen = new Set<string>();
  const add = (block: ExternalIntelligenceV2["evidenceBlocks"][number]) => {
    const key = citationKey(block);
    if (seen.has(key) || merged.evidenceBlocks.length >= limit.mergedBlocks) return;
    seen.add(key);
    merged.evidenceBlocks.push(block);
  };
  for (const live of lives) {
    const areas = new Set<string>();
    for (const block of live.evidenceBlocks) {
      const area = block.area ?? block.dimension;
      if (areas.has(area)) continue;
      areas.add(area);
      add(block);
    }
  }
  // Then fill round-robin so no single topic takes most of the remaining slots.
  const depth = Math.max(0, ...lives.map(live => live.evidenceBlocks.length));
  for (let i = 0; i < depth; i++) for (const live of lives) if (live.evidenceBlocks[i]) add(live.evidenceBlocks[i]);
  // Keep topic order for reading: group cards by their source topic.
  const order = new Map(lives.flatMap((live, t) => live.evidenceBlocks.map((b, i) => [citationKey(b), t * 100 + i] as const)));
  merged.evidenceBlocks.sort((a, b) => (order.get(citationKey(a)) ?? 0) - (order.get(citationKey(b)) ?? 0));
  return lives.some(live => live.sourceCoverage === "partial")
    ? limitedEvidence(merged, merged.evidenceBlocks, language)
    : merged;
}

/**
 * Combine topic results into one snapshot; the translation is merged the same way.
 *
 * Owner rule (2026-10-15, audit H1/H2/M9): market evidence reaches the engine
 * (sourceCoverage "complete" + contextConfidence) only when every requested
 * research area has at least one confirmed card. A topic that lost a single
 * card still counts (its provider confidence is kept as topicConfidence); a
 * missing or still-loading topic leaves the snapshot "partial", so the
 * reading does not move on part of the evidence.
 */
export function mergeV2Evidence(lives: ExternalIntelligenceV2[], request: V2EvidenceRequest): ExternalIntelligenceV2 {
  const known = lives.map(topicConfidenceOf).filter((c): c is "low" | "medium" | "high" => !!c);
  const contextConfidence = known.length
    ? known.reduce((a, b) => (confidenceRank[a] <= confidenceRank[b] ? a : b))
    : undefined;
  let primary: ExternalIntelligenceV2;
  const other = request.language === "ko" ? "en" : "ko";
  if (lives.length === 1) {
    primary = { ...lives[0], ...(lives[0].translation ? { translation: { ...lives[0].translation } } : {}) };
  } else {
    const base = { ...lives[0], contextConfidence, sourceCoverage: undefined, translation: undefined };
    primary = mergeSummaries(lives, request.language, base);
    if (lives.every(live => live.translation)) {
      const translations = lives.map(live => live.translation!);
      const translated = mergeSummaries(translations, other, { ...translations[0], contextConfidence, sourceCoverage: undefined, translation: undefined });
      const aligned = alignTranslation(primary, translated, other);
      if (aligned) primary.translation = aligned;
    }
  }
  const expected = v2EvidenceAreas(request);
  const covered = new Set(primary.evidenceBlocks.map(block => block.area).filter(Boolean));
  // Unset coverage = sources not probed yet (server merges before its link check, which then
  // downgrades to partial if any source fails). The browser only merges checked results.
  const usable = lives.every(live => live.sourceCoverage === undefined || live.sourceCoverage === "complete" || (live.sourceCoverage === "partial" && live.evidenceBlocks.length > 0));
  const complete = !!contextConfidence && usable && expected.length > 0 && expected.every(area => covered.has(area));
  const settle = (snapshot: ExternalIntelligenceV2) => {
    delete (snapshot as Confidence).topicConfidence;
    if (complete) {
      snapshot.sourceCoverage = "complete";
      snapshot.contextConfidence = contextConfidence;
    } else {
      snapshot.sourceCoverage = "partial";
      delete snapshot.contextConfidence;
      if (contextConfidence) (snapshot as Confidence).topicConfidence = contextConfidence;
    }
  };
  settle(primary);
  if (primary.translation) settle(primary.translation);
  else delete primary.translation;
  return primary;
}
