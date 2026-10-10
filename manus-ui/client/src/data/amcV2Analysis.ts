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
import { v2CustomerPosture } from "./v2ReportPresentation";
import { v2t, type V2CopyKey } from "./v2Language";

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
      "하나의 고객군과 유료 제안으로 작은 판매 실험을 진행하세요. 기존 해결 방식과 비교하고 거절 이유를 기록하세요.",
      "Test one paid offer with one customer segment. Compare it with the current workaround and record refusals.",
    ],
    output: [
      "유료 반응, 반복 구매 여부, 제공 비용을 정리한 실험 기록",
      "A record of paid responses, repeat purchases and delivery costs",
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
      "목표 직무의 공고와 기존 성과를 항목별로 대조하고, 부족한 요건을 보여줄 작은 결과물을 만드세요. 현업 담당자에게 구체적인 피드백을 받으세요.",
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
      "역할 범위와 성공 기준을 문서로 확인하고, 제한된 업무에서 필요한 지원과 실제 부담을 시험하세요.",
      "Confirm scope and success criteria in writing. Test support and workload through a bounded responsibility.",
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
      "회복을 위한 업무량·일정·지원 조정을 먼저 시험하고 부담 변화를 기록하세요. 회복 자원을 소모하지 않는 범위에서 대안을 비교하세요.",
      "Test workload, schedule and support changes and record their effects. Compare alternatives within recovery capacity.",
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
      "새 경로의 요건을 현재 기반을 유지하면서 시험할 수 있을까요?",
      "Can the new path's requirements be tested while preserving the current base?",
    ],
    action: [
      "새 경로에 필요한 요건과 현재 성과를 비교하고, 가장 중요한 부족 조건 하나를 작은 결과물과 현업 피드백으로 확인하세요.",
      "Compare new-path requirements with current achievements. Test the most important gap with a small work sample and practitioner feedback.",
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
    "목표 대학의 임용 공고에서 학위·경력·연구·강의 요건을 구분하고 기존 성과와 대조하세요. 학회 참가비를 지출하기 전 연구 결과물이나 강의안을 담당자에게 검토받으세요.",
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
  if (state.publicSearchTarget !== undefined) return state.publicSearchTarget;
  if (isV2AcademicCase(state))
    return state.language === "ko"
      ? "겸임교수 임용 자격 연구 실적 강의 경력 요건"
      : "Adjunct faculty appointment research teaching and qualification requirements";
  return state.optionB.trim().slice(0, 120);
}
export type V2Finding = {
  id: string;
  title: string;
  basis: string;
  implication: string;
  evidenceIds: number[];
  provenance: V2Provenance[];
};
export type V2EvidenceLink = {
  id: number;
  factor: "formal" | "informal" | "framework" | "workflow" | "marketPolicy";
  condition: string;
  interpretation: string;
  test: string;
};
export type V2Analysis = {
  language: V2State["language"];
  topic: string;
  posture: string;
  summary: string;
  question: string;
  missingConcept: string;
  tradeoff: string;
  boundary: string;
  externalReading: string;
  findings: V2Finding[];
  evidenceLinks: V2EvidenceLink[];
  factors: Array<{
    id: V2EvidenceLink["factor"];
    title: string;
    reading: string;
    evidenceIds: number[];
    status: string;
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
    protects: string;
    needs: string;
    evidence: string;
  }>;
  experiment: {
    action: string;
    output: string;
    continue: string;
    pause: string;
    stages: Array<{
      day: string;
      title: string;
      action: string;
      output: string;
    }>;
  };
};

/** Non-scored interpretation of actual engine bands plus the immutable public-evidence snapshot.
 * It does not manufacture canonical FIFWM scores or upgrade personal fit from a public source. */
export function buildV2Analysis(
  state: V2State,
  core: ProductApplicationV3,
  intelligence: ExternalIntelligenceV2,
  phase: V2EvidencePhase = intelligence.status
): V2Analysis {
  const ko = state.language === "ko",
    say = (koText: string, enText: string) => (ko ? koText : enText);
  const text = (p: Pair) => p[ko ? 0 : 1],
    t = (k: V2CopyKey) => v2t(state.language, k);
  const profile = isV2AcademicCase(state)
    ? academic
    : (profiles[state.caseType] ?? profiles["General Career Reconfiguration"]);
  const b = core.postureBasis,
    s = core.safetyMargin.inputs;
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
  const protectedBase = state.protects.length
    ? state.protects.map(t).join(" · ")
    : say("현재의 소득과 생활 기반", "current income and living capacity");
  const opening = state.opens.length
    ? state.opens.map(t).join(" · ")
    : text(profile.topic);
  const boundary = constrained
    ? say(
        `유지할 기반은 ${protectedBase}입니다. 지출·투입 시간·중단 시점을 먼저 정하고, 회복 자원을 남기는 범위에서 시험하세요.`,
        `Protect ${protectedBase}. Set spending, time and stop limits before testing, and retain resources for recovery.`
      )
    : reverse === "unknown"
      ? say(
          `유지할 기반은 ${protectedBase}입니다. 원래 경로로 돌아오는 데 필요한 비용·시간을 확인하기 전에는 되돌리기 어려운 약속을 늘리지 마세요.`,
          `Protect ${protectedBase}. Establish the cost and time of returning before increasing irreversible commitments.`
        )
      : say(
          `유지할 기반은 ${protectedBase}입니다. 확인된 회복 여력 안에서 시험 범위를 정하고, 다음 단계 전에 비용과 복귀 조건을 다시 확인하세요.`,
          `Protect ${protectedBase}. Bound the test by demonstrated recovery capacity, and recheck costs and return conditions before the next step.`
        );
  const safetyReading = constrained
    ? say(
        "현재 자원으로는 계획이 틀렸을 때 회복할 여유가 부족합니다. 새 경로의 가능성과 별개로, 먼저 시험 범위를 줄여야 합니다.",
        "Current resources leave limited room to recover if the plan fails. The test needs a smaller scope even if the new path looks promising."
      )
    : core.safetyMargin.band === "unknown"
      ? say(
          "회복 가능성을 판단할 정보가 부족합니다. 가능성이 높아 보이는 것과 실패를 감당할 수 있는 것은 별도 조건입니다.",
          "Recovery capacity is unresolved. A promising opportunity and the ability to absorb failure are separate conditions."
        )
      : say(
          "일부 회복 여력은 있지만, 그 여력이 실제 실행 비용과 복귀 조건까지 감당하는지 확인해야 합니다.",
          "Some recovery capacity is present; verify that it covers actual execution costs and return conditions."
        );
  const readinessReading =
    ready === "weak"
      ? say(
          "희망 경로와 준비 상태 사이에 간격이 있습니다. 활동량을 늘리기보다 목표 요건을 충족하는 결과물 하나를 먼저 만드는 편이 검증에 도움이 됩니다.",
          "There is a gap between the target path and current readiness. A work sample addressing a target requirement tests more than simply increasing activity."
        )
      : ready === "unknown"
        ? say(
            "준비 상태가 확인되지 않았습니다. 목표 요건과 기존 성과를 비교해 충족 조건과 부족 조건을 구분해야 합니다.",
            "Readiness is unresolved. Compare target requirements with achievements to separate demonstrated fit from gaps."
          )
        : say(
            "기존 준비를 목표 경로에서 인정받는 근거로 연결해야 합니다. 자기 평가만으로 실제 접근 가능성을 확정할 수는 없습니다.",
            "Connect existing preparation to evidence recognized by the target path. Self-assessment alone does not establish actual access."
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
            "실행을 뒷받침할 조건이 일부 갖춰져 있습니다. 실제로 확보한 일정과 지원을 작은 시험에서 확인하고 추가 약속을 결정하세요.",
            "Some execution support is present. Test actual schedule and support commitments before adding further obligations."
          );
  const factorFor = (dimension: string): V2EvidenceLink["factor"] => {
    if (
      /compensation|pricing|funding|market|competition|industry|보상|가격|재원|시장|경쟁|산업/i.test(
        dimension
      )
    )
      return "marketPolicy";
    if (
      /distribution|opportunity.cost|geography|mobility|고객 확보|기회비용|지역|이동/i.test(
        dimension
      )
    )
      return "workflow";
    if (/demand|relevance|수요|관련성/i.test(dimension)) return "framework";
    return "formal";
  };
  const evidenceLinks: V2EvidenceLink[] = blocks.map((block, id) => {
    const factor = factorFor(block.dimension);
    const condition =
      factor === "marketPolicy"
        ? say(
            `재정 여력: ${t(money)} / 손실 위험: ${t(risk)}`,
            `Financial room: ${t(money)} / downside: ${t(risk)}`
          )
        : factor === "workflow"
          ? say(
              `제약 부담: ${t(load)} / 복귀 가능성: ${t(reverse)}`,
              `Constraints: ${t(load)} / reversibility: ${t(reverse)}`
            )
          : say(
              `준비 상태: ${t(ready)} / 지원 기반: ${t(support)}`,
              `Readiness: ${t(ready)} / support: ${t(support)}`
            );
    const implication =
      block.direction === "caution"
        ? say(
            "이 출처에서 지적한 제한을 목표 경로의 요건·비용표에 반영해야 합니다.",
            "Carry this source's limitation into the target requirements and cost comparison."
          )
        : block.direction === "supportive"
          ? say(
              "경로를 탐색할 근거는 있으나, 본인의 자격·성과와 실행 여력이 성립하는지 별도 확인이 필요합니다.",
              "This supports exploring the path, while personal eligibility, work evidence and execution capacity still require validation."
            )
          : say(
              "근거의 적용 범위가 제한적입니다. 목표 기관·직무·지역에 같은 조건이 적용되는지 확인해야 합니다.",
              "The evidence has a limited scope. Check whether it applies to the target institution, role and location."
            );
    const personal =
      factor === "marketPolicy"
        ? safetyReading
        : factor === "workflow"
          ? capacityReading
          : readinessReading;
    return {
      id,
      factor,
      condition,
      interpretation: `${implication} ${personal}`,
      test: factor === "marketPolicy" ? boundary : text(profile.action),
    };
  });
  const externalReading =
    live || demo
      ? v2CustomerEvidenceText(state.language, intelligence.implication)
      : phase === "loading"
        ? say(
            "공개 자료를 확인하고 있습니다. 완료되면 아래 판단 근거와 실험 계획에 같은 근거를 연결합니다.",
            "Public research is in progress. The same snapshot will inform the reasoning and experiment plan when it finishes."
          )
        : say(
            "공개 근거가 아직 확보되지 않아 목표 경로의 요건과 외부 환경은 미확인 상태입니다. 아래 내용은 현재 조건에 따른 구조 분석이며, 외부 근거를 확인한 분석으로 볼 수 없습니다.",
            "Without public evidence, target requirements and external conditions remain unresolved. This is a structural reading of current conditions, not an externally informed analysis."
          );
  const findings: V2Finding[] = [
    {
      id: "recovery",
      title: say(
        "가능성보다 먼저 확인할 회복 여력",
        "Recovery capacity before commitment"
      ),
      basis: `${t("financial")}: ${t(money)} · ${t("reversibility")}: ${t(reverse)} · ${t("downside")}: ${t(risk)}`,
      implication: safetyReading,
      evidenceIds: evidenceLinks
        .filter(e => e.factor === "marketPolicy")
        .map(e => e.id),
      provenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
    },
    {
      id: "fit",
      title: say(
        "활동을 성과로 연결하는 조건",
        "Turning activity into recognized evidence"
      ),
      basis: `${t("readinessBand")}: ${t(ready)} · ${t("supportBand")}: ${t(support)}`,
      implication: `${readinessReading} ${text(profile.question)}`,
      evidenceIds: evidenceLinks
        .filter(e => e.factor === "formal" || e.factor === "framework")
        .map(e => e.id),
      provenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
    },
    {
      id: "capacity",
      title: say(
        "준비가 좋아져도 남는 실행 부담",
        "Execution pressure beyond readiness"
      ),
      basis: `${t("constraint")}: ${t(load)} · ${t("supportBand")}: ${t(support)}`,
      implication: capacityReading,
      evidenceIds: evidenceLinks
        .filter(e => e.factor === "workflow")
        .map(e => e.id),
      provenance: ["USER_STRUCTURED", "DERIVED_CORE_RULE"],
    },
  ];
  findings.forEach(f => {
    if (f.evidenceIds.length) f.provenance.push("EXTERNAL_EVIDENCE");
  });
  const factorNames: Record<V2EvidenceLink["factor"], Pair> = {
    formal: ["기회의 조건", "Opportunity requirements"],
    informal: ["연결 가능성", "Access and support"],
    framework: ["구조 적합성", "Structural fit"],
    workflow: ["실행 현실성", "Execution feasibility"],
    marketPolicy: ["버틸 수 있는가", "Capacity to withstand pressure"],
  };
  const factors = (Object.keys(factorNames) as V2EvidenceLink["factor"][]).map(
    id => ({
      id,
      title: text(factorNames[id]),
      evidenceIds: evidenceLinks.filter(e => e.factor === id).map(e => e.id),
      status:
        id === "formal"
          ? say(
              blocks.length ? "요건 대조 필요" : "외부 요건 미확인",
              blocks.length
                ? "Requirements need comparison"
                : "Requirements unresolved"
            )
          : id === "informal"
            ? t(support)
            : id === "framework"
              ? t(ready)
              : id === "workflow"
                ? t(load)
                : t(core.safetyMargin.band),
      reading:
        id === "formal"
          ? text(profile.question)
          : id === "informal"
            ? say(
                "인맥이나 가족의 존재만으로 접근 경로가 확보되지는 않습니다. 실제 소개·일정·자원 지원을 확인하세요.",
                "Contacts or family alone do not establish access. Confirm actual introductions, schedules and resource commitments."
              )
            : id === "framework"
              ? readinessReading
              : id === "workflow"
                ? capacityReading
                : safetyReading,
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
              "실험비와 소득 공백이 생활 기반을 압박할 수 있습니다. 감당 가능한 지출 한도를 먼저 정하세요.",
              "Test costs and income gaps may pressure the living base. Establish an affordable spending limit first."
            )
          : money === "unknown"
            ? say(
                "소득 공백과 실험비를 감당할 범위가 아직 확인되지 않았습니다.",
                "Capacity to cover an income gap and test costs is unresolved."
              )
            : say(
                "현재 여력이 실제 총비용과 회복 비용까지 포함하는지 대조하세요.",
                "Check whether current room covers total execution and recovery costs."
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
              "계획이 틀렸을 때 감당할 손실이 큽니다. 결과가 확인되기 전에는 노출을 줄이세요.",
              "Potential loss is elevated if the plan fails. Reduce exposure before results are established."
            )
          : risk === "unknown"
            ? say(
                "실패 시 잃는 소득·시간·복귀 선택지를 아직 구분하지 못했습니다.",
                "Income, time and return options at risk have not been established."
              )
            : say(
                "위험 수준은 현재 가정입니다. 실제 계약·비용·일정으로 다시 확인하세요.",
                "The risk band reflects current assumptions. Check it against actual contracts, costs and schedules."
              ),
    },
  ];
  const playText: Record<
    ChangingPlay["family"],
    { title: Pair; move: Pair; needs: Pair }
  > = {
    "parallel-validation": {
      title: [
        "현재 기반을 유지하며 병행 검증",
        "Validate alongside the current path",
      ],
      move: [
        "현재 역할을 유지하면서 목표 요건 하나를 작은 결과물로 시험하세요. 가능성이 확인되기 전에는 전면 이동을 전제로 준비하지 마세요.",
        "Keep the current role while testing one target requirement with a small deliverable. Avoid structuring preparation around a full move before feasibility is demonstrated.",
      ],
      needs: [
        "작은 시험의 범위, 검토 담당자, 결과 확인 날짜",
        "A bounded test, a reviewer and a review date",
      ],
    },
    resource: {
      title: [
        "시간과 비용을 먼저 재배치",
        "Reallocate time and resources first",
      ],
      move: [
        "새 활동을 추가하기 전 줄일 지출·업무·일정을 정하세요. 본업과 생활 기반을 유지한 상태에서 확보한 자원만 시험에 투입하세요.",
        "Identify spending, duties or schedules to reduce before adding activity. Use only resources freed while maintaining the current work and living base.",
      ],
      needs: [
        "지출 상한, 보호할 일정, 실제 지원 분담",
        "A spending limit, protected schedule and actual support responsibilities",
      ],
    },
    "role-scope": {
      title: [
        "역할과 참여 범위를 작게 조정",
        "Narrow the role and participation scope",
      ],
      move: [
        "전체 경로를 한 번에 바꾸기보다 프로젝트·강의·업무의 일부 범위부터 실제 부담과 인정 가능성을 시험하세요.",
        "Test workload and recognition through a bounded project, teaching assignment or responsibility before changing the entire path.",
      ],
      needs: [
        "명확한 역할 범위, 성공 기준, 현재 조직의 합의",
        "Clear scope, success criteria and agreement with the current organization",
      ],
    },
    timing: {
      title: [
        "준비 순서와 재검토 시점을 조정",
        "Change sequencing and review timing",
      ],
      move: [
        "활동의 양을 늘리기보다 먼저 해결해야 할 요건을 정하고, 해당 근거가 확보되는 시점에 다음 약속을 검토하세요.",
        "Sequence the prerequisite requirements and review the next commitment when evidence is available, rather than increasing activity.",
      ],
      needs: [
        "선행 요건, 준비 일정, 다음 결정을 내릴 날짜",
        "Prerequisites, a preparation schedule and the next review date",
      ],
    },
    pathway: {
      title: [
        "같은 목표에 도달하는 다른 경로 비교",
        "Compare alternative routes to the same goal",
      ],
      move: [
        "목표를 유지하면서 더 적은 비용·시간이나 다른 자격 경로로 같은 성과를 만들 수 있는지 비교하세요.",
        "Keep the goal and compare routes that produce equivalent evidence with less cost, less time or different qualifications.",
      ],
      needs: [
        "대체 경로의 실제 요건과 목표 기관의 인정 여부",
        "Actual alternative-route requirements and recognition by the target institution",
      ],
    },
  };
  const plays = core.changingPlays.map(play => ({
    family: play.family,
    title: text(playText[play.family].title),
    move: text(playText[play.family].move),
    protects: protectedBase,
    needs: text(playText[play.family].needs),
    evidence: text(profile.output),
  }));
  const continueCondition = `${text(profile.advance)}${ko ? ", 다음 범위를 검토하세요." : ", review the next scope."}`;
  const pause = say(
    "시험 때문에 보호할 소득·시간·생활 기반이 흔들리거나, 목표 요건과 결과물의 연결이 확인되지 않으면 범위를 줄이고 다시 설계하세요.",
    "Reduce scope and redesign if the test weakens protected income, time or living capacity, or fails to connect the work sample to target requirements."
  );
  const posture = v2CustomerPosture(
    state.language,
    core.currentStructuralPosture.label,
    core.currentStructuralPosture.sentence,
    state.optionA,
    state.optionB
  ).label;
  const summary = `${safetyReading} ${load === "heavy" ? capacityReading : readinessReading}${blocks.length ? say(` 공개 근거 ${blocks.length}건을 목표 요건과 현재 조건에 대조했습니다. 각 근거의 적용 범위와 다음 확인 항목은 아래에 연결했습니다.`, ` ${blocks.length} public evidence items are mapped to target requirements and current conditions below, with applicability limits and next checks.`) : say(" 외부 요건을 확인하기 전까지는 이 판단을 구조 초안으로 사용하세요.", " Treat this as a structural draft until external requirements are checked.")}`;
  return {
    language: state.language,
    topic: text(profile.topic),
    posture,
    summary,
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
    factors,
    safety,
    plays,
    experiment: {
      action: text(profile.action),
      output: text(profile.output),
      continue: continueCondition,
      pause,
      stages: [
        {
          day: "30",
          title: say(
            "목표 요건과 현재 성과 대조",
            "Compare requirements with current evidence"
          ),
          action: text(profile.action),
          output: text(profile.output),
        },
        {
          day: "60",
          title: say(
            "작은 실행으로 실제 부담 확인",
            "Test actual workload at a small scope"
          ),
          action: say(
            "확인된 핵심 요건 하나를 시험하고 시간·비용·피드백을 기록하세요. 공개 자료와 실제 반응이 다르면 그 차이를 남기세요.",
            "Test one verified requirement and record time, cost and feedback. Document differences between public evidence and actual responses."
          ),
          output: say(
            "투입 자원, 결과물, 외부 피드백을 연결한 실행 기록",
            "A record linking resources, deliverables and external feedback"
          ),
        },
        {
          day: "90",
          title: say(
            "전환 조건과 회복 여력 재검토",
            "Review switching conditions and recovery room"
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
