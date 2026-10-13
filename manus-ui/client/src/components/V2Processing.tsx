import type { V2EvidenceHttpObservation } from "../../../shared/v2EvidenceProtocol";
import type { V2Language } from "../data/v2Language";

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
}: {
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
  return (
    <main className="v2-intake v2-processing" data-testid="v2-processing" data-processing-state={running ? "running" : "failed"}>
      <section className="v2-intake-panel" aria-live="polite" aria-busy={running}>
        <p className="v2-kicker">{say("공개 근거 분석", "Public evidence analysis")}</p>
        <h1>
          {running
            ? say("공개 근거를 검색하고 출처를 확인하고 있습니다", "Searching public evidence and checking sources")
            : say("이번 검색에서는 사용할 수 있는 공개 근거를 확보하지 못했습니다", "No usable public evidence was secured in this search")}
        </h1>
        <dl className="v2-processing-request">
          <div>
            <dt>{say("검색 대상", "Target")}</dt>
            <dd>{target}</dd>
          </div>
          <div>
            <dt>{say("지역", "Geography")}</dt>
            <dd>{geography}</dd>
          </div>
          <div>
            <dt>{say("검색 범위", "Scope")}</dt>
            <dd>{areas.join(" · ")}</dd>
          </div>
        </dl>
        {running ? (
          <>
            <p>
              {say(
                "서버가 위 대상만으로 공개 검색을 실행한 뒤, 인용된 각 출처가 공개적으로 열리는지 확인합니다. 확인이 끝나면 기존 구조 분석에 연결해 결과를 엽니다. 보통 수십 초가 걸립니다.",
                "The server searches using only the target above, then checks that each cited source opens publicly. When checking ends, the evidence is connected to the existing structural analysis and results open. This usually takes tens of seconds."
              )}
            </p>
            <p className="v2-processing-elapsed">
              {say(`경과 시간 ${seconds}초`, `Elapsed ${seconds}s`)}
            </p>
          </>
        ) : (
          <>
            <p data-failure-kind={kind}>{failureCopy[kind][ko ? 1 : 0]}</p>
            <p className="v2-guidance">
              {say(
                "다시 검색하거나 대상을 수정할 수 있습니다. 또는 외부 근거 없이 구조 초안을 볼 수 있으며, 이 경우 결과에 '구조 초안'으로 표시됩니다.",
                "You can search again or edit the target. Or view the structural draft without public evidence; it will be marked as a structural draft."
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
    </main>
  );
}
