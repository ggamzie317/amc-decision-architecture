import type { ExternalIntelligenceV2 } from "./externalIntelligenceV2";
import { withKoreanParticle } from "./koreanParticle";
import type { V2Language } from "./v2Language";

/**
 * A page may ground several dimensions. Mark every later card from the same
 * page so it is never read as independent corroboration.
 */
export function v2SharedSourceNote(
  blocks: ExternalIntelligenceV2["evidenceBlocks"],
  index: number,
  language: V2Language
): string | null {
  const url = blocks[index]?.sourceUrl;
  if (!url) return null;
  const first = blocks.findIndex(block => block.sourceUrl === url);
  if (first < 0 || first === index) return null;
  return language === "ko"
    ? `${withKoreanParticle(`근거 ${first + 1}`, "과/와")} 같은 출처`
    : `same source as evidence ${first + 1}`;
}
