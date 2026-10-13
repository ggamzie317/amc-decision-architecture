import type { V2CaseType } from "./amcV2Model";
import type { V2Language } from "./v2Language";

/**
 * Infers the decision type from all three setup sentences instead of asking the
 * customer to classify their own decision. Keyword cues are weighted; the
 * customer sees the recommendation, why it was made, and the close alternatives.
 */
type Cue = { pattern: RegExp; weight: number; label: string };
const cues: Record<V2CaseType, Cue[]> = {
  "Overseas Relocation": [
    { pattern: /해외|이민|이주|영주권|시민권|비자|취업\s?비자|워킹\s?홀리데이|relocat|overseas|abroad|emigrat|immigra|visa|permanent residen|green card/i, weight: 3, label: "relocation" },
    { pattern: /홍콩|싱가포르|미국|캐나다|호주|뉴질랜드|일본|중국|베트남|독일|영국|프랑스|네덜란드|두바이|아랍에미리트|hong kong|singapore|united states|\busa?\b|canada|australia|new zealand|japan|china|vietnam|germany|united kingdom|\buk\b|london|dubai|netherlands/i, weight: 2, label: "destination" },
  ],
  "MBA / EMBA / PhD Decision": [
    { pattern: /\b(e?mba|phd|ph\.d|master'?s|doctorate)\b|박사|석사|대학원|학위|유학/i, weight: 4, label: "degree" },
  ],
  Entrepreneurship: [
    { pattern: /창업|스타트업|사업을|개인\s?사업|법인\s?설립|프리랜서|startup|start-up|my own business|found(?:er|ing)|entrepreneur|freelanc/i, weight: 4, label: "venture" },
  ],
  "Burnout-driven Decision": [
    { pattern: /번아웃|소진|탈진|휴직|쉬고|지쳐|건강|burn-?out|exhaust|sabbatical|time off/i, weight: 4, label: "burnout" },
  ],
  "Family Constraint-heavy Decision": [
    { pattern: /육아|출산|돌봄|간병|부모님|아이|자녀|배우자|가족\s?(?:사정|돌봄|때문)|childcare|caregiv|parent|spouse|kids?\b|family (?:care|needs|reasons)/i, weight: 3, label: "family" },
    { pattern: /가족|family/i, weight: 1, label: "family" },
  ],
  "Role Upgrade / Downgrade": [
    { pattern: /승진|직급|팀장|임원|관리자|리더\s?역할|강등|promotion|promot|manager role|leadership role|demot|step down/i, weight: 4, label: "role" },
  ],
  "Industry Transition": [
    { pattern: /업종|산업|분야를?\s?바|직무\s?전환|커리어\s?전환|다른\s?분야|industry|sector|career (?:change|switch|pivot)/i, weight: 3, label: "industry" },
    { pattern: /이직|채용|job (?:search|offer)|new job/i, weight: 1, label: "job move" },
  ],
  "Corporate Stay vs Exit": [
    { pattern: /퇴사|잔류|그만두|남을지|떠날지|stay or (?:leave|go)|quit|resign|leave (?:my|the) (?:job|company)/i, weight: 3, label: "stay or exit" },
  ],
  "General Career Reconfiguration": [],
};

export type V2CaseRanking = { caseType: V2CaseType; score: number; matched: string[] }[];

export function inferV2CaseRanking(text: { decision: string; optionA: string; optionB: string }): V2CaseRanking {
  // Option B usually names the path being considered, so it counts double.
  const sources = [text.decision, text.optionA, text.optionB, text.optionB].join(" \n ");
  const ranking = (Object.keys(cues) as V2CaseType[]).map(caseType => {
    let score = 0;
    const matched: string[] = [];
    for (const cue of cues[caseType]) {
      const hits = sources.match(new RegExp(cue.pattern.source, `${cue.pattern.flags.replace("g", "")}g`)) ?? [];
      if (hits.length) {
        score += cue.weight * Math.min(hits.length, 3);
        for (const hit of hits) if (!matched.includes(hit.trim())) matched.push(hit.trim());
      }
    }
    return { caseType, score, matched: matched.slice(0, 4) };
  });
  ranking.sort((a, b) => b.score - a.score);
  if (!ranking[0].score)
    return [{ caseType: "General Career Reconfiguration", score: 0, matched: [] }, ...ranking.filter(r => r.caseType !== "General Career Reconfiguration")];
  return ranking;
}

export function inferV2CaseType(text: { decision: string; optionA: string; optionB: string }): V2CaseType {
  return inferV2CaseRanking(text)[0].caseType;
}

/** Plain-language description so the customer can confirm the type. */
export const v2CaseDescriptions: Record<V2CaseType, readonly [en: string, ko: string]> = {
  "Corporate Stay vs Exit": ["Staying in your current organization versus leaving it", "지금 회사에 남을지, 떠날지를 고민하는 경우"],
  "Industry Transition": ["Moving into a different industry or type of role", "다른 산업이나 다른 종류의 직무로 옮기려는 경우"],
  "Role Upgrade / Downgrade": ["Taking on a bigger or smaller role, such as a promotion or stepping back", "승진·리더 역할처럼 역할을 키우거나 줄이는 경우"],
  Entrepreneurship: ["Starting your own venture or going independent", "창업하거나 독립해서 일하려는 경우"],
  "MBA / EMBA / PhD Decision": ["Whether to pursue a degree such as an MBA, EMBA or PhD", "MBA·EMBA·박사 같은 학위 과정을 고민하는 경우"],
  "Overseas Relocation": ["Moving to another country for work, residency or family", "다른 나라로 옮겨 일하거나 체류·정착하려는 경우"],
  "Burnout-driven Decision": ["A decision driven by exhaustion or the need to recover", "지치거나 회복이 필요해서 변화를 고민하는 경우"],
  "Family Constraint-heavy Decision": ["A decision shaped mainly by family care or schedules", "육아·돌봄·가족 일정이 결정에 가장 크게 작용하는 경우"],
  "General Career Reconfiguration": ["A broader rethink of your career direction", "위에 딱 맞지 않는 넓은 범위의 커리어 재설계"],
};
export const v2CaseDescription = (language: V2Language, caseType: V2CaseType) =>
  v2CaseDescriptions[caseType][language === "ko" ? 1 : 0];

const places: [RegExp, string, string][] = [
  [/홍콩|hong kong/i, "Hong Kong", "홍콩"],
  [/싱가포르|singapore/i, "Singapore", "싱가포르"],
  [/미국|united states|\busa\b|\bus\b/i, "United States", "미국"],
  [/캐나다|canada/i, "Canada", "캐나다"],
  [/호주|australia/i, "Australia", "호주"],
  [/뉴질랜드|new zealand/i, "New Zealand", "뉴질랜드"],
  [/일본|japan|도쿄|tokyo/i, "Japan", "일본"],
  [/중국|china|상하이|shanghai|베이징|beijing/i, "China", "중국"],
  [/베트남|vietnam/i, "Vietnam", "베트남"],
  [/독일|germany|베를린|berlin/i, "Germany", "독일"],
  [/영국|united kingdom|\buk\b|런던|london/i, "United Kingdom", "영국"],
  [/프랑스|france|파리|paris/i, "France", "프랑스"],
  [/네덜란드|netherlands/i, "Netherlands", "네덜란드"],
  [/두바이|dubai|아랍에미리트|uae/i, "United Arab Emirates", "아랍에미리트"],
  [/서울|seoul/i, "Seoul", "서울"],
  [/부산|busan/i, "Busan", "부산"],
  [/판교|pangyo/i, "Pangyo, Korea", "판교"],
  [/한국|korea/i, "South Korea", "한국"],
];

/**
 * Geography for public search: the place named in option B first (the path
 * being explored), then the decision sentence, then the current base.
 */
export function inferV2Geography(text: { decision: string; optionA: string; optionB: string }, language: V2Language): string {
  for (const source of [text.optionB, text.decision, text.optionA]) {
    for (const [pattern, en, ko] of places) if (pattern.test(source)) return language === "ko" ? ko : en;
  }
  return "";
}

/** The path being explored is the public target; customer can edit before search. */
export function inferV2SearchTarget(text: { decision: string; optionB: string }): string {
  const source = text.optionB.trim() || text.decision.trim();
  return source.replace(/[\r\n]+/g, " ").slice(0, 120);
}
