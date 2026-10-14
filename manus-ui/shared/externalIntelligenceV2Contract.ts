/** Transport/presentation limits only. These are not AMC evaluation thresholds. */
export const v2EvidenceLimits = {
  dimension: 80,
  headline: 180,
  fact: 600,
  whyItMatters: 500,
  sourceUrl: 2048,
  signal: 240,
  implication: 600,
  blocks: 6,
  /** Cards kept after merging topic searches (each search still ≤ blocks). */
  mergedBlocks: 10,
  opportunitySignals: 2,
  frictionSignals: 2,
  uncertainties: 3,
} as const;

/** JSON Schema maxLength counts Unicode code points, not UTF-16 code units. */
export function v2TextLength(value: string): number {
  return Array.from(value).length;
}

export function v2BoundedText(value: unknown, max: number): value is string {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    v2TextLength(value) <= max;
}
