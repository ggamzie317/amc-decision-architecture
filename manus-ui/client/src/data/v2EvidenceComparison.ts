import type { ExternalIntelligenceV2 } from "./externalIntelligenceV2";
import type { V2State } from "./amcV2Model";
import { allowedV2ExternalAreas } from "../../../shared/externalIntelligenceV2Request";
import { v2t, type V2CopyKey } from "./v2Language";

export type EvidenceComparisonStatus = "unreviewed" | "matches" | "gap" | "not_applicable";
export type EvidenceComparison = { status: EvidenceComparisonStatus; detail: string };
/** Private tab-memory comparison records, never provider inputs or score fields. */
export type EvidenceComparisons = Record<string, EvidenceComparison>;
type Block = ExternalIntelligenceV2["evidenceBlocks"][number];

/** A changed claim or language cannot silently reuse an earlier comparison. */
export function v2ComparisonKey(block: Block, language: V2State["language"]): string {
  return JSON.stringify([language, block.sourceUrl ?? "demo", block.dimension, block.fact]);
}
export function v2ComparisonLabel(status: EvidenceComparisonStatus, ko: boolean): string {
  const labels: Record<EvidenceComparisonStatus, [string, string]> = {
    unreviewed: ["아직 대조하지 않음", "Not compared yet"],
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
  if (["compensation", "pricing", "funding", "opportunityCost"].includes(area ?? "")) return "finance";
  if (["geography", "visaMobility", "geographyMobility"].includes(area ?? "")) return "capacity";
  if (["requiredSkills", "programOutcomes", "employmentRelevance", "researchRelevance"].includes(area ?? "")) return "readiness";
  return "public";
}
