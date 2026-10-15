import { withKoreanParticle } from "./koreanParticle";
import { v2CustomerInput } from "./v2InputGlossary";
import { v2KeyFactReadings } from "../../../shared/v2KeyFacts";
import { v2SituationalAreas } from "./v2ExternalEvidenceClient";
import { v2CaseFifwmSet } from "./v2CaseFifwm";
import type {
  ProductApplicationV3,
  ChangingPlay,
} from "./amcProductApplicationV3";
import type { V2State } from "./amcV2Model";
import type {
  ExternalIntelligenceV2,
  V2Provenance,
} from "./externalIntelligenceV2";
import { v2CustomerEvidenceText, v2MissingPoint } from "./amcV2Presentation";
import { v2CustomerPlayText, v2CustomerPosture } from "./v2ReportPresentation";
import { v2t, type V2CopyKey } from "./v2Language";
import { selfCheckCards, type SelfCheckId, type SelfChecks } from "./v2SelfDiagnostic";
import { v2EvidenceAreas } from "../../../shared/externalIntelligenceV2Request";
import { v2CanAskCanonicalFifwm } from "./v2CanonicalFifwm";
import {
  v2AutoComparison, v2AutoComparisonLabel, v2AutoComparisonWord, v2ComparisonKey, v2ComparisonLabel,
  v2ConditionGroup, v2EvidenceArea, v2GroupAxis, type V2AutoComparison, type EvidenceComparisons, type EvidenceComparisonStatus,
} from "./v2EvidenceComparison";

export type V2EvidencePhase =
  | "not_checked"
  | "loading"
  | "live"
  | "unavailable"
  | "demo";
type Pair = readonly [string, string];
type Profile = {
  topic: Pair;
  question: Pair;
  action: Pair;
  output: Pair;
  advance: Pair;
};
const profiles: Record<string, Profile> = {
  Entrepreneurship: {
    topic: ["사업 검증", "Business validation"],
    question: [
      "관심을 보인 고객이 실제로 비용을 지불하고 다시 구매할까요?",
      "Will interested customers pay and return?",
    ],
    action: [
      "한 고객군에게 유료 제안 하나를 작게 판매해 보세요. 고객이 지금 쓰는 해결 방식과 비교하고, 거절한 이유를 기록하세요.",
      "Try selling one paid offer to one customer group. Compare it with what they use today, and record why people say no.",
    ],
    output: [
      "유료 반응, 반복 구매 여부, 제공 비용을 정리한 판매 기록",
      "A sales record of paid responses, repeat purchases and delivery costs",
    ],
    advance: [
      "실제 결제와 반복 이용 근거가 확보되고 제공 비용을 감당할 수 있을 때",
      "When paid demand, repeat use and manageable delivery costs are demonstrated",
    ],
  },
  "MBA / EMBA / PhD Decision": {
    topic: ["진학 검토", "Study review"],
    question: [
      "이 학위가 목표 경로에 꼭 필요하며, 재직 중 준비나 더 작은 학습 경로로 대체하기 어려울까요?",
      "Is this degree necessary for the target path, rather than a smaller learning route while working?",
    ],
    action: [
      "목표 경로의 실제 요건과 과정별 비용·재원·결과 자료를 비교하세요. 졸업생에게 학위가 도움이 된 조건과 도움이 되지 않은 조건을 함께 확인하세요.",
      "Compare target-path requirements with program costs, funding and outcomes. Ask alumni when the degree helped and when it did not.",
    ],
    output: [
      "목표 요건과 학위의 연결, 총비용, 대체 경로를 비교한 표",
      "A comparison of target requirements, degree relevance, total cost and alternatives",
    ],
    advance: [
      "학위가 목표에 필요한 이유와 재원·시간 계획을 확인했을 때",
      "When degree relevance, funding and time capacity are established",
    ],
  },
  "Industry Transition": {
    topic: ["산업 전환", "Industry transition"],
    question: [
      "기존 성과가 새 산업의 직무 요건을 실제로 충족한다는 근거가 있을까요?",
      "What demonstrates that existing achievements meet the target industry's role requirements?",
    ],
    action: [
      "목표 직무의 공고와 기존 성과를 항목별로 비교하고, 부족한 요건을 보여 줄 작은 결과물을 만드세요. 현업 담당자에게 구체적인 피드백을 받으세요.",
      "Map target-role requirements to existing achievements. Build a small work sample for the gaps and obtain specific practitioner feedback.",
    ],
    output: [
      "직무 요건 대비 성과표, 결과물, 현업 피드백 기록",
      "A requirements-to-achievements map, work sample and practitioner feedback",
    ],
    advance: [
      "관련 성과에 대한 현업의 긍정적인 평가와 실제 지원 경로를 확보했을 때",
      "When practitioners validate relevant work and an actual application route is available",
    ],
  },
  "Overseas Relocation": {
    topic: ["해외 이동", "Overseas relocation"],
    question: [
      "이동 자격, 현지 생활 기반, 복귀 경로가 함께 성립할까요?",
      "Do eligibility, local living capacity and a return path work together?",
    ],
    action: [
      "공식 이동 요건과 현지 비용을 확인하고, 소득·주거·가족 일정과 맞춰 보세요. 현재 기반을 해지하기 전 복귀 가능 조건을 정리하세요.",
      "Check official mobility requirements and local costs against income, housing and family schedules. Establish return conditions before giving up the current base.",
    ],
    output: [
      "공식 요건, 생활 비용, 복귀 조건을 연결한 준비표",
      "A preparation map linking official requirements, living costs and return conditions",
    ],
    advance: [
      "자격과 생활 기반을 확인하고 복귀에 필요한 자원을 남겨 두었을 때",
      "When eligibility and living capacity are established and return resources are protected",
    ],
  },
  "Role Upgrade / Downgrade": {
    topic: ["역할 조정", "Role change"],
    question: [
      "직함의 변화가 권한·책임·보상·지원의 변화와 일치할까요?",
      "Does the title change align with authority, responsibility, compensation and support?",
    ],
    action: [
      "역할 범위와 성공 기준을 문서로 확인하세요. 일부 업무를 먼저 맡아 보며 필요한 지원과 실제 부담을 확인하세요.",
      "Confirm scope and success criteria in writing. Take on part of the work first to check the support and workload involved.",
    ],
    output: [
      "역할·권한·지원 합의와 시범 업무 결과",
      "An agreement on role, authority and support plus trial-work results",
    ],
    advance: [
      "책임에 맞는 권한과 지원, 감당 가능한 업무 범위를 확인했을 때",
      "When authority, support and manageable scope match the responsibility",
    ],
  },
  "Corporate Stay vs Exit": {
    topic: ["잔류와 이탈", "Stay or exit"],
    question: [
      "현재 역할을 바꾸는 것과 조직을 떠나는 것 중 어느 쪽이 실제 문제를 줄일까요?",
      "Would changing the current role or leaving the organization address the actual problem?",
    ],
    action: [
      "현재 역할의 조정 가능성을 확인하면서 외부 경로의 요건과 구체적인 제안을 비교하세요. 퇴사 전 소득 공백과 재진입 조건을 정리하세요.",
      "Check internal role changes alongside external requirements and concrete offers. Establish income-gap and re-entry conditions before leaving.",
    ],
    output: [
      "내부 조정 가능성과 외부 제안·복귀 조건의 비교표",
      "A comparison of internal changes, external offers and re-entry conditions",
    ],
    advance: [
      "외부 경로의 구체적인 조건이 확인되고 소득 공백을 감당할 수 있을 때",
      "When concrete external terms and capacity for an income gap are established",
    ],
  },
  "Burnout-driven Decision": {
    topic: ["회복과 경력", "Recovery and career"],
    question: [
      "회복에 필요한 업무 조정과 경로 변경을 구분할 수 있을까요?",
      "Can recovery needs be separated from the need to change career paths?",
    ],
    action: [
      "회복을 위해 업무량·일정·지원을 먼저 조정해 보고, 부담이 어떻게 달라지는지 기록하세요. 대안 비교는 회복에 쓸 힘을 남기는 범위에서 하세요.",
      "Try changes to workload, schedule and support first, and record how the strain changes. Compare alternatives only as far as your energy for recovery allows.",
    ],
    output: [
      "업무 조정 전후 부담과 회복 시간의 기록",
      "A record of workload and recovery time before and after the adjustment",
    ],
    advance: [
      "회복에 필요한 시간과 지원이 확보되고 대안의 실제 부담을 확인했을 때",
      "When recovery time, support and the alternative's actual workload are established",
    ],
  },
  "Family Constraint-heavy Decision": {
    topic: ["가족과 경력", "Family and career"],
    question: [
      "경로 변경이 가족 일정과 자원에 미치는 영향을 실제로 감당할 수 있을까요?",
      "Can family schedules and resources accommodate the actual effects of the change?",
    ],
    action: [
      "가족과 시간·위치·돌봄·지출의 최소 유지 조건을 합의하세요. 그 조건을 지키는 작은 실행으로 실제 부담을 확인하세요.",
      "Agree minimum conditions for time, location, care and spending. Test the change through a small step that preserves those conditions.",
    ],
    output: [
      "가족의 유지 조건, 지원 분담, 시범 실행 기록",
      "Agreed family conditions, support responsibilities and trial results",
    ],
    advance: [
      "가족의 유지 조건과 실제 지원 분담이 성립했을 때",
      "When minimum family conditions and actual support commitments are workable",
    ],
  },
  "General Career Reconfiguration": {
    topic: ["경력 재설계", "Career reconfiguration"],
    question: [
      "지금 기반을 지키면서 새 경로의 요건을 미리 확인할 수 있을까요?",
      "Can you check the new path's requirements while keeping your current base?",
    ],
    action: [
      "새 경로에 필요한 요건과 현재 성과를 비교하고, 가장 중요한 부족 조건 하나를 작은 결과물과 현업 피드백으로 확인하세요.",
      "Compare new-path requirements with current achievements. Check the most important gap with a small work sample and practitioner feedback.",
    ],
    output: [
      "목표 요건, 부족 조건, 결과물과 피드백의 연결표",
      "A map linking target requirements, gaps, work samples and feedback",
    ],
    advance: [
      "핵심 요건을 충족하는 근거와 감당 가능한 실행 계획을 확보했을 때",
      "When evidence of meeting key requirements and a manageable plan are available",
    ],
  },
};
const academic: Profile = {
  topic: ["학술 경력 검토", "Academic career review"],
  question: [
    "학회 참여와 연구 활동이 목표 대학의 실제 임용 요건을 충족하는 성과로 이어질까요?",
    "Will conferences and research produce evidence that meets the target institution's actual appointment requirements?",
  ],
  action: [
    "목표 대학의 임용 공고에서 학위·경력·연구·강의 요건을 구분하고 기존 성과와 비교하세요. 학회 참가비를 지출하기 전 연구 결과물이나 강의안을 담당자에게 검토받으세요.",
    "Separate degree, experience, research and teaching requirements in target appointment notices and map existing achievements to them. Obtain feedback on research or a teaching plan before spending on conferences.",
  ],
  output: [
    "임용 요건 대비 성과표, 연구 또는 강의 결과물, 담당자 피드백",
    "An appointment-requirements map, research or teaching sample and institutional feedback",
  ],
  advance: [
    "목표 기관이 인정하는 성과와 지원 자격을 확인하고 본업·연구 시간과 비용을 감당할 수 있을 때",
    "When the institution recognizes the evidence, eligibility is confirmed and work, research time and costs remain manageable",
  ],
};
export function isV2AcademicCase(
  state: Pick<V2State, "caseType" | "decision" | "optionB">
): boolean {
  return (
    state.caseType === "General Career Reconfiguration" &&
    /교수|강사|강의|학회|임용|학술|adjunct|faculty|lecturer|professor|academic appointment/i.test(
      `${state.decision} ${state.optionB}`
    )
  );
}
/** A visible, editable public search target. Customer prose and notes are not inferred into new request fields. */
export function v2PublicSearchTarget(state: V2State): string {
  // Search only an explicitly entered public target. Neither option prose nor
  // a generic case-family label identifies a customer's actual research target.
  return state.publicSearchTarget?.trim() ?? "";
}
export type V2Finding = {
  id: string;
  title: string;
  basis: string;
  implication: string;
  coreReading: string;
  evidenceIds: number[];
  provenance: V2Provenance[];
  selfReports: string[];
};
export type V2EvidenceLink = {
  id: number;
  conditionGroup: "finance" | "capacity" | "readiness" | "public";
  sourceFact: string;
  sourceScope: string;
  sourceUrl?: string;
  sourceDate?: string;
  conditionProvenance: readonly V2Provenance[];
  condition: string;
  selfReport?: string;
  interpretation: string;
  unresolved: string;
  test: string;
  comparisonKey: string;
  comparisonStatus: EvidenceComparisonStatus;
  comparisonLabel: string;
  /** Automatic first-pass reading used while the customer has not compared the card. */
  autoComparison: V2AutoComparison;
  comparisonDetail: string;
  customerEvidence: string;
  comparisonReading: string;
  testReference: string;
};
export type V2Analysis = {
  language: V2State["language"];
  evidenceLanguage: V2State["language"];
  fifwmSource: ProductApplicationV3["decisionStructure"]["fifwmSource"];
  topic: string;
  posture: string;
  summary: string;
  executiveSummary: string;
  question: string;
  missingConcept: string;
  tradeoff: string;
  boundary: string;
  externalReading: string;
  findings: V2Finding[];
  evidenceLinks: V2EvidenceLink[];
  target: string;
  /** status: found / none (searched, nothing usable) / pending (still collecting) / not_searched. */
  researchCoverage: Array<{ area: string; title: string; evidenceIds: number[]; status: "found" | "none" | "pending" | "not_searched" }>;
  externalContextReading: string;
  factorScopeNote: string;
  switching: Array<{ signal: string; direction: string }>;
  /** Key facts the customer gave, each with what it means to check (never scored). */
  situation: Array<{ id: string; question: string; answer: string; check?: string }>;
  priorityEvidence: {
    headline: string;
    condition: string;
    check: string;
    nextCheck: string;
  } | null;
  factors: Array<{
    id: keyof ProductApplicationV3["decisionStructure"]["fifwm"];
    title: string;
    questionTopic: string;
    reading: string;
    evidenceIds: number[];
    status: string;
    assessed: boolean;
  }>;
  safety: Array<{
    id: string;
    title: string;
    band: string;
    level: number | null;
    reading: string;
  }>;
  plays: Array<{
    family: ChangingPlay["family"];
    title: string;
    move: string;
    changes: string;
    protects: string;
    needs: string;
    evidence: string;
    exposure: string;
    timeExposure: string;
  }>;
  experiment: {
    action: string;
    briefAction: string;
    output: string;
    continue: string;
    pause: string;
    stages: Array<{
      day: string;
      title: string;
      action: string;
      briefAction?: string;
      output: string;
    }>;
  };
};

/**
 * A short quote for a source, never the whole fact: the fact's first sentence
 * when it is short (so a changed fact changes the reading and the next action),
 * otherwise the headline, otherwise the fact's first clause clipped at a word
 * boundary without cutting through a figure.
 */
function v2BriefQuote(rawHeadline: string, rawFact: string, ko: boolean): string {
  // The result is wrapped in quotes by the caller, so drop quotes inside it (no nested ‘…‘…’…’).
  const unquote = (value: string) => value.replace(/[‘’“”"']/g, "");
  const headline = unquote(rawHeadline), fact = unquote(rawFact);
  const max = ko ? 50 : 80;
  const firstSentence = (value: string) => value.trim().split(/(?<=[.!?。])\s|[;；]\s?/)[0].replace(/[.。]$/, "").trim();
  const sentence = firstSentence(fact);
  if (sentence && sentence.length <= max) return sentence;
  const title = headline.trim();
  if (title && title.length <= max) return title;
  const source = sentence || title;
  const clause = source.split(/,\s/)[0];
  if (clause.length <= max) return clause === source ? clause : `${clause}…`;
  const words = clause.slice(0, max).split(" ");
  if (words.length > 1) words.pop();
  while (words.length > 1 && /\d/.test(words[words.length - 1])) words.pop();
  return `${words.join(" ").replace(/[\s,·:]+$/, "")}…`;
}
/** The first sentence of a reading, so a paragraph never repeats a reading shown beside it. */
function v2FirstSentence(value: string): string {
  return value.trim().split(/(?<=[.!?])\s/)[0];
}

/** Non-scored interpretation of actual engine bands plus the immutable public-evidence snapshot.
 * It does not manufacture canonical FIFWM scores or upgrade personal fit from a public source. */
export function buildV2Analysis(
  state: V2State,
  core: ProductApplicationV3,
  intelligence: ExternalIntelligenceV2,
  phase: V2EvidencePhase = intelligence.status,
  selfChecks?: SelfChecks,
  comparisons: EvidenceComparisons = {},
  evidenceLanguage: V2State["language"] = state.language,
): V2Analysis {
  const ko = state.language === "ko",
    say = (koText: string, enText: string) => (ko ? koText : enText);
  const text = (p: Pair) => p[ko ? 0 : 1],
    t = (k: V2CopyKey) => v2t(state.language, k);
  const profile = isV2AcademicCase(state)
    ? academic
    : (profiles[state.caseType] ?? profiles["General Career Reconfiguration"]);
  const targetScope = state.caseType === "Entrepreneurship"
    ? say("목표 고객군·제안·지역", "target customer segment, offer and geography")
    : state.caseType === "MBA / EMBA / PhD Decision" || isV2AcademicCase(state)
      ? say("목표 과정·기관·지역", "target program, institution and geography")
      : state.caseType === "Industry Transition"
        ? say("목표 산업·직무·지역", "target industry, role and geography")
        : say("목표 경로·지역", "target path and geography");
  const personalUnknown = state.caseType === "Entrepreneurship"
    ? say("실제 구매와 실행할 여유", "actual purchases and the capacity to deliver")
    : say("본인의 자격·성과와 실행할 여유", "your eligibility, work evidence and capacity to act");
  const b = core.postureBasis,
    s = core.safetyMargin.inputs;
  const cards = selfCheckCards(state.caseType, state.language);
  const selfReport = (id: SelfCheckId, checkedOnly = false): string | null => {
    if (!selfChecks) return null;
    const answer = selfChecks[id];
    if (answer.status === null) return null;
    // Evidence rows cite only what the customer actually checked; "not checked" is said once, elsewhere.
    if (checkedOnly && answer.status !== "checked") return null;
    const title = cards.find(card => card.id === id)?.title ?? id;
    const status = answer.status === "checked"
      ? say("직접 확인했다고 답함", "you said you checked this directly")
      : answer.status === "unsure"
        ? say("확인했는지 잘 모르겠다고 답함", "you said you are not sure")
        : say("아직 직접 확인하지 않았다고 답함", "you have not checked this directly yet");
    const detail = answer.status === "checked" && answer.detail.trim()
      ? ` — ${answer.detail.trim()}`
      : "";
    return `${title}: ${status}${detail} ${say("(외부 확인 전)", "(not externally checked)")}`;
  };
  const reports = (...ids: SelfCheckId[]) => ids.flatMap(id => {
    const report = selfReport(id);
    return report ? [report] : [];
  });
  const money = s.financialRoom.band,
    reverse = s.reversibility.band,
    risk = s.downsideExposure.band;
  const ready = b.internalReadiness.band,
    support = b.optionBSupport.band,
    load = b.constraintLoad.band;
  const live = phase === "live" && intelligence.status === "live",
    demo = phase === "demo" && intelligence.status === "demo";
  const blocks = live || demo ? intelligence.evidenceBlocks : [];
  const constrained = core.safetyMargin.band === "weak";
  const protectedBase = state.protects.some(k => k !== "other")
    ? state.protects.filter(k => k !== "other").map(t).join(" · ")
    : say("현재의 소득과 생활 기반", "current income and living capacity");
  const opening = state.opens.some(k => k !== "other")
    ? state.opens.filter(k => k !== "other").map(t).join(" · ")
    : text(profile.topic);
  const boundary = constrained
    ? say(
        `지켜야 할 기반은 ${protectedBase}입니다. 쓸 돈과 시간, 중단 시점을 먼저 정하세요. 일이 틀어져도 버틸 여유를 남긴 채 작은 단계로 확인하세요.`,
        `Protect ${protectedBase}. Decide first how much money and time you will spend and when you will stop. Then check in small steps, keeping room to absorb a setback.`
      )
    : reverse === "unknown"
      ? say(
          `지켜야 할 기반은 ${protectedBase}입니다. 원래 자리로 돌아오는 데 드는 비용과 시간을 확인하기 전에는 되돌리기 어려운 약속을 늘리지 마세요.`,
          `Protect ${protectedBase}. Find out what it would cost, in money and time, to return before taking on commitments you cannot undo.`
        )
      : say(
          `지켜야 할 기반은 ${protectedBase}입니다. 확인된 여유 안에서만 움직이고, 다음 단계로 가기 전에 비용과 복귀 조건을 다시 확인하세요.`,
          `Protect ${protectedBase}. Move only within the room you have confirmed, and recheck costs and return terms before the next step.`
        );
  const safetyReading = constrained
    ? say(
        "지금 가진 자원으로는 계획이 틀렸을 때 회복할 여유가 부족합니다. 새 경로가 유망해 보여도, 한 번에 옮기기보다 작은 단계로 먼저 확인하세요.",
        "Your current resources leave little room to recover if the plan goes wrong. Even if the new path looks promising, check it in small steps before moving fully."
      )
    : core.safetyMargin.band === "unknown"
      ? say(
          "계획이 틀렸을 때 버틸 수 있는지 판단할 정보가 아직 없습니다. 기회가 좋아 보이는 것과 실패를 감당할 수 있는 것은 따로 확인해야 합니다.",
          "There is not yet enough information to tell whether you could absorb a setback. A promising opportunity and the ability to absorb failure need to be checked separately."
        )
      : say(
          "일이 틀어져도 버틸 여유가 어느 정도 있습니다. 그 여유가 실제 비용과 복귀 조건까지 감당하는지 확인하세요.",
          "You have some room to absorb a setback. Check that it covers the actual costs and the terms for returning."
        );
  const readinessReading =
    ready === "weak"
      ? say(
          "가려는 경로와 지금의 준비 사이에 차이가 있습니다. 활동을 늘리기보다, 목표 요건 하나를 채우는 결과물을 먼저 만드는 편이 확인에 도움이 됩니다.",
          "There is a gap between the path you want and where your preparation stands. One work sample that meets a target requirement shows more than simply doing more."
        )
      : ready === "unknown"
        ? say(
            "준비 상태가 아직 확인되지 않았습니다. 목표 요건과 기존 성과를 비교해, 이미 채운 조건과 부족한 조건을 나눠 보세요.",
            "Your readiness is not yet established. Compare target requirements with your achievements to separate what you already meet from the gaps."
          )
        : say(
            "지금까지의 준비가 목표 쪽에서 인정받는 근거가 되는지 확인해야 합니다. 스스로의 평가만으로는 실제로 들어갈 수 있는지 알 수 없습니다.",
            "Check whether your preparation counts as evidence on the target side. Your own assessment alone cannot show whether you can actually get in."
          );
  const capacityReading =
    load === "heavy"
      ? say(
          "현재 제약이 커서 추가 활동이 본업·가족·회복 시간을 밀어낼 수 있습니다. 일정과 역할을 재배치하지 않으면 준비가 진행돼도 실행 부담이 남습니다.",
          "Heavy constraints mean added activity may displace work, family or recovery time. Readiness improvements alone do not resolve execution pressure without changes to schedule or scope."
        )
      : support === "weak" || support === "unknown"
        ? say(
            "도움을 줄 사람이 있다는 것과 필요한 시간·자원을 실제로 지원받는 것은 다릅니다. 구체적인 지원 역할과 가능한 일정을 확인해야 합니다.",
            "Having potential supporters differs from receiving the time and resources needed. Confirm specific responsibilities and availability."
          )
        : say(
            "실행을 뒷받침할 조건이 일부 갖춰져 있습니다. 실제로 확보한 일정과 도움을 작은 단계에서 확인한 뒤, 약속을 더 늘릴지 정하세요.",
            "Some support for acting on this is in place. Check the schedule and help you have actually secured in a small step before taking on more."
          );
  const target = v2CustomerInput(state.language, v2PublicSearchTarget(state) || state.optionB, text(profile.topic)).text;
  // Comparison + scope sentences per link, without the personal reading (used where that reading is already shown).
  const linkReadings = new Map<number, { comparison: string; scope: string }>();
  const evidenceLinks: V2EvidenceLink[] = blocks.map((block, id) => {
    const conditionGroup = v2ConditionGroup(v2EvidenceArea(block, state));
    const comparisonKey = v2ComparisonKey(block, evidenceLanguage);
    const comparison = comparisons[comparisonKey];
    const comparisonStatus = comparison?.status ?? "unreviewed";
    const axisKey = v2GroupAxis[conditionGroup];
    const axisBand = b[axisKey].band;
    const autoComparison = v2AutoComparison(block.direction, axisBand, conditionGroup);
    const axisLabel = t(({ safetyMargin: "safety", constraintLoad: "constraint", internalReadiness: "readinessBand" } as const)[axisKey]);
    const comparisonLabel = comparisonStatus === "unreviewed"
      ? v2AutoComparisonLabel(autoComparison, axisLabel, t(axisBand as V2CopyKey), ko)
      : v2ComparisonLabel(comparisonStatus, ko);
    const autoWord = v2AutoComparisonWord(autoComparison, ko);
    const condition =
      conditionGroup === "finance"
        ? say(
            `재정 여유: ${t(money)} / 손실 위험: ${t(risk)}`,
            `Financial room: ${t(money)} / downside: ${t(risk)}`
          )
        : conditionGroup === "capacity"
          ? say(
              `제약 부담: ${t(load)} / 복귀 가능성: ${t(reverse)}`,
              `Constraints: ${t(load)} / reversibility: ${t(reverse)}`
            )
          : conditionGroup === "readiness" ? say(
              `준비 상태: ${t(ready)} / 지원 기반: ${t(support)}`,
              `Readiness: ${t(ready)} / support: ${t(support)}`
            ) : `${t((v2EvidenceArea(block, state) ?? "externalPressure") as V2CopyKey)} / ${target}`;
    const linkedSelfReport = selfReport(
      conditionGroup === "finance" ? "financial"
        : conditionGroup === "capacity" ? "capacity"
          : conditionGroup === "readiness" ? "readiness" : "public",
      true
    );
    const headline = v2CustomerEvidenceText(state.language, block.headline);
    const criterion = v2CustomerEvidenceText(state.language, block.fact);
    // Quote only the first clause of the fact (so a changed fact changes the
    // reading and the next action), never the whole source fact.
    const quote = v2BriefQuote(headline, criterion, ko);
    const quoted = say(`‘${quote}’`, `“${quote}”`);
    // One sentence on what the source's scope means for this target.
    const implication = demo
      ? say(
          `합성 자료 ${withKoreanParticle(quoted, "은/는")} 실제 요건을 보여 주지 않으므로, ${targetScope}의 실제 공개 자료에서 같은 조건을 확인하세요.`,
          `The synthetic item ${quoted} shows no actual requirement, so check the same condition in public sources for the ${targetScope}.`
        )
      : block.direction === "caution"
        ? say(
            `${quoted}에서 짚는 제한을 목표 경로의 요건·비용 비교에 반영하세요.`,
            `Carry the limit in ${quoted} into your comparison of target requirements and costs.`
          )
        : block.direction === "supportive"
          ? say(
              `${withKoreanParticle(quoted, "은/는")} 경로를 탐색할 근거는 되지만, ${withKoreanParticle(personalUnknown, "이/가")} 갖춰졌는지는 따로 확인해야 합니다.`,
              `${quoted} supports exploring the path, but ${personalUnknown} still need to be checked separately.`
            )
          : say(
              `${withKoreanParticle(quoted, "은/는")} 적용 범위가 좁은 자료라, ${targetScope}에도 같은 조건이 맞는지 확인해야 합니다.`,
              `${quoted} has a narrow scope, so check whether the same condition holds for the ${targetScope}.`
            );
    const personal =
      conditionGroup === "finance"
        ? safetyReading
        : conditionGroup === "capacity"
          ? capacityReading
          : conditionGroup === "readiness"
            ? readinessReading
            : say("공개 자료만으로는 내 조건이나 수요에 맞는지 확정할 수 없습니다.", "Public material alone cannot show whether it fits your conditions or demand.");
    const customerEvidence = comparison?.detail.trim() || linkedSelfReport || say(
      `입력한 단계 기준 — ${condition}`,
      `From your answers — ${condition}`
    );
    const bandWord = t(axisBand as V2CopyKey);
    // The customer's own note, without a trailing "(…)" so parentheses never nest.
    const note = customerEvidence.replace(/\s*\([^()]*\)\s*$/, "");
    const comparisonReading = comparisonStatus === "gap"
      ? say(
          `이 기준에 부족한 점이 있다고 답했으니(${note}), 무엇이 빠졌는지 먼저 확인하세요.`,
          `You reported a gap against this source (${note}), so pin down what is missing first.`
        )
      : comparisonStatus === "matches"
        ? say(
            `내 근거(${note})가 이 기준에 맞는다고 답했지만, 실제 상대방이 인정하는지는 별도 확인이 필요합니다.`,
            `You reported that your evidence (${note}) meets this source, but whether the actual counterpart agrees needs separate checking.`
          )
        : comparisonStatus === "not_applicable"
          ? say(
              `이 공개 조건이 목표(${target})에 적용되지 않는다고 답했으므로, 이 자료로는 적합성을 판단하지 않습니다.`,
              `You said this source does not apply to ${target}, so it is not used to judge your fit.`
            )
          : autoComparison === "context"
            ? say(
                "시장 전체의 흐름을 보여 주는 참고 자료입니다. 내 준비 상태와 직접 비교하지 않았습니다.",
                "Market context that shows the overall trend. It was not compared with your own readiness."
              )
          : autoComparison === "open"
            ? say(
                `자동 비교: 내 ${axisLabel} 단계를 입력하지 않아 자료의 방향만 표시합니다.`,
                `Automatic comparison: your ${axisLabel} level is not set, so only the source's direction is shown.`
              )
            : say(
                `자동 비교 ‘${autoWord}’: ${autoComparison === "watch"
                  ? `내 ${axisLabel}(${bandWord})에 부담이 될 수 있어 먼저 확인할 자료입니다.`
                  : autoComparison === "fits"
                    ? `${withKoreanParticle(`내 ${axisLabel}(${bandWord})`, "과/와")} 맞을 수 있지만, 실제 상대방이 인정하는지는 따로 확인해야 합니다.`
                    : `내 ${axisLabel}(${bandWord})에 맞는지는 금액·자격·시점 같은 세부 조건에 따라 달라집니다.`}`,
                `Automatic comparison “${autoWord}”: ${autoComparison === "watch"
                  ? `it may strain your ${axisLabel} (${bandWord}), so check it first.`
                  : autoComparison === "fits"
                    ? `it may fit your ${axisLabel} (${bandWord}), but check whether the actual counterpart recognizes it.`
                    : `whether it fits your ${axisLabel} (${bandWord}) depends on details such as amount, eligibility and timing.`}`
              );
    // `reference` is already quoted (e.g. ‘…’ or 비교표 근거 2 ‘…’).
    const makeCheck = (reference: string) => comparisonStatus === "gap"
      ? say(`${withKoreanParticle(reference, "과/와")} 비교해 부족하다고 답한 부분(${note})을 작은 결과물이나 실제 상대방의 피드백으로 확인하세요.`,
          `Check the gap you reported (${note}) against ${reference} with a small work sample or feedback from the actual counterpart.`)
      : comparisonStatus === "matches"
        ? say(`내 근거(${note})가 ${reference} 기준에 맞는지 실제 담당자·고객·기관에 확인하고, 인정되는 범위와 예외를 적어 두세요.`,
            `Ask the actual employer, buyer or institution whether your evidence (${note}) meets ${reference}, and note what counts and what does not.`)
        : comparisonStatus === "not_applicable"
          ? say(`${withKoreanParticle(target, "과/와")} 같은 지역·직무·고객군의 원문 요건을 찾으세요. 제외한 ${withKoreanParticle(reference, "은/는")} 목표 요건으로 쓰지 마세요.`,
              `Find original requirements for ${target} in the same region, role or customer group. Do not use the excluded ${reference} as a target requirement.`)
          : say(`${withKoreanParticle(reference, "이/가")} ${target}에도 맞는 기준인지 원문에서 확인하세요. 그다음 내 성과·비용·실제 반응과 하나씩 비교하세요.`,
              `Check in the original source whether ${reference} applies to ${target}. Then compare it point by point with your results, costs and actual responses.`);
    const scopedCheck = makeCheck(quoted);
    const testReference = makeCheck(say(`비교표 근거 ${id + 1} ${quoted}`, `comparison-table item ${id + 1} (${quoted})`));
    const check = demo
      ? say(
          `${quoted}에 해당하는 실제 공개 자료를 찾아, ${withKoreanParticle(targetScope, "과/와")} 지금 내 조건에도 맞는지 확인하세요.`,
          `Find actual public evidence for ${quoted} and check that it fits the ${targetScope} and your current conditions.`
        )
      : scopedCheck;
    linkReadings.set(id, { comparison: comparisonReading, scope: implication });
    return {
      id,
      conditionGroup,
      sourceFact: block.fact,
      sourceScope: block.whyItMatters,
      sourceUrl: block.sourceUrl,
      sourceDate: block.sourceDate,
      conditionProvenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
      condition,
      comparisonKey,
      comparisonStatus,
      comparisonLabel,
      autoComparison,
      comparisonDetail: comparison?.detail ?? "",
      customerEvidence,
      comparisonReading,
      testReference: demo ? say(`${withKoreanParticle(`비교표 근거 ${id + 1}`, "은/는")} 합성 예시입니다. 같은 조건의 실제 원문부터 확인하세요.`,
        `Comparison-table item ${id + 1} is synthetic. Find an actual original source for the same condition first.`) : testReference,
      ...(linkedSelfReport ? { selfReport: linkedSelfReport } : {}),
      // At most three short sentences: the comparison, the source's scope, and how it meets your condition.
      interpretation: `${comparisonReading} ${implication} ${v2FirstSentence(personal)}`,
      unresolved: say(
        `이 공개 자료가 ${targetScope}에 적용되는지, ${withKoreanParticle(personalUnknown, "이/가")} 갖춰졌는지는 아직 확인되지 않았습니다.`,
        `Whether this applies to the ${targetScope}, and ${personalUnknown}, are not yet confirmed.`
      ),
      test: check,
    };
  });
  // Link only dimensions that directly inform a named comparison. A market
  // statistic is never treated as proof of personal readiness or recovery.
  const relatedEvidence = (finding: "recovery" | "fit" | "capacity") =>
    evidenceLinks.filter(link => link.comparisonStatus !== "not_applicable" &&
      link.conditionGroup === ({ recovery: "finance", fit: "readiness", capacity: "capacity" } as const)[finding])
      .map(link => link.id);
  const applicableLinks = evidenceLinks.filter(link => link.comparisonStatus !== "not_applicable");
  // First item to look at: the customer's own gap, then a caution that touches their own
  // conditions, then a topic they picked; a general market statistic comes last (audit M6).
  const personal = applicableLinks.filter(link => link.conditionGroup !== "public");
  const picked = (link: V2EvidenceLink) => state.externalAreas.includes(v2EvidenceArea(blocks[link.id], state) as never);
  const priorityLink = applicableLinks.find(link => link.comparisonStatus === "gap") ??
    personal.find(link => link.comparisonStatus === "unreviewed" && link.autoComparison === "watch") ??
    personal.find(link => blocks[link.id].direction === "caution" && picked(link)) ??
    personal.find(link => blocks[link.id].direction === "caution") ??
    applicableLinks.find(picked) ?? personal[0] ?? applicableLinks[0];
  const priorityEvidence = priorityLink
    ? {
        headline: v2CustomerEvidenceText(
          state.language,
          blocks[priorityLink.id].headline
        ),
        condition: priorityLink.condition,
        check: priorityLink.test,
        nextCheck: priorityLink.test,
      }
    : null;
  const externalReading =
    live || demo
      ? v2CustomerEvidenceText(state.language, intelligence.implication)
      : phase === "loading"
        ? say(
            "공개 자료를 확인하고 있습니다. 끝나면 아래 판단 근거와 확인 계획에 같은 자료를 연결합니다.",
            "Public research is in progress. The same snapshot will inform the reasoning and experiment plan when it finishes."
          )
        : say(
            "공개 근거를 아직 확보하지 못해 목표 경로의 요건과 외부 환경은 확인되지 않았습니다. 아래 내용은 지금 입력한 조건으로 본 분석이며, 외부 근거로 확인한 분석은 아닙니다.",
            "Without public evidence, target requirements and external conditions remain unresolved. This is a structural reading of current conditions, not an externally informed analysis."
          );
  const findings: V2Finding[] = [
    {
      id: "recovery",
      title: say(
        "가능성보다 먼저 확인할 버틸 여유",
        "Room to absorb a setback comes first"
      ),
      basis: `${t("financial")}: ${t(money)} · ${t("reversibility")}: ${t(reverse)} · ${t("downside")}: ${t(risk)}`,
      implication: safetyReading,
      coreReading: safetyReading,
      evidenceIds: relatedEvidence("recovery"),
      provenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
      selfReports: reports("financial", "recovery"),
    },
    {
      id: "fit",
      title: say(
        "활동을 성과로 연결하는 조건",
        "Turning activity into recognized evidence"
      ),
      basis: `${t("readinessBand")}: ${t(ready)} · ${t("supportBand")}: ${t(support)}`,
      implication: `${readinessReading} ${text(profile.question)}`,
      coreReading: `${readinessReading} ${text(profile.question)}`,
      evidenceIds: relatedEvidence("fit"),
      provenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
      selfReports: reports("public", "readiness"),
    },
    {
      id: "capacity",
      title: say(
        "준비가 좋아져도 남는 실행 부담",
        "Execution pressure beyond readiness"
      ),
      basis: `${t("constraint")}: ${t(load)} · ${t("supportBand")}: ${t(support)}`,
      implication: capacityReading,
      coreReading: capacityReading,
      evidenceIds: relatedEvidence("capacity"),
      provenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
      selfReports: reports("capacity"),
    },
  ];
  // Fact-specific comparisons alter narrative reasoning, never the core bands.
  // The finding already states the personal reading, so add only the first
  // linked source's scope sentence: short, specific and never repeated.
  for (const finding of findings) {
    const links = finding.evidenceIds.map(id => evidenceLinks[id]);
    if (links.length) {
      const first = links[0];
      const reading = linkReadings.get(first.id);
      const added = [first.comparisonStatus === "unreviewed" ? "" : reading?.comparison ?? "", reading?.scope ?? ""];
      for (const sentence of added)
        if (sentence && !finding.implication.includes(sentence)) finding.implication += ` ${sentence}`;
      finding.provenance.push("EXTERNAL_EVIDENCE");
    }
  }
  // Every topic actually researched: the customer's picks plus the case's standard topics.
  // A topic still loading, or never searched, is not "no evidence" (audit M5).
  const pendingAreas = new Set((intelligence as { pendingAreas?: string[] }).pendingAreas ?? []);
  const searched = live || demo;
  const researchCoverage = v2SituationalAreas(state).map(area => {
    const evidenceIds = blocks.flatMap((block, id) => v2EvidenceArea(block, state) === area ? [id] : []);
    const status: "found" | "none" | "pending" | "not_searched" = evidenceIds.length ? "found"
      : pendingAreas.has(area) ? "pending" : searched ? "none" : "not_searched";
    return { area, title: t(area as V2CopyKey), evidenceIds, status };
  });
  const uncovered = researchCoverage.filter(item => item.status === "none").map(item => item.title);
  const pendingTitles = researchCoverage.filter(item => item.status === "pending").map(item => item.title);
  const coverageReading = !searched ? say(
    "아직 공개 자료를 찾지 않았습니다. 지금 판단은 답한 내용만으로 계산했습니다.",
    "Public sources have not been searched yet. This reading uses your answers only."
  ) : pendingTitles.length && !uncovered.length ? say(
    `${pendingTitles.join(" · ")} 자료는 아직 찾는 중입니다. 도착하면 이 내용도 바뀝니다.`,
    `Still collecting: ${pendingTitles.join(", ")}. This will update when they arrive.`
  ) : uncovered.length ? say(
    `검색한 항목 중 ${uncovered.join(" · ")}에 대응하는 공개 근거는 없습니다. 이 조건은 아직 확인되지 않은 것으로 보세요.`,
    `No public material was found for: ${uncovered.join(", ")}. Treat these conditions as not yet established.`
  ) : say("선택한 검색 항목마다 공개 자료를 찾았습니다. 다만 그 내용이 내 목표와 내 조건에도 맞는지는 따로 비교해야 합니다.",
    "Public material was found for each selected research topic. Whether it fits your target and your situation still needs a separate comparison.");
  const factorNames: Record<keyof ProductApplicationV3["decisionStructure"]["fifwm"], Pair> = {
    formal: ["기회의 조건", "Opportunity conditions"],
    informal: ["연결 가능성", "Connection potential"],
    framework: ["구조 적합성", "Structural fit"],
    workflow: ["실행 현실성", "Execution reality"],
    marketPolicy: ["버틸 수 있는가", "Can this endure?"],
  };
  // Canonical Q18–Q22 topics are assessment inputs, not dimension names.
  const factorQuestionTopics: Record<keyof typeof factorNames, Pair> = {
    formal: ["이번 평가 질문: 의사결정·보고 체계", "Question used: decision and reporting lines"],
    informal: ["이번 평가 질문: 목표 팀의 적극적 지원", "Question used: active support in the target team"],
    framework: ["이번 평가 질문: 조직 개편·리더십 변화", "Question used: restructuring and leadership change"],
    workflow: ["이번 평가 질문: 목표 직무의 업무 흐름", "Question used: target-role workflow"],
    marketPolicy: ["이번 평가 질문: 정책·규제·시장 변화의 영향", "Question used: effect of policy, regulatory and market change"],
  };
  const factors = (Object.keys(factorNames) as (keyof typeof factorNames)[]).map(
    id => ({
      id,
      title: text(factorNames[id]),
      questionTopic: v2CanAskCanonicalFifwm(state.caseType) ? text(factorQuestionTopics[id]) : "",
      assessed: core.decisionStructure.fifwm[id].score !== null,
      evidenceIds: [],
      status: core.decisionStructure.fifwm[id].score === null
        ? say("미확인", "Not established")
        : (["■□□", "■■□", "■■■"] as const)[core.decisionStructure.fifwm[id].score],
      reading: core.decisionStructure.fifwm[id].score === null
        ? say(
            "기존 평가에 필요한 입력이 없어 이 항목은 아직 평가되지 않았습니다.",
            "This item has not been assessed because the required inputs are unavailable."
          )
        : core.decisionStructure.fifwm[id].reading,
    })
  );
  const strength = (band: string) =>
    band === "strong"
      ? 3
      : band === "developing"
        ? 2
        : band === "weak"
          ? 1
          : null;
  const safety = [
    {
      id: "financialRoom",
      title: t("financial"),
      band: money,
      level: strength(money),
      reading:
        money === "weak"
          ? say(
              "준비 비용과 소득 공백이 생활을 압박할 수 있습니다. 감당할 수 있는 지출 한도를 먼저 정하세요.",
              "Preparation costs and an income gap may strain your living costs. Set a spending limit you can afford first."
            )
          : money === "unknown"
            ? say(
                "소득 공백과 준비 비용을 어디까지 감당할 수 있는지 아직 확인되지 않았습니다.",
                "How far you can cover an income gap and preparation costs is not yet established."
              )
            : say(
                "지금 여유가 실제 총비용과 다시 일어서는 데 드는 비용까지 감당하는지 확인하세요.",
                "Check whether your current room covers the total cost, including what it would take to recover."
              ),
    },
    {
      id: "reversibility",
      title: t("reversibility"),
      band: reverse,
      level: strength(reverse),
      reading:
        reverse === "weak"
          ? say(
              "약속을 늘리면 되돌아오기 어려울 수 있습니다. 해지·재진입 조건을 먼저 확인하세요.",
              "Further commitments may be hard to reverse. Establish exit and re-entry terms first."
            )
          : reverse === "unknown"
            ? say(
                "복귀에 필요한 시간·비용·경로가 확인되지 않았습니다.",
                "The time, cost and route for returning are unresolved."
              )
            : say(
                "가능하다고 보는 복귀 경로가 실제로 열려 있는지 확인하세요.",
                "Verify that the assumed return route is actually available."
              ),
    },
    {
      id: "downsideExposure",
      title: t("downside"),
      band: risk,
      level:
        risk === "low"
          ? 3
          : risk === "moderate"
            ? 2
            : risk === "high"
              ? 1
              : null,
      reading:
        risk === "high"
          ? say(
              "계획이 틀렸을 때 잃을 수 있는 것이 큽니다. 결과를 확인하기 전에는 되돌리기 어려운 지출과 결정을 줄이세요.",
              "You could lose a lot if the plan goes wrong. Until results are in, cut back on spending and decisions you cannot undo."
            )
          : risk === "unknown"
            ? say(
                "실패 시 잃는 소득·시간·복귀 선택지를 아직 구분하지 못했습니다.",
                "Income, time and return options at risk have not been established."
              )
            : say(
                "이 위험 수준은 지금의 가정입니다. 실제 계약·비용·일정으로 다시 확인하세요.",
                "This risk level reflects current assumptions. Check it against actual contracts, costs and schedules."
              ),
    },
  ];
  // Customer-language Changing (owner feedback round 4): every field is a
  // sentence built from this customer's inputs and evidence, not a label.
  // The engine still decides which plays apply; only the wording changes.
  const current = v2CustomerInput(state.language, state.optionA, say("현재 직무", "the current role")).text;
  const considered = v2CustomerInput(state.language, state.optionB, say("고민하는 커리어", "the considered career")).text;
  const missingPoint = v2MissingPoint(state.caseType, state.language);
  const firstAction = blocks.find(block => block.action)?.action;
  const amountCard = blocks.find(block => /(?:HK\$|US\$|£|€|\$|₩)\s?\d|\d[\d,.]*\s?(?:원|만 ?원|파운드|달러|유로)/.test(`${block.headline} ${block.fact}`));
  const routeCards = blocks.filter(block => /원격|시간제|파트타임|병행|주말|온라인|단계적|remote|part-time|online|weekend|phased/i.test(`${block.headline} ${block.fact}`));
  const bandText = (key: keyof typeof b) => t(b[key].band as V2CopyKey);
  const review = say(
    "30일에 첫 결과를 확인하고, 60일에 계속·축소·중단을 정한 뒤, 90일에 전체 판단을 다시 봅니다.",
    "Check first results at 30 days, decide continue / narrow / stop at 60, and review the whole reading at 90."
  );
  const protectLine = say(
    `지금 지키려는 것: ${protectedBase}. 새 경로를 확인하는 동안에도 이것은 흔들리지 않게 합니다.`,
    `What you are protecting: ${protectedBase}. Keep it steady while you check the new path.`
  );
  const playCopy: Record<string, { changes: string; needs: string; evidence: string; exposure: string }> = {
    "parallel-validation": {
      changes: say(`${withKoreanParticle(current, "을/를")} 그만두지 않고, ${considered}에 필요한 조건을 작은 단계로 하나씩 확인합니다.`,
        `Keep ${current} and check what ${considered} requires in small steps, one at a time.`),
      needs: say(`${withKoreanParticle(`‘${missingPoint.point}’`, "을/를")} 보여 줄 실제 근거 1개 이상${firstAction ? `. 예: ${v2CustomerEvidenceText(state.language, firstAction)}` : ""}`,
        `At least one real piece of evidence for “${missingPoint.point}”${firstAction ? `. For example: ${firstAction}` : ""}`),
      evidence: say(`${withKoreanParticle(`‘${missingPoint.point}’`, "이/가")} ${considered}에서도 통하는지 보여 줄 자료·응답·제안. ${missingPoint.why}`,
        `Documents, responses or offers showing whether “${missingPoint.point}” holds for ${considered}. ${missingPoint.why}`),
      exposure: say("확인하는 동안 쓸 주당 시간과 총비용의 한도를 먼저 정하고, 그 안에서만 움직입니다.",
        "Set a weekly time limit and a total cost limit first, and stay inside them."),
    },
    resource: {
      changes: say(`${considered} 쪽 투입을 늘리기 전에, 안전 여유(지금 ${bandText("safetyMargin")})와 일이 틀어져도 버틸 여유를 먼저 늘립니다.`,
        `Before committing more to ${considered}, build up your safety margin (now ${bandText("safetyMargin")}) and your room to absorb a setback.`),
      needs: say(`준비 기간 동안 필요한 생활비와 비용의 실제 금액${amountCard ? `. 참고 기준: ${v2CustomerEvidenceText(state.language, amountCard.headline)}` : ""}`,
        `The actual living costs and expenses for the preparation period${amountCard ? `. Reference: ${amountCard.headline}` : ""}`),
      evidence: say("늘린 여유로 몇 개월을 버틸 수 있는지 계산한 결과", "A calculation of how many months the added room covers"),
      exposure: say("되돌릴 수 없는 지출이나 퇴사 같은 결정은 아직 하지 않습니다.", "No irreversible spending or resignation yet."),
    },
    timing: {
      changes: say(`옮길 날짜를 먼저 정하지 않고, 돌아올 길(지금 ${bandText("reversibility")})을 확인한 뒤 시점을 정합니다.`,
        `Do not fix a date first; set the timing once a way back (now ${bandText("reversibility")}) is confirmed.`),
      needs: say("되돌아올 수 있는 경로 — 예: 휴직·복직 제도, 재지원 가능 여부, 계약 조건", "A confirmed way back — e.g. leave and return policy, re-application, contract terms"),
      evidence: say("복귀 조건과 기한을 확인한 기록", "A record of return conditions and deadlines"),
      exposure: say("돌아올 길이 확인될 때까지는 되돌릴 수 있는 일만 합니다.", "Until the way back is confirmed, do only what can be undone."),
    },
    pathway: {
      changes: say(`${withKoreanParticle(considered, "으로/로")} 바로 옮기지 않고, 중간 경로${routeCards.length ? `(${routeCards.slice(0, 2).map(card => v2CustomerEvidenceText(state.language, card.headline)).join(" · ")})` : "(시간제·병행·단계적 과정)"}로 먼저 근거를 만듭니다.`,
        `Do not move straight to ${considered}; build evidence through an intermediate route${routeCards.length ? ` (${routeCards.slice(0, 2).map(card => card.headline).join(" · ")})` : " (part-time, combined or phased)"} first.`),
      needs: say("중간 경로의 참여 요건, 일정, 비용", "The intermediate route's requirements, schedule and cost"),
      evidence: say(`중간 경로에서 얻은 결과가 ${considered}의 요건을 채우는지`, `Whether results from the intermediate route meet ${considered}'s requirements`),
      exposure: say("중간 경로 한 번에 드는 시간·비용 범위 안에서만 진행합니다.", "Only within the time and cost of one intermediate step."),
    },
    "role-scope": {
      changes: say(`${withKoreanParticle(current, "을/를")} 떠나기 전에, 지금 조직 안에서 역할과 범위를 바꿀 수 있는지 먼저 확인합니다.`,
        `Before leaving ${current}, check whether the role and scope can change inside the current organization.`),
      needs: say("구체적인 역할·범위 조정 제안서 1개", "One concrete proposal for a role or scope change"),
      evidence: say("조직의 답변(수용·거절·조건부)과 그 조건", "The organization's answer (yes, no, conditional) and its terms"),
      exposure: say("한 번의 내부 협의 기간 안에서만 진행합니다.", "Within one internal decision cycle."),
    },
  };
  const plays = core.changingPlays.map(play => {
    const copy = playCopy[play.family];
    return {
      family: play.family,
      title: v2CustomerPlayText(state.language, play.title),
      move: v2CustomerPlayText(state.language, play.move),
      changes: copy?.changes ?? v2CustomerPlayText(state.language, play.changes),
      protects: protectLine,
      needs: copy?.needs ?? v2CustomerPlayText(state.language, play.needs),
      evidence: copy?.evidence ?? v2CustomerPlayText(state.language, play.evidence),
      exposure: copy?.exposure ?? v2CustomerPlayText(state.language, play.exposure),
      timeExposure: review,
    };
  });
  // The priority item is named by its headline (its title), or the fact's first clause when there is none.
  const priorityQuote = priorityLink ? v2BriefQuote("", priorityEvidence?.headline || v2CustomerEvidenceText(state.language, blocks[priorityLink.id].fact), ko) : "";
  const continueCondition = `${text(profile.advance)}${priorityEvidence ? say(`, 그리고 ${withKoreanParticle(`‘${priorityQuote}’`, "이/가")} 내 목표에도 맞는지 확인했을 때`, `, and once you have confirmed whether “${priorityQuote}” applies to your target`) : ""}${ko ? " 다음 단계를 검토하세요." : ", consider the next step."}`;
  const pause = say(
    "새 경로를 확인하느라 지키려던 소득·시간·생활이 흔들리거나, 만든 결과물이 목표 요건과 이어지지 않으면 범위를 줄이고 계획을 다시 세우세요.",
    "If checking the new path starts to shake the income, time or daily life you are protecting, or your work sample does not connect to the target requirements, scale back and re-plan."
  );
  const posture = v2CustomerPosture(
    state.language,
    core.currentStructuralPosture.label,
    core.currentStructuralPosture.sentence,
    v2CustomerInput(state.language, state.optionA, "your current role").text,
    v2CustomerInput(state.language, state.optionB, "the career you are considering").text
  ).label;
  const sourceCount = new Set(blocks.map(block => block.sourceUrl ?? block.sourceLabel)).size;
  const evidenceSummary = live
    ? say(
        ` 공개 근거 ${blocks.length}건${sourceCount < blocks.length ? `(출처 ${sourceCount}곳)` : ""}을 현재 조건 옆에 표시했습니다. 내 목표에 적용되는지는 출처마다 범위를 비교해 확인하세요.`,
        ` ${blocks.length} public evidence ${blocks.length === 1 ? "item is" : "items are"}${sourceCount < blocks.length ? ` (from ${sourceCount} ${sourceCount === 1 ? "source" : "sources"})` : ""} shown beside your current conditions. Check each source's scope before treating it as applicable to you.`
      )
    : demo
      ? say(
          ` 합성 근거 ${blocks.length}건으로 분석 흐름을 보여 주는 예시입니다. 실제 외부 검색을 수행한 결과가 아닙니다.`,
          ` ${blocks.length} synthetic evidence items illustrate the analysis flow. They are not results of live public research.`
        )
      : say(
          " 외부 요건을 확인하기 전까지는 이 판단을 초안으로 보세요.",
          " Treat this as a structural draft until external requirements are checked."
        );
  const summary = `${safetyReading} ${load === "heavy" ? capacityReading : readinessReading}${evidenceSummary} ${coverageReading}${priorityLink ? ` ${[linkReadings.get(priorityLink.id)?.comparison, linkReadings.get(priorityLink.id)?.scope].filter(Boolean).join(" ")}` : ""}`.trim();
  const executiveSummary = `${safetyReading} ${load === "heavy" ? capacityReading : readinessReading} ${coverageReading}${priorityLink ? say(
    ` 가장 먼저 볼 자료는 ‘${priorityQuote}’입니다 (${priorityLink.comparisonLabel}). 세부 조건과 내 근거의 차이는 비교표에서 확인하세요.`,
    ` The first item to check is “${priorityQuote}” (${priorityLink.comparisonLabel}). The comparison table shows the details and your evidence.`
  ) : ""}`;
  const briefAction = `${priorityLink?.testReference ? `${priorityLink.testReference} ` : ""}${text(profile.action)}`;
  return {
    language: state.language,
    evidenceLanguage,
    fifwmSource: core.decisionStructure.fifwmSource,
    topic: text(profile.topic),
    target,
    posture,
    summary,
    executiveSummary,
    question: text(profile.question),
    missingConcept: v2MissingPoint(state.caseType, state.language).point,
    tradeoff: say(
      `${opening}의 가능성을 넓히려면 시간과 자원이 필요합니다. 핵심은 새 경로에 투입할 자원과 현재 유지할 기반(${protectedBase}) 사이의 균형입니다.`,
      `Opening ${opening} requires time and resources. The key tension is how much to invest while protecting ${protectedBase}.`
    ),
    boundary,
    externalReading,
    findings,
    evidenceLinks,
    researchCoverage,
    externalContextReading: b.externalValidation.source === "live-external-evidence"
      ? say(`공개 외부 맥락: ${t(b.externalValidation.band)}. 확보한 자료로 외부 환경의 조건을 살펴봤습니다. 개인의 자격·구매 반응·실행할 여유는 따로 확인해야 합니다.`,
          `Public external context: ${t(b.externalValidation.band)}. The retrieved material informs external conditions. Personal eligibility, purchases and execution capacity need separate validation.`)
      : say("외부 환경을 종합적으로 판단할 근거는 아직 부족합니다. 지금 확보한 자료의 범위 안에서 조건을 비교하세요.",
          "Evidence for an overall reading of the external environment is still limited. Compare conditions within the scope of the available material."),
    factorScopeNote: v2CaseFifwmSet(state.caseType)
      ? say("이 사례는 원래 조직 평가 대신, 같은 다섯 요소를 이 사례에 맞게 묻는 '사례 맞춤 구조 평가'를 사용합니다. 대상이 구체적일 때 응답한 항목만 평가하며, 모름·해당 없음은 평가하지 않습니다.",
          "This case uses a case-adapted structure assessment: the same five factors asked for this kind of decision instead of the original organization questions. Only answered items are assessed; unsure and not-applicable stay unassessed.")
      : v2CanAskCanonicalFifwm(state.caseType)
      ? say("조직·직무를 아는 경우에만 원본 다섯 질문으로 평가합니다. 확인하지 않은 항목은 평가하지 않습니다.",
          "The original five questions assess a known organization and role. Unestablished items remain unassessed.")
      : say("이 사례에는 원본 조직·직무 질문을 그대로 적용할 수 없어 다섯 항목을 평가하지 않았습니다. 준비 상태와 안전 여유의 입력으로 대신 점수를 만들지 않습니다.",
          "The original organization and role questions do not apply directly to this case, so the five factors are unassessed. Readiness and Safety Margin inputs do not create substitute scores."),
    situation: v2KeyFactReadings(state.caseType, state.keyFacts ?? {}, ko),
    switching: core.decisionSwitches.map(item => ({
      signal: v2CustomerPlayText(state.language, item.signal),
      direction: v2CustomerPlayText(state.language, item.direction),
    })),
    priorityEvidence,
    factors,
    safety,
    plays,
    experiment: {
      action: `${priorityEvidence ? `${priorityEvidence.nextCheck} ` : ""}${uncovered.length ? `${coverageReading} ` : ""}${text(profile.action)}`,
      briefAction,
      output: priorityLink ? say(
        `${withKoreanParticle(`‘${priorityQuote}’`, "이/가")} 내 목표에 맞는지, 내 근거와 남은 조건을 비교한 기록`,
        `A record of whether “${priorityQuote}” fits your target, your evidence and the remaining gaps`
      ) : text(profile.output),
      continue: continueCondition,
      pause,
      stages: [
        {
          day: "30",
          title: say(
            "목표 요건과 현재 성과 비교",
            "Compare requirements with current evidence"
          ),
          action: `${priorityEvidence?.nextCheck ?? text(profile.action)} ${coverageReading}`,
          briefAction: `${priorityLink?.testReference ?? text(profile.action)} ${coverageReading}`,
          output: text(profile.output),
        },
        {
          day: "60",
          title: say(
            "작은 실행으로 실제 부담 확인",
            "Test actual workload at a small scope"
          ),
          action: say(
            "확인된 핵심 요건 하나를 작게 실행해 보고 시간·비용·피드백을 기록하세요. 공개 자료와 실제 반응이 다르면 그 차이를 적어 두세요.",
            "Try one confirmed key requirement at a small scale and record time, cost and feedback. Note any difference between public evidence and actual responses."
          ),
          output: say(
            "투입 자원, 결과물, 외부 피드백을 연결한 실행 기록",
            "A record linking resources, deliverables and external feedback"
          ),
        },
        {
          day: "90",
          title: say(
            "전환 조건과 버틸 여유 다시 보기",
            "Review switching conditions and room to absorb a setback"
          ),
          action: `${continueCondition} ${pause}`,
          output: say(
            "확인한 조건, 남은 제약, 다음 단계의 범위와 중단 기준",
            "Established conditions, remaining constraints, next-step scope and stop criteria"
          ),
        },
      ],
    },
  };
}
