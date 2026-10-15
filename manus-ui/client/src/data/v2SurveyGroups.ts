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
    g(["새 기회 때문에", "Because of a new opportunity"], [
      ["newOpportunity", "제안이나 합격처럼 구체적인 기회가 생김", "A concrete opportunity came up, such as an offer or an admission"],
      ["marketChange", "가려는 분야가 커지거나 바뀌고 있음", "The field I want to move into is growing or changing"],
      ["identity", "하고 싶은 일이나 배우고 싶은 것이 분명해짐", "I have become clear about the work I want or what I want to learn"],
    ]),
    g(["지금 자리의 한계 때문에", "Because of limits in my current role"], [
      ["stagnation", "지금 회사에서 더 성장하거나 승진하기 어려움", "I can't grow or get promoted much further where I am"],
      ["workload", "일이 너무 많거나 지쳐서 지금처럼 계속하기 어려움", "Too much work or exhaustion makes it hard to go on like this"],
    ]),
    g(["생활 사정 때문에", "Because of my life circumstances"], [
      ["incomePressure", "지금 소득으로는 생활비나 빚을 감당하기 빠듯함", "My income barely covers living costs or debts"],
      ["familyLocation", "가족 사정이나 사는 곳 때문에 변화가 필요함", "Family circumstances or where I live call for a change"],
      ["ageTiming", "나이나 경력 시기를 생각하면 지금 움직여야 할 것 같음", "Given my age or career stage, it feels like now or never"],
    ]),
    g(["그 밖의 이유", "Another reason"], [
      ["other", "위에 없는 다른 이유", "A reason not listed above"],
    ]),
  ],
  protects: [
    g(["돈과 생활", "Money and daily life"], [
      ["income", "지금 받는 소득 수준", "The income I earn now"],
      ["stability", "갑자기 일을 잃을 걱정이 적은 안정된 고용", "A secure job I am unlikely to lose suddenly"],
      ["familyStability", "가족의 생활과 자녀의 학업 환경", "My family's routine and my children's schooling"],
    ]),
    g(["쌓아 온 경력", "The career I have built"], [
      ["roleTitle", "지금의 직급과 직책", "My current title and level"],
      ["credibility", "업계에서 쌓은 평판과 끊기지 않은 경력", "My reputation and an unbroken career record"],
      ["network", "지금 업계에서 쌓은 인맥", "The network I have built in my industry"],
    ]),
    g(["시간과 일하는 방식", "Time and how I work"], [
      ["time", "나와 가족을 위해 쓰는 시간", "Time for myself and my family"],
      ["flexibility", "재택이나 근무 시간을 조정할 수 있는 유연함", "Flexibility, such as remote work or adjustable hours"],
    ]),
    g(["그 밖의 것", "Something else"], [
      ["other", "위에 없는 다른 것", "Something not listed above"],
    ]),
  ],
  opens: [
    g(["보상과 성장", "Pay and growth"], [
      ["incomeUpside", "지금보다 높은 소득을 받을 가능성", "The chance to earn more than now"],
      ["growth", "더 큰 역할과 책임", "A bigger role with more responsibility"],
      ["learning", "새로 배우는 지식과 기술", "New knowledge and skills"],
      ["researchExpertise", "한 분야를 깊이 파고드는 전문성", "Deep expertise in one field, as a researcher or specialist"],
    ]),
    g(["새로운 무대", "A new setting"], [
      ["newMarket", "새로운 산업이나 고객 시장에서 일할 기회", "Work in a new industry or customer market"],
      ["mobility", "해외에서 일하고 살 기회", "The chance to work and live abroad"],
      ["network", "새 분야에서 만드는 인맥", "A network in a new field"],
    ]),
    g(["일의 의미", "Meaning in the work"], [
      ["autonomy", "일하는 방식을 스스로 정할 수 있는 자율", "Freedom to decide how I work"],
      ["identityAlignment", "내가 원하는 방향과 맞는 일", "Work that fits the direction I want"],
    ]),
    g(["그 밖의 것", "Something else"], [
      ["other", "위에 없는 다른 것", "Something not listed above"],
    ]),
  ],
  exposes: [
    g(["돈과 경력", "Money and career"], [
      ["incomeRisk", "옮기는 동안 소득이 줄거나 끊김", "My income drops or stops during the move"],
      ["recoveryRisk", "잘 안되면 지금 수준으로 돌아오기 어려움", "If it does not work out, it is hard to get back to where I am now"],
      ["credibilityRisk", "경력에 공백이 생기거나 평판이 떨어짐", "A gap in my career or harm to my reputation"],
    ]),
    g(["시간과 부담", "Time and strain"], [
      ["timeRisk", "준비나 이동이 예상보다 오래 걸림", "Preparing or moving takes longer than planned"],
      ["executionBurden", "지금 일을 하면서 준비하기가 벅참", "Preparing while doing my current job is too much"],
      ["familyPressure", "가족이 이사하고 새 환경에 적응해야 함", "My family has to move and adjust to a new place"],
    ]),
    g(["내가 정할 수 없는 조건", "Things outside my control"], [
      ["visa", "비자나 체류 자격을 받지 못함", "I can't get a visa or residence status"],
      ["marketUncertainty", "가려는 시장의 채용이나 수요가 불확실함", "Hiring or demand in the target market is uncertain"],
    ]),
    g(["그 밖의 위험", "Another risk"], [
      ["other", "위에 없는 다른 위험", "A risk not listed above"],
    ]),
  ],
  missingAssets: [
    g(["보여 줄 수 있는 것", "What you can show"], [
      ["skills", "목표 직무에 필요한 핵심 역량", "The core skills the target role needs"],
      ["credential", "필요한 자격증·학위·면허", "A required certificate, degree or licence"],
      ["trackRecord", "목표 분야에서 보여 줄 실적이나 포트폴리오", "Results or a portfolio to show in the target field"],
      ["marketProof", "채용 담당자나 고객에게서 받은 실제 반응", "Real responses from employers or customers"],
    ]),
    g(["준비에 쓸 자원", "Resources to prepare"], [
      ["network", "목표 분야의 인맥이나 추천해 줄 사람", "Contacts or referees in the target field"],
      ["time", "준비에 쓸 시간", "Time to prepare"],
      ["energy", "끝까지 해낼 체력과 에너지", "The energy to see it through"],
      ["executionCapacity", "준비를 끌고 갈 계획과 도와줄 사람", "A plan and people to help carry it through"],
    ]),
  ],
  supportSources: [
    g(["가족", "Family"], [
      ["family", "가족이 동의하고 도와줌", "My family agrees and will help"],
      ["partner", "배우자나 파트너가 생활비나 시간을 함께 감당해 줌", "My spouse or partner can share costs or time"],
    ]),
    g(["일로 아는 사람", "People I know through work"], [
      ["managerCompany", "지금 회사나 상사가 전보·휴직·추천으로 도와줌", "My company or manager can help with a transfer, leave or a referral"],
      ["professionalNetwork", "업계 지인이 소개하거나 추천해 줌", "Industry contacts can introduce or recommend me"],
      ["mentor", "조언해 줄 멘토나 코치가 있음", "A mentor or coach can advise me"],
      ["customerBuyer", "관심을 보인 잠재 고객이나 채용 담당자가 있음", "A prospective customer or hiring manager has shown interest"],
    ]),
    g(["학교와 자금", "Schools and funding"], [
      ["academic", "교수나 학교가 도와줌", "A professor or school can help"],
      ["financialSupport", "장학금·지원금·투자를 받을 수 있음", "I can get a scholarship, grant or investment"],
    ]),
    g(["도움받을 곳이 없다면", "If you have no support"], [
      ["none", "아직 도움받을 곳이 없음", "I have no support yet"],
    ]),
  ],
  constraints: [
    g(["시간", "Time"], [
      ["deadline", "지원·계약·비자 등 정해진 마감일이 있음", "There is a fixed deadline, such as an application, contract or visa"],
      ["marketWindow", "지금 열린 기회가 곧 닫힐 수 있음", "The current opening may close soon"],
      ["careerTiming", "나이나 경력 단계 때문에 선택지가 좁음", "My age or career stage narrows my options"],
    ]),
    g(["가족과 건강", "Family and health"], [
      ["family", "가족을 돌봐야 하거나 가족의 동의가 필요함", "I care for family or need my family's agreement"],
      ["schoolChildren", "자녀의 학교 일정에 맞춰야 함", "I have to work around my children's schooling"],
      ["healthEnergy", "건강이나 체력에 한계가 있음", "My health or stamina is limited"],
    ]),
    g(["사는 곳과 체류", "Where I can live"], [
      ["location", "사는 곳을 옮기기 어렵거나 옮길 수 있는 곳이 정해져 있음", "I can't easily move, or can only move to certain places"],
      ["visa", "비자나 체류 자격 조건을 맞춰야 함", "I have to meet visa or residence rules"],
    ]),
    g(["회사 계약과 돈", "Employment contract and money"], [
      ["company", "지금 회사와의 계약 때문에 이직이나 겸업이 제한됨", "My current contract limits leaving or side work"],
      ["financialConstraint", "대출이나 고정 지출이 커서 소득 공백을 견디기 어려움", "Loans or fixed costs make an income gap hard to absorb"],
    ]),
    g(["그 밖의 제약", "Something else"], [
      ["other", "위에 없는 다른 제약", "A limit not listed above"],
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
