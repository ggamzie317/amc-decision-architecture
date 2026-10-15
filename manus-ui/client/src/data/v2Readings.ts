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
  posture: ["지금 조건에서 가장 설명력 있는 움직임은 무엇인가", "Which move does the current structure explain best?"],
  missing: ["아직 모르는데, 알게 되면 판단이 달라질 수 있는 것은 무엇인가", "What is still unknown that could change the reading once known?"],
  safety: ["예상과 다르게 흘러가도 선택을 이어갈 여지가 얼마나 남아 있는가", "How much room is left to keep going if things go differently than planned?"],
  changing: ["지금 가진 자산을 다르게 조합하면 어떤 선택지가 생기는가", "What options appear if you recombine what you already have?"],
  switching: ["어떤 사실이 바뀌면 판단을 다시 해야 하는가", "Which facts, if they change, call for a new reading?"],
  experiment: ["다음 30일 동안 어떤 불확실성을 줄일 것인가", "Which uncertainty will the next 30 days reduce?"],
  fifwm: ["기회·연결·구조·실행·지속, 다섯 요소가 서로 어디서 부딪히는가", "Where do the five factors — opportunity, connection, structure, execution, staying power — pull against each other?"],
};
export function v2PlainQuestion(part: V2FrameworkPart, language: V2Language): string {
  return pick(plain[part], language);
}

/** What each chart answers, so no chart is decoration. */
const chartQuestions = {
  radar: ["내 조건은 '전환' 기준선과 비교해 어디서 부족한가?", "Where do your conditions fall short of the transition baseline?"],
  pentagon: ["다섯 구조 요소 중 어디가 약하고 어디가 버티는가?", "Which of the five factors are weak and which hold?"],
  versus: ["공개 근거가 내 조건과 어디서 맞고 어디서 부딪히는가?", "Where does public evidence fit or clash with your conditions?"],
  path: ["어떤 조건이 갖춰지면 다음 단계로 이동할 수 있는가?", "Under which conditions can you move to the next step?"],
  indicators: ["어디까지 확인되었고, 무엇이 아직 확인되지 않았는가?", "What is confirmed so far, and what is not?"],
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
  other: ["기타 공개 자료", "Other public material"],
};
/** Kind of source, from its address only (never from customer text). */
export function v2EvidenceNature(block: Pick<Block, "sourceUrl">): V2EvidenceNature {
  const url = (block.sourceUrl ?? "").toLowerCase();
  if (/stat|\.xlsx|\.csv|census|kosis|data\.gov/.test(url)) return "statistics";
  if (/linkedin|indeed|glassdoor|jobs?\.|\/jobs?\/|saramin|jobkorea|wanted\.co/.test(url)) return "listing";
  if (/\.gov(\.|\/|$)|\.go\.kr|gov\.(sg|uk|hk|au)|\.gc\.ca|europa\.eu|immi|mom\.gov|uscis/.test(url)) return "official";
  if (/\.edu(\.|\/|$)|\.ac\.(kr|uk|jp|nz)|university|univ|\.or\.kr|\.org(\/|$)/.test(url)) return "institution";
  return "other";
}
export function v2EvidenceNatureLabel(nature: V2EvidenceNature, language: V2Language): string {
  return pick(natureLabel[nature], language);
}

/** What a fact in this area was NOT used to decide (Lightcast: demand ≠ your hiring odds). */
const limits: Record<string, Pair> = {
  compensation: ["평균·중앙값 자료이며, 내 예상 보수로 쓰지 않았습니다.", "An average or median; not used as your expected pay."],
  hiringDemand: ["시장 수요 자료이며, 내 채용 가능성으로 쓰지 않았습니다.", "Market demand; not used as your chance of being hired."],
  roleDemand: ["직무 수요 자료이며, 내 채용 가능성으로 쓰지 않았습니다.", "Role demand; not used as your chance of being hired."],
  requiredSkills: ["공고에 자주 나오는 요건이며, 내게 그 역량이 없다는 판단으로 쓰지 않았습니다.", "Requirements common in listings; not used to conclude you lack them."],
  industryDirection: ["산업 방향 자료이며, 내 경로의 성공 여부로 쓰지 않았습니다.", "Industry direction; not used to judge your path's success."],
  geography: ["평균 비용 자료이며, 내 가구의 실제 비용은 따로 계산해야 합니다.", "Average costs; your household's actual costs need their own calculation."],
  visaMobility: ["공식 요건이며, 내 자격 충족 여부는 판단하지 않았습니다.", "Official requirements; your eligibility was not assessed."],
  geographyMobility: ["공식 요건·비용이며, 내 자격 충족 여부는 판단하지 않았습니다.", "Official requirements and costs; your eligibility was not assessed."],
  programOutcomes: ["과정 전체의 성과이며, 내 결과로 쓰지 않았습니다.", "Programme-wide outcomes; not used as your result."],
  employmentRelevance: ["과정과 직무의 연결 자료이며, 내 취업 결과로 쓰지 않았습니다.", "Links between programme and roles; not used as your employment result."],
  researchRelevance: ["연구 분야 자료이며, 내 연구 적합성으로 쓰지 않았습니다.", "Field information; not used as your research fit."],
  funding: ["제도가 있다는 자료이며, 내 선정 여부는 판단하지 않았습니다.", "Shows a programme exists; your selection was not assessed."],
  opportunityCost: ["공시된 비용이며, 내 소득 공백은 따로 계산해야 합니다.", "Published costs; your income gap needs its own calculation."],
  customerDemand: ["관심·시장 규모 자료이며, 유료 수요가 검증된 것으로 쓰지 않았습니다.", "Interest or market size; not treated as proven paid demand."],
  competition: ["경쟁 현황이며, 내 제안의 차별성은 판단하지 않았습니다.", "Competitive landscape; your offer's differentiation was not assessed."],
  pricing: ["공개 가격 예시이며, 내 고객의 지불 의사로 쓰지 않았습니다.", "Published price examples; not used as your customers' willingness to pay."],
  marketGrowth: ["시장 성장 자료이며, 내 사업의 성장으로 쓰지 않았습니다.", "Market growth; not used as your business's growth."],
  distribution: ["유통 경로 자료이며, 내가 그 경로에 접근할 수 있는지는 판단하지 않았습니다.", "Channel information; your access to it was not assessed."],
  barriers: ["진입 요건이며, 내 충족 여부는 판단하지 않았습니다.", "Entry requirements; whether you meet them was not assessed."],
  regulation: ["규제 요건이며, 내 충족 여부는 판단하지 않았습니다.", "Regulatory requirements; whether you meet them was not assessed."],
};
const genericLimit: Pair = ["공개 자료이며, 이것만으로 개인의 적합성을 판단하지 않았습니다.", "Public material; not used on its own to judge personal fit."];
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
  if (bands.reversibility === "strong") add(absorbs, "시험이 실패해도 원래 자리로 돌아가기", "Returning to your current role if the test fails");
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
  externalValidation: ["구조 판단과 공개 근거 대조", "The structural reading and the evidence comparison"],
  internalReadiness: ["준비도와 경로 조정(Changing)", "Readiness and the Changing route"],
  financialRoom: ["안전 여유와 시험 범위", "Safety Margin and the size of the test"],
  reversibility: ["안전 여유와 복귀 조건", "Safety Margin and the way back"],
  downsideExposure: ["손실 위험과 되돌릴 수 없는 결정의 순서", "Downside and the order of irreversible decisions"],
  optionBSupport: ["실행 계획과 지원 역할", "The execution plan and support roles"],
  constraintLoad: ["일정과 시험 범위", "Schedule and the size of the test"],
};
export function v2RecheckPart(variable: string | undefined, language: V2Language): string {
  return pick((variable && recheck[variable]) || ["구조 판단 전체", "The whole structural reading"], language);
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
