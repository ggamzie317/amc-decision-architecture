import type { V2CopyKey, V2Language } from "./v2Language";

/**
 * Survey wording and grouping. Each choice keeps its existing key (so inputs,
 * engine answers and scores are unchanged); the survey shows a specific
 * sentence under a small group heading so similar choices are told apart.
 * Analysis and report text keep the short labels from v2Language.
 * Pairs are stored [Korean, English].
 */
type Pair = readonly [ko: string, en: string];
export type V2SurveyGroup = { title: Pair; items: { key: V2CopyKey; label: Pair }[] };
export type V2SurveyField = "whyNow" | "protects" | "opens" | "exposes" | "missingAssets" | "supportSources" | "constraints";

const g = (title: Pair, items: [V2CopyKey, string, string][]): V2SurveyGroup =>
  ({ title, items: items.map(([key, ko, en]) => ({ key, label: [ko, en] as const })) });

export const v2SurveyGroups: Record<V2SurveyField, V2SurveyGroup[]> = {
  whyNow: [
    g(["새 경로가 끌어당김", "Pulled by the new path"], [
      ["newOpportunity", "구체적인 기회가 생김 (제안·공고·합격)", "A concrete opportunity appeared (offer, opening, admission)"],
      ["marketChange", "목표 분야의 시장이 커지거나 바뀜", "The target field is growing or changing"],
      ["identity", "하고 싶은 일·배우고 싶은 것이 분명해짐", "What I want to do or learn has become clear"],
    ]),
    g(["현재 자리가 밀어냄", "Pushed by the current role"], [
      ["stagnation", "지금 자리에서 성장·승진이 막힘", "Growth or promotion has stalled here"],
      ["incomePressure", "소득이 부족하거나 재정 압박이 있음", "Income is short or finances are under pressure"],
      ["workload", "업무량·소진으로 지금 방식이 지속되기 어려움", "Workload or exhaustion makes this unsustainable"],
      ["familyLocation", "가족 사정이나 거주지 때문에 변화가 필요함", "Family or where I live requires a change"],
      ["ageTiming", "나이·경력 시점상 지금이 아니면 어려움", "Age or career stage makes it now or never"],
    ]),
  ],
  protects: [
    g(["돈과 생활", "Money and living"], [
      ["income", "현재 수준의 소득", "My current level of income"],
      ["stability", "고용 안정 (정규직·계약 기간)", "Job security (permanent role, contract term)"],
      ["familyStability", "가족의 생활·학업 환경", "My family's living and schooling"],
    ]),
    g(["쌓아 온 커리어", "Career built so far"], [
      ["roleTitle", "현재 직급·직책", "My current title and level"],
      ["credibility", "업계 평판과 경력의 연속성", "Reputation and an unbroken record"],
      ["network", "지금까지 쌓은 업계 인맥", "The industry network I have built"],
    ]),
    g(["일하는 방식", "Way of working"], [
      ["time", "개인·가족과 보내는 시간", "Personal and family time"],
      ["flexibility", "근무 방식의 유연성 (재택·근무 시간)", "Flexible work (remote, hours)"],
    ]),
  ],
  opens: [
    g(["보상과 성장", "Pay and growth"], [
      ["incomeUpside", "더 높은 소득 가능성", "Higher earning potential"],
      ["growth", "더 큰 역할·책임으로 성장", "A bigger role and responsibility"],
      ["learning", "새로운 지식·기술 습득", "New knowledge and skills"],
      ["researchExpertise", "한 분야의 깊은 전문성 (연구·전문가)", "Deep expertise in one field (research, specialist)"],
    ]),
    g(["새로운 환경", "New environment"], [
      ["newMarket", "새로운 산업·고객 시장 진입", "Entry into a new industry or market"],
      ["mobility", "해외에서 일하고 살 기회", "The chance to work and live abroad"],
      ["network", "새로운 업계 인맥", "A new professional network"],
    ]),
    g(["일의 의미", "Meaning of the work"], [
      ["autonomy", "일하는 방식을 스스로 정할 자율성", "Autonomy over how I work"],
      ["identityAlignment", "내가 원하는 방향과 일의 일치", "Work aligned with where I want to go"],
    ]),
  ],
  exposes: [
    g(["돈", "Money"], [
      ["incomeRisk", "전환 기간의 소득 감소·공백", "Lower or no income during the move"],
      ["recoveryRisk", "실패하면 이전 수준으로 돌아오기 어려움", "Hard to get back to today's level if it fails"],
    ]),
    g(["시간과 실행", "Time and execution"], [
      ["timeRisk", "준비·전환에 예상보다 오래 걸림", "Preparation or the move takes longer than planned"],
      ["executionBurden", "본업과 병행하며 준비하는 부담", "Preparing alongside the current job"],
    ]),
    g(["외부 조건", "External conditions"], [
      ["visa", "비자·체류 자격을 얻지 못함", "Not obtaining a visa or residence status"],
      ["marketUncertainty", "목표 시장의 채용·수요가 불확실함", "Uncertain hiring or demand in the target market"],
      ["credibilityRisk", "경력 단절·평판 손상", "A career gap or damaged reputation"],
    ]),
    g(["가족", "Family"], [
      ["familyPressure", "가족의 이동·적응 부담", "Family relocation and adjustment"],
    ]),
  ],
  missingAssets: [
    g(["증명할 것", "Proof"], [
      ["skills", "목표 직무의 핵심 역량", "Core skills for the target role"],
      ["credential", "필요한 자격·학위·면허", "Required credentials, degrees or licences"],
      ["trackRecord", "목표 분야의 실적·포트폴리오", "A track record or portfolio in the target field"],
      ["marketProof", "채용 담당자·고객의 실제 반응", "Real responses from employers or customers"],
    ]),
    g(["실행 자원", "Resources to execute"], [
      ["network", "목표 분야의 인맥·추천인", "Contacts and referees in the target field"],
      ["time", "준비에 쓸 수 있는 시간", "Time to prepare"],
      ["energy", "끝까지 지속할 체력·에너지", "Energy to keep going"],
      ["executionCapacity", "실행 체계 (계획·도구·도와줄 사람)", "A way to execute (plan, tools, helpers)"],
    ]),
  ],
  supportSources: [
    g(["가까운 사람", "People close to me"], [
      ["family", "가족의 동의와 지원", "Family agreement and support"],
      ["partner", "배우자·파트너의 지원", "Support from my spouse or partner"],
    ]),
    g(["일과 업계", "Work and industry"], [
      ["managerCompany", "현 회사·상사 (전보·휴직·추천)", "Current employer or manager (transfer, leave, referral)"],
      ["professionalNetwork", "업계 지인·추천인", "Industry contacts and referees"],
      ["mentor", "멘토·코치", "A mentor or coach"],
      ["customerBuyer", "잠재 고객·채용 담당자", "Prospective customers or hiring managers"],
    ]),
    g(["제도와 자금", "Programmes and funding"], [
      ["academic", "교수·학교", "Professors or the institution"],
      ["financialSupport", "장학금·지원금·투자", "Scholarships, grants or investment"],
      ["none", "아직 없음", "None yet"],
    ]),
  ],
  constraints: [
    g(["시간과 시점", "Time and timing"], [
      ["deadline", "정해진 기한 (지원·계약·비자 마감)", "A fixed deadline (application, contract, visa)"],
      ["marketWindow", "시장 기회가 열려 있는 기간이 짧음", "A short market window"],
      ["careerTiming", "나이·경력 단계에 따른 제약", "Limits from age or career stage"],
    ]),
    g(["생활", "Life"], [
      ["family", "가족 돌봄·가족의 동의", "Family care or family agreement"],
      ["schoolChildren", "자녀의 학업 일정", "Children's schooling"],
      ["location", "거주지·이동의 제약", "Limits on where I can live or move"],
      ["healthEnergy", "건강·체력", "Health and stamina"],
    ]),
    g(["제도와 재정", "Rules and finances"], [
      ["visa", "비자·체류 조건", "Visa or residence rules"],
      ["company", "현 회사의 계약·겸업 제한", "Contract or side-work limits at my company"],
      ["financialConstraint", "대출·고정 지출 등 재정 부담", "Loans or fixed costs"],
    ]),
  ],
};

/** Groups for the choices a case actually offers, keeping any unlisted key (e.g. "other"). */
export function v2SurveyGroupsFor(field: V2SurveyField, choices: readonly V2CopyKey[], language: V2Language, short: (k: V2CopyKey) => string) {
  const ko = language === "ko";
  const listed = new Set(v2SurveyGroups[field].flatMap(group => group.items.map(item => item.key)));
  const groups = v2SurveyGroups[field]
    .map(group => ({
      title: group.title[ko ? 0 : 1],
      items: group.items.filter(item => choices.includes(item.key)).map(item => ({ key: item.key, label: item.label[ko ? 0 : 1] })),
    }))
    .filter(group => group.items.length > 0);
  const rest = choices.filter(key => !listed.has(key)).map(key => ({ key, label: short(key) }));
  // A lone "other" joins the last group instead of sitting under its own heading.
  if (rest.length && groups.length) groups[groups.length - 1].items.push(...rest);
  else if (rest.length) groups.push({ title: ko ? "기타" : "Other", items: rest });
  return groups;
}
