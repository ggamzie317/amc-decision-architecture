import type { ProductApplicationV3 } from "./amcProductApplicationV3";
import type { ExternalIntelligenceV2 } from "./externalIntelligenceV2";
import type { V2Language } from "./v2Language";

/**
 * Reading layer (competitor benchmark, 2026-10-15). It explains the existing
 * allofmycareer outputs more precisely; it never adds a score, a probability
 * or a new framework element. Pairs are stored [Korean, English].
 *
 * - CareerExplorer: each framework name keeps its name and gains the plain
 *   question it answers.
 * - Lightcast: every public fact states what kind of source it is and what
 *   it was not used to decide.
 * - Hogan / Safety Margin: what the current room can absorb and which shocks
 *   it is exposed to, kept apart from how certain the evidence is.
 * - Switching: which part of the reading must be re-checked when a condition
 *   changes.
 */
type Pair = readonly [ko: string, en: string];
const pick = (pair: Pair, language: V2Language) => pair[language === "ko" ? 0 : 1];

export type V2FrameworkPart = "posture" | "missing" | "safety" | "changing" | "switching" | "experiment" | "fifwm";
const plain: Record<V2FrameworkPart, Pair> = {
  posture: ["지금 조건에서는 어느 쪽이 더 뒷받침되나요?", "Under your current conditions, which direction is better supported?"],
  missing: ["아직 모르지만, 알게 되면 판단이 달라질 수 있는 것은 무엇인가요?", "What is still unknown that could change the reading once known?"],
  safety: ["예상과 다르게 흘러가도 계속할 여유가 얼마나 있나요?", "How much room is left to keep going if things go differently than planned?"],
  changing: ["지금 가진 것을 다르게 조합하면 어떤 선택지가 생기나요?", "What options appear if you recombine what you already have?"],
  switching: ["어떤 사실이 바뀌면 판단을 다시 해야 하나요?", "Which facts, if they change, call for a new reading?"],
  experiment: ["다음 30일 동안 무엇을 확인해 불확실성을 줄일까요?", "What will you check in the next 30 days to reduce uncertainty?"],
  fifwm: ["기회, 연결, 구조, 실행, 지속 가능성 다섯 요소가 어디서 부딪히나요?", "Where do the five factors — opportunity, connection, structure, execution, staying power — pull against each other?"],
};
export function v2PlainQuestion(part: V2FrameworkPart, language: V2Language): string {
  return pick(plain[part], language);
}

/** What each chart answers, so no chart is decoration. */
const chartQuestions = {
  radar: ["‘전환’ 판단에 필요한 수준과 비교하면, 내 조건은 어디가 부족한가요?", "Compared with the level needed for a move, where do your conditions fall short?"],
  pentagon: ["다섯 가지 관점 중 어디가 약하고, 어디가 튼튼한가요?", "Which of the five lenses are weak, and which are solid?"],
  versus: ["공개 자료와 내 조건은 어디서 맞고, 어디서 어긋나나요?", "Where do public sources match your conditions, and where do they not?"],
  path: ["무엇을 갖추면 다음 단계로 갈 수 있나요?", "What do you need in place to take the next step?"],
  indicators: ["무엇이 확인되었고, 무엇이 아직 확인되지 않았나요?", "What is confirmed so far, and what is not?"],
} as const satisfies Record<string, Pair>;
export function v2ChartQuestion(chart: keyof typeof chartQuestions, language: V2Language): string {
  return pick(chartQuestions[chart], language);
}

type Block = ExternalIntelligenceV2["evidenceBlocks"][number];
export type V2EvidenceNature = "official" | "statistics" | "institution" | "listing" | "other";
const natureLabel: Record<V2EvidenceNature, Pair> = {
  official: ["정부·규제기관 공식 안내", "Official government or regulator guidance"],
  statistics: ["공식 통계", "Official statistics"],
  institution: ["기관·학교 공식 자료", "Institution's own published material"],
  listing: ["채용 공고·목록 예시", "Job listing or directory example"],
  other: ["기타 공개 자료", "Other public source"],
};
/** Kind of source, from its address only (never from customer text). */
export function v2EvidenceNature(block: Pick<Block, "sourceUrl">): V2EvidenceNature {
  const url = (block.sourceUrl ?? "").toLowerCase();
  // Official domains first: career.go.kr/job/... is a public career guide, not a job listing.
  if (/stat|\.xlsx|\.csv|census|kosis|data\.gov/.test(url)) return "statistics";
  if (/\.gov(\.|\/|$)|\.go\.kr|gov\.(sg|uk|hk|au)|\.gc\.ca|europa\.eu|immi|mom\.gov|uscis/.test(url)) return "official";
  if (/linkedin|indeed|glassdoor|\/\/jobs\.|\/jobs\/|\/careers?\/job|saramin|jobkorea|wanted\.co/.test(url)) return "listing";
  if (/\.edu(\.|\/|$)|\.ac\.(kr|uk|jp|nz)|university|univ|\.or\.kr|\.org(\/|$)/.test(url)) return "institution";
  return "other";
}
export function v2EvidenceNatureLabel(nature: V2EvidenceNature, language: V2Language): string {
  return pick(natureLabel[nature], language);
}

/** What a fact in this area was NOT used to decide (Lightcast: demand ≠ your hiring odds). */
const limits: Record<string, Pair> = {
  compensation: ["평균이나 중앙값을 보여 주는 자료입니다. 내 예상 보수로 쓰지 않았습니다.", "Shows an average or median; not used as your expected pay."],
  hiringDemand: ["시장 전체의 수요를 보여 주는 자료입니다. 내 채용 가능성으로 쓰지 않았습니다.", "Shows market-wide demand; not used as your chance of being hired."],
  roleDemand: ["직무 전체의 수요를 보여 주는 자료입니다. 내 채용 가능성으로 쓰지 않았습니다.", "Shows demand for the role overall; not used as your chance of being hired."],
  requiredSkills: ["공고에 자주 나오는 요건을 보여 줍니다. 내게 그 역량이 없다는 뜻으로 쓰지 않았습니다.", "Shows requirements common in listings; not used to conclude you lack them."],
  industryDirection: ["산업이 어디로 가는지 보여 줍니다. 내 경로가 잘될지 판단하는 데 쓰지 않았습니다.", "Shows where the industry is heading; not used to judge whether your path will work."],
  geography: ["평균 비용을 보여 줍니다. 내 가구의 실제 비용은 따로 계산하세요.", "Shows average costs; work out your household's actual costs separately."],
  visaMobility: ["공식 요건을 보여 줍니다. 내가 자격을 갖췄는지는 판단하지 않았습니다.", "Shows the official requirements; your eligibility was not assessed."],
  geographyMobility: ["공식 요건과 비용을 보여 줍니다. 내가 자격을 갖췄는지는 판단하지 않았습니다.", "Shows the official requirements and costs; your eligibility was not assessed."],
  programOutcomes: ["과정 전체의 성과를 보여 줍니다. 내 결과로 쓰지 않았습니다.", "Shows program-wide outcomes; not used as your result."],
  employmentRelevance: ["과정과 직무의 연결을 보여 줍니다. 내 취업 결과로 쓰지 않았습니다.", "Shows how the program links to roles; not used as your employment result."],
  researchRelevance: ["연구 분야 정보를 보여 줍니다. 내 연구와 맞는지 판단하는 데 쓰지 않았습니다.", "Shows information about the field; not used to judge your research fit."],
  funding: ["제도가 있다는 것을 보여 줍니다. 내가 선정될지는 판단하지 않았습니다.", "Shows that a program exists; whether you would be selected was not assessed."],
  opportunityCost: ["공시된 비용을 보여 줍니다. 내 소득 공백은 따로 계산하세요.", "Shows published costs; work out your income gap separately."],
  customerDemand: ["관심도나 시장 규모를 보여 줍니다. 실제로 돈을 낼 수요가 있다는 뜻으로 쓰지 않았습니다.", "Shows interest or market size; not treated as proof that people will pay."],
  competition: ["경쟁 현황을 보여 줍니다. 내 제안이 얼마나 다른지는 판단하지 않았습니다.", "Shows the competitive landscape; how your offer differs was not assessed."],
  pricing: ["공개된 가격 예시를 보여 줍니다. 내 고객이 그만큼 낼 것이라는 뜻으로 쓰지 않았습니다.", "Shows published price examples; not used as what your customers would pay."],
  marketGrowth: ["시장의 성장을 보여 줍니다. 내 사업의 성장으로 쓰지 않았습니다.", "Shows market growth; not used as your business's growth."],
  distribution: ["유통 경로를 보여 줍니다. 내가 그 경로를 쓸 수 있는지는 판단하지 않았습니다.", "Shows sales channels; whether you can use them was not assessed."],
  barriers: ["진입 요건을 보여 줍니다. 내가 충족하는지는 판단하지 않았습니다.", "Shows entry requirements; whether you meet them was not assessed."],
  regulation: ["규제 요건을 보여 줍니다. 내가 충족하는지는 판단하지 않았습니다.", "Shows regulatory requirements; whether you meet them was not assessed."],
};
const genericLimit: Pair = ["공개 자료입니다. 이것만으로 나와 맞는지 판단하지 않았습니다.", "A public source; not used on its own to judge whether it fits you."];
export function v2EvidenceLimit(area: string | null | undefined, language: V2Language): string {
  return pick((area && limits[area]) || genericLimit, language);
}

/**
 * Safety Margin as "what it can absorb / what it is exposed to", from the
 * customer's own levels. Evidence certainty is reported separately.
 */
export function v2SafetyProfile(
  bands: { financialRoom?: string; reversibility?: string; downsideExposure?: string; constraintLoad?: string },
  language: V2Language,
) {
  const ko = language === "ko";
  const absorbs: string[] = [];
  const exposed: string[] = [];
  const add = (list: string[], k: string, e: string) => list.push(ko ? k : e);
  if (bands.financialRoom === "strong") add(absorbs, "6개월 이상의 소득 공백", "An income gap of six months or more");
  if (bands.financialRoom === "developing") add(absorbs, "3~6개월의 소득 공백", "An income gap of three to six months");
  if (bands.reversibility === "strong") add(absorbs, "잘 안 되면 원래 자리로 돌아가기", "Returning to your current role if it does not work");
  if (bands.downsideExposure === "low") add(absorbs, "작은 비용 손실", "A small financial loss");
  if (bands.constraintLoad === "light") add(absorbs, "일정이 예상보다 늘어나는 것", "A schedule that runs longer than planned");
  if (bands.financialRoom === "weak" || bands.financialRoom === "developing") add(exposed, "준비 기간이 예상보다 길어지는 경우", "Preparation taking longer than planned");
  if (bands.reversibility === "weak") add(exposed, "돌아갈 길이 없는 상태에서의 실패", "Failure with no way back");
  if (bands.downsideExposure === "high") add(exposed, "되돌리기 어려운 지출·퇴사를 먼저 하는 경우", "Committing irreversible spending or resignation first");
  if (bands.constraintLoad === "heavy") add(exposed, "본업·가족 일정이 한꺼번에 몰리는 시기", "Periods when work and family demands peak together");
  const unknown = (["financialRoom", "reversibility", "downsideExposure", "constraintLoad"] as const)
    .filter(key => !bands[key] || bands[key] === "unknown");
  return { absorbs, exposed, unknownCount: unknown.length };
}

/** Which part of the reading to re-check when an engine variable changes. */
const recheck: Record<string, Pair> = {
  externalValidation: ["현재 판단과 공개 자료 비교", "The current reading and the evidence comparison"],
  internalReadiness: ["실행 준비도와 경로 조정", "Readiness and the path adjustment"],
  financialRoom: ["안전 여유와 첫 단계의 규모", "Safety Margin and the size of the first step"],
  reversibility: ["안전 여유와 돌아올 길", "Safety Margin and the way back"],
  downsideExposure: ["손실 위험과 되돌릴 수 없는 결정의 순서", "Downside risk and the order of irreversible decisions"],
  optionBSupport: ["실행 계획과 지원 역할", "The execution plan and support roles"],
  constraintLoad: ["일정과 첫 단계의 규모", "Schedule and the size of the first step"],
};
export function v2RecheckPart(variable: string | undefined, language: V2Language): string {
  return pick((variable && recheck[variable]) || ["판단 전체", "The whole reading"], language);
}

/** Posture support and limits from the same baseline as the map (no new scoring). */
export function v2PostureBasisSplit(core: ProductApplicationV3, labels: Record<string, string>) {
  const level: Record<string, number> = { strong: 2, developing: 1, weak: 0, low: 2, moderate: 1, high: 0, light: 2, material: 1, heavy: 0 };
  const reference: Record<string, number> = {
    externalValidation: 2, internalReadiness: 2, safetyMargin: 1, reversibility: 1, optionBSupport: 1, structuralRisk: 1, constraintLoad: 1,
  };
  const supports: string[] = [], limits: string[] = [], unknown: string[] = [];
  for (const [key, signal] of Object.entries(core.postureBasis)) {
    if (!(key in reference) || !labels[key]) continue;
    const v = level[signal.band];
    if (v === undefined) unknown.push(labels[key]);
    else if (v >= reference[key]) supports.push(labels[key]);
    else limits.push(labels[key]);
  }
  return { supports, limits, unknown };
}

/** Reference period of a fact (Lightcast: every figure states its date), or that the page states none. */
export function v2EvidencePeriod(block: Pick<Block, "period" | "sourceDate">, language: V2Language): string {
  const ko = language === "ko";
  const value = block.period?.trim() || block.sourceDate;
  return value ? (ko ? `기준: ${value}` : `As of: ${value}`) : ko ? "기준 시점 표시 없음" : "No reference date stated";
}
