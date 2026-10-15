import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Circle,
  FileSearch,
  GitBranch,
  Landmark,
  Loader2,
  Network,
  ShieldCheck,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { V2EvidenceHttpObservation } from "../../../shared/v2EvidenceProtocol";
import { v2t, type V2CopyKey, type V2Language } from "../data/v2Language";

type FailureKind = "no_evidence" | "sources" | "timeout" | "service" | "response";

/** Customer-safe failure category; never shows provider text, URLs or input. */
export function v2ProcessingFailureKind(
  observation: V2EvidenceHttpObservation | null | undefined
): FailureKind {
  if (!observation) return "service";
  if (observation.diagnostic === "no_evidence") return "no_evidence";
  if (observation.diagnostic === "source_probe_failure" || observation.stage === "sources")
    return "sources";
  if (observation.diagnostic === "timeout") return "timeout";
  if (
    observation.diagnostic === "upstream_http" ||
    observation.diagnostic === "transport_error" ||
    observation.reason === "provider_not_configured" ||
    observation.status === 0 ||
    observation.status >= 500 && !observation.diagnostic
  )
    return "service";
  return "response";
}

const failureCopy: Record<FailureKind, [en: string, ko: string]> = {
  no_evidence: [
    "The search ran, but it found no public source that could be cited for this exact target and geography. Nothing was filled in with general statements. A more specific institution, program or role name may change the result.",
    "검색은 실행되었지만, 입력한 대상과 지역에 대해 출처로 인용할 수 있는 공개 자료를 찾지 못했습니다. 일반론으로 대신 채우지 않았습니다. 기관명·과정명·직무명을 더 구체적으로 입력하면 결과가 달라질 수 있습니다.",
  ],
  sources: [
    "Sources were found, but none could be opened and checked as public pages, so they were not used as evidence.",
    "출처는 찾았지만 공개 페이지로 열어 확인할 수 없어 근거로 사용하지 않았습니다.",
  ],
  timeout: [
    "The public search did not finish within the time limit.",
    "공개 검색이 제한 시간 안에 끝나지 않았습니다.",
  ],
  service: [
    "The public search service could not be reached right now.",
    "지금은 공개 검색 서비스에 연결할 수 없습니다.",
  ],
  response: [
    "The search response could not be verified in the required format, so it was not used as evidence.",
    "검색 응답을 필요한 형식으로 확인할 수 없어 근거로 사용하지 않았습니다.",
  ],
};

type StepState = "done" | "running" | "pending" | "failed";

/** The five structural lenses, in the customer wording defined by the report spec. */
const lenses: { icon: LucideIcon; title: [string, string]; question: [string, string] }[] = [
  { icon: Landmark, title: ["Conditions of the opportunity", "기회의 조건"], question: ["Who decides, and on what formal terms?", "누가, 어떤 공식 조건으로 결정하는가"] },
  { icon: Users, title: ["Connection", "연결 가능성"], question: ["Who would actively support your success?", "누가 성공을 실제로 도와줄 수 있는가"] },
  { icon: Building2, title: ["Structural fit", "구조 적합성"], question: ["How stable is the structure you would enter?", "들어갈 구조는 얼마나 안정적인가"] },
  { icon: Workflow, title: ["Execution reality", "실행 현실성"], question: ["Can the day-to-day work actually be sustained?", "일상의 업무를 실제로 지속할 수 있는가"] },
  { icon: TrendingUp, title: ["Staying power", "버틸 수 있는가"], question: ["How much could policy and market shocks shake it?", "정책·시장 변화에 얼마나 흔들리는가"] },
];

// Same customer labels as v2Language (tradeoff, missing, posture, safety,
// changing, switches) so the waiting screen previews the real sections.
const outputs: V2CopyKey[] = ["tradeoff", "missing", "posture", "safety", "changing", "switches"];

export default function V2Processing({
  language,
  running,
  seconds,
  target,
  geography,
  areas,
  observation,
  onRetry,
  onEditTarget,
  onDraft,
  topics = [],
}: {
  /** Real per-topic state of the parallel searches. */
  topics?: { label: string; state: "running" | "done" | "empty" }[];
  language: V2Language;
  running: boolean;
  seconds: number;
  target: string;
  geography: string;
  areas: string[];
  observation: V2EvidenceHttpObservation | null | undefined;
  onRetry: () => void;
  onEditTarget: () => void;
  onDraft: () => void;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const kind = v2ProcessingFailureKind(observation);
  // Rotates which lens is introduced; it is explanatory content, not progress.
  const [lens, setLens] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setLens(i => (i + 1) % lenses.length), 5000);
    return () => window.clearInterval(timer);
  }, [running]);

  // Only states the client actually knows: input validated, request in flight
  // or failed. Later steps stay pending until results really open.
  const steps: { icon: LucideIcon; label: [string, string]; detail: [string, string]; state: StepState }[] = [
    { icon: ShieldCheck, label: ["Answers checked", "답변 확인"], detail: ["Required answers and consent are in place", "필수 답변과 동의를 확인했습니다"], state: "done" },
    { icon: FileSearch, label: ["Public search and source check", "공개 검색·출처 확인"], detail: ["We search with the target only, then check that each cited page opens", "검색 대상만으로 검색하고, 인용한 페이지가 실제로 열리는지 확인합니다"], state: running ? "running" : "failed" },
    { icon: Network, label: ["Place evidence beside your answers", "내 조건과 함께 정리"], detail: ["Evidence sits next to your answers. Sources do not change scores", "근거를 내 조건 옆에 놓습니다. 출처는 점수를 바꾸지 않습니다"], state: "pending" },
    { icon: GitBranch, label: ["Open your analysis", "분석 결과 열기"], detail: ["The dashboard, simulator and report use the same result", "대시보드, 시뮬레이터, 보고서가 같은 결과를 씁니다"], state: "pending" },
  ];
  const StateIcon = ({ state }: { state: StepState }) =>
    state === "done" ? <CheckCircle2 aria-hidden className="v2-step-state done" size={18} />
      : state === "running" ? <Loader2 aria-hidden className="v2-step-state running" size={18} />
        : state === "failed" ? <AlertCircle aria-hidden className="v2-step-state failed" size={18} />
          : <Circle aria-hidden className="v2-step-state pending" size={18} />;
  const stateLabel = (state: StepState) => ({
    done: say("완료", "Done"), running: say("진행 중", "In progress"),
    failed: say("근거 찾지 못함", "No usable evidence"), pending: say("대기", "Waiting"),
  })[state];
  const ActiveLens = lenses[lens].icon;

  return (
    <main className="v2-processing" data-testid="v2-processing" data-processing-state={running ? "running" : "failed"}>
      <section className="v2-processing-status" aria-live="polite" aria-busy={running}>
        <p className="v2-kicker">{say("공개 근거 분석", "Public evidence analysis")}</p>
        <h1>
          {running
            ? say("공개 근거를 검색하고 출처를 확인하고 있습니다", "Searching public evidence and checking sources")
            : say("이번 검색에서는 쓸 수 있는 공개 근거를 찾지 못했습니다", "This search found no public evidence we could use")}
        </h1>
        <ol className="v2-processing-steps">
          {steps.map(({ icon: Icon, label, detail, state }) => (
            <li key={label[0]} data-state={state}>
              <span className="v2-step-icon"><Icon aria-hidden size={18} /></span>
              <div>
                <strong>{label[ko ? 1 : 0]}</strong>
                <small>{detail[ko ? 1 : 0]}</small>
              </div>
              <span className="v2-step-label"><StateIcon state={state} />{stateLabel(state)}</span>
            </li>
          ))}
        </ol>
        {topics.length > 1 && (
          <ul className="v2-topic-list" aria-label={say("주제별 검색", "Searches by topic")}>
            {topics.map(topic => (
              <li key={topic.label} data-state={topic.state}>
                <StateIcon state={topic.state === "running" ? "running" : topic.state === "done" ? "done" : "failed"} />
                <span>{topic.label}</span>
                <b>{topic.state === "running" ? say("수집 중", "Collecting") : topic.state === "done" ? say("근거 찾음", "Evidence found") : say("근거 없음", "No evidence")}</b>
              </li>
            ))}
          </ul>
        )}
        <dl className="v2-processing-request">
          <div>
            <dt>{say("검색 대상", "Target")}</dt>
            <dd>{target}</dd>
          </div>
          <div>
            <dt>{say("지역", "Place")}</dt>
            <dd>{geography}</dd>
          </div>
          <div>
            <dt>{say("검색 주제", "Topics")}</dt>
            <dd>{areas.join(" · ")}</dd>
          </div>
        </dl>
        {running ? (
          <p className="v2-processing-elapsed">
            {say(`경과 시간 ${seconds}초 · 꼼꼼히 찾느라 1~2분 걸릴 수 있습니다`, `${seconds}s so far · a thorough search can take 1–2 minutes`)}
          </p>
        ) : (
          <>
            <p className="v2-processing-failure" data-failure-kind={kind}>{failureCopy[kind][ko ? 1 : 0]}</p>
            <p className="v2-guidance">
              {say(
                "다시 검색하거나 검색 대상을 고칠 수 있습니다. 외부 근거 없이 구조 초안을 볼 수도 있으며, 이때 결과에 '구조 초안'으로 표시됩니다.",
                "You can search again or edit the search target. You can also view a structural draft without public evidence. It will be marked as a draft."
              )}
            </p>
            <div className="v2-module-nav">
              <button type="button" onClick={onEditTarget}>
                {say("검색 대상 수정", "Edit search target")}
              </button>
              <button type="button" onClick={onDraft}>
                {say("외부 근거 없는 구조 초안 보기", "View structural draft without public evidence")}
              </button>
              <button type="button" className="v2-primary" onClick={onRetry}>
                {say("다시 검색", "Search again")}
              </button>
            </div>
          </>
        )}
      </section>

      <aside className="v2-processing-method" aria-label={say("allofmycareer 분석 방법", "How allofmycareer analyzes")}>
        <p className="v2-kicker">Structure First</p>
        <h2>{say("정답을 대신 고르지 않습니다. 선택의 구조를 드러냅니다.", "We do not choose for you. We make the structure of the choice visible.")}</h2>
        <p>
          {say(
            "무엇을 지키고 무엇을 얻으려는 선택인지, 위험이 어디에 모이는지, 아직 확인되지 않은 것은 무엇인지, 어떤 조건이 달라지면 판단이 바뀌는지를 봅니다.",
            "We look at what the choice protects and opens, where the risk sits, what is still unchecked, and which conditions would change the reading."
          )}
        </p>
        <div className="v2-lens-feature" aria-live="off">
          <span className="v2-lens-icon"><ActiveLens aria-hidden size={22} /></span>
          <div>
            <small>{say(`살펴보는 관점 ${lens + 1} / 5`, `Lens ${lens + 1} of 5`)}</small>
            <strong>{lenses[lens].title[ko ? 1 : 0]}</strong>
            <p>{lenses[lens].question[ko ? 1 : 0]}</p>
          </div>
        </div>
        <ul className="v2-lens-list">
          {lenses.map(({ icon: Icon, title }, i) => (
            <li key={title[0]} aria-current={i === lens}>
              <Icon aria-hidden size={16} />
              {title[ko ? 1 : 0]}
            </li>
          ))}
        </ul>
        <p className="v2-method-caption">{say("분석 결과에 담기는 것", "What your analysis contains")}</p>
        <ol className="v2-output-sequence">
          {outputs.map((key, i) => (
            <li key={key}><span>{String(i + 1).padStart(2, "0")}</span>{v2t(language, key)}</li>
          ))}
          <li><span>07</span>{say("다음에 확인할 것과 30·60·90일 계획", "Next check and a 30/60/90-day plan")}</li>
        </ol>
        <p className="v2-method-note">
          {say(
            "공개 근거는 검증 가능한 출처가 있을 때만 사용합니다. 작성하신 원문은 저장하지 않습니다.",
            "Public evidence is used only with a verifiable source. Your written answers are not stored."
          )}
        </p>
      </aside>
    </main>
  );
}
