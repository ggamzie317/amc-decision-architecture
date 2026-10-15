import type { ExternalIntelligenceV2 } from "./externalIntelligenceV2";
import type { V2State } from "./amcV2Model";
import { allowedV2ExternalAreas } from "../../../shared/externalIntelligenceV2Request";
import { v2t, type V2CopyKey } from "./v2Language";

export type EvidenceComparisonStatus = "unreviewed" | "matches" | "gap" | "not_applicable";
export type EvidenceComparison = { status: EvidenceComparisonStatus; detail: string };
/** Private tab-memory comparison records, never provider inputs or score fields. */
export type EvidenceComparisons = Record<string, EvidenceComparison>;
type Block = ExternalIntelligenceV2["evidenceBlocks"][number];

/** Language-independent identity: the cited source plus the controlled area ID
 * (dimension labels and fact wording differ by language; area IDs do not), so a
 * saved comparison survives a language toggle. The language parameter is kept
 * for caller compatibility only. */
export function v2ComparisonKey(block: Block, _language?: V2State["language"]): string {
  return JSON.stringify([block.sourceUrl ?? "demo", block.area ?? block.dimension]);
}
export function v2ComparisonLabel(status: EvidenceComparisonStatus, ko: boolean): string {
  const labels: Record<EvidenceComparisonStatus, [string, string]> = {
    unreviewed: ["자동 비교 사용", "Use the automatic comparison"],
    matches: ["내 근거와 부합함", "My evidence matches"],
    gap: ["부족한 조건이 있음", "A gap remains"],
    not_applicable: ["내 목표에 적용되지 않음", "Not applicable to my target"],
  };
  return labels[status][ko ? 0 : 1];
}
/** Controlled research IDs, with exact EN/KO label compatibility for old snapshots.
 * This routes narrative context only; it does not classify prose or score fit. */
export function v2EvidenceArea(block: Block, state: V2State): string | null {
  const allowed = allowedV2ExternalAreas(state.caseType);
  if (block.area) return allowed.includes(block.area) ? block.area : null;
  return allowed.find(area => [v2t("en", area as V2CopyKey), v2t("ko", area as V2CopyKey)]
    .includes(block.dimension)) ?? null;
}
export function v2ConditionGroup(area: string | null): "finance" | "capacity" | "readiness" | "public" {
  // Geography research returns living costs and rent, so it is read against money (audit M6).
  if (["compensation", "pricing", "funding", "opportunityCost", "geography"].includes(area ?? "")) return "finance";
  if (["visaMobility", "geographyMobility"].includes(area ?? "")) return "capacity";
  if (["requiredSkills", "programOutcomes", "employmentRelevance", "researchRelevance"].includes(area ?? "")) return "readiness";
  return "public";
}

/**
 * Automatic first pass for a card the customer has not compared yet: the
 * evidence direction read against the customer's own band for the matching
 * condition. Descriptive only — it never scores, stores or replaces a
 * customer comparison.
 */
export type V2AutoComparison = "watch" | "fits" | "conditional" | "open" | "context";
const favourable: Record<string, number> = { strong: 2, developing: 1, weak: 0, low: 2, moderate: 1, high: 0, light: 2, material: 1, heavy: 0 };
export const v2GroupAxis = {
  finance: "safetyMargin", capacity: "constraintLoad", readiness: "internalReadiness", public: "internalReadiness",
} as const;
export function v2AutoComparison(direction: string, band: string, group?: string): V2AutoComparison {
  // A market statistic (demand, industry direction, competition) is context, never a
  // reading of the person's own readiness (audit M6).
  if (group === "public") return "context";
  const v = favourable[band];
  if (v === undefined) return "open";
  if (direction === "caution" && v <= 1) return "watch";
  if (direction === "supportive" && v === 2) return "fits";
  return "conditional";
}
const autoWords: Record<V2AutoComparison, [string, string]> = {
  watch: ["주의", "Watch"],
  fits: ["부합 가능", "Likely fits"],
  conditional: ["조건부", "Conditional"],
  open: ["내 조건을 입력하면 판단", "Needs your condition"],
  context: ["시장 참고 자료", "Market context"],
};
export function v2AutoComparisonWord(kind: V2AutoComparison, ko: boolean): string {
  return autoWords[kind][ko ? 0 : 1];
}
/** "자동 비교: 주의 — 내 실행 준비도 일부 갖춤" — the reading and the condition it used. */
export function v2AutoComparisonLabel(kind: V2AutoComparison, conditionLabel: string, bandLabel: string, ko: boolean): string {
  const word = v2AutoComparisonWord(kind, ko);
  if (kind === "open") return ko ? `자동 비교: ${word}` : `Automatic comparison: ${word}`;
  if (kind === "context") return ko ? `${word} · 내 조건과 직접 비교하지 않음` : `${word} · not compared with your own conditions`;
  return ko ? `자동 비교: ${word} — 내 ${conditionLabel} ${bandLabel}` : `Automatic comparison: ${word} — your ${conditionLabel}: ${bandLabel}`;
}
