import { useId } from "react";
import { v2RoleFields } from "../data/v2InputGlossary";
import type { V2Analysis, V2EvidencePhase } from "../data/amcV2Analysis";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import type { V2State } from "../data/amcV2Model";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2t, type V2CopyKey } from "../data/v2Language";

const cut = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;
/** Diagram labels can wrap; complete evidence prose remains outside the diagram. */
function diagramLines(value: string, ko: boolean): string[] {
  const width = ko ? 16 : 26;
  if (value.length <= width) return [value];
  const breakAt = value.lastIndexOf(" ", width);
  const split = breakAt >= width / 2 ? breakAt : width;
  return [value.slice(0, split).trim(), cut(value.slice(split).trim(), width)];
}
export function V2DecisionMap({
  state,
  analysis,
  phase,
  safetyBand,
}: {
  state: V2State;
  analysis: V2Analysis;
  phase: V2EvidencePhase;
  safetyBand: string;
}) {
  const id = useId().replace(/:/g, ""),
    ko = state.language === "ko";
  const say = (a: string, b: string) => (ko ? a : b);
  const protectedLabel = state.protects.some(k => k !== "other")
    ? state.protects.filter(k => k !== "other").map(k => v2t(state.language, k)).join(" · ")
    : say("현재 소득과 생활 기반", "Current income and living base");
  const play =
    analysis.plays[0]?.title ??
    say("조건 확인 전 · 조정안 없음", "Conditions not yet confirmed · no adjustment yet");
  const evidence =
    phase === "live"
      ? say("출처 링크 열림 · 내용은 아직 확인 전", "Source links open · claims not yet checked")
      : phase === "demo"
        ? say("예시용 근거", "Example evidence")
        : phase === "loading"
          ? say("공개 자료 확인 중", "Checking public sources")
          : say("목표 요건 확인 전", "Target requirements not yet checked");
  const nodes = [
    {
      x: 320,
      y: 14,
      title: say("공개 자료", "Public sources"),
      value: analysis.priorityEvidence?.headline ?? evidence,
      tone: "evidence",
    },
    {
      x: 18,
      y: 145,
      title: say("현재 직무", "Current role"),
      value: cut(state.optionA.trim() ? v2RoleFields(state.language, state).current.text : protectedLabel, ko ? 26 : 37),
      tone: "base",
    },
    {
      x: 320,
      y: 145,
      title: say("경로 조정 (Changing)", "Path options (Changing)"),
      value: cut(play, ko ? 24 : 35),
      tone: "changing",
    },
    {
      x: 622,
      y: 145,
      title: say("고민하는 커리어", "Considered career"),
      value: state.optionB.trim() ? v2RoleFields(state.language, state).target.text : analysis.target,
      tone: "target",
    },
    {
      x: 320,
      y: 276,
      title: say("안전 여유 → 판단이 바뀌는 조건", "Safety Margin → Switching"),
      value: say(
        `안전 여유: ${v2t(state.language, safetyBand as V2CopyKey)}`,
        `Safety: ${v2t(state.language, safetyBand as V2CopyKey)}`
      ),
      tone: "review",
    },
  ];
  return (
    <figure className="v2-relationship-map" data-testid="v2-relationship-map">
      <svg
        className="v2-map-svg"
        viewBox="0 0 880 374"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>
          {say(
            "현재 기반, 공개 자료, 작은 확인, 판단이 바뀌는 조건의 관계",
            "How your current base, public sources, small checks and switching conditions connect"
          )}
        </title>
        <desc id={`${id}-desc`}>
          {analysis.tradeoff} {analysis.question} {analysis.boundary}
        </desc>
        <defs>
          <marker
            id={`${id}-arrow`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
          </marker>
        </defs>
        <g
          className="v2-map-edges"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          markerEnd={`url(#${id}-arrow)`}
        >
          <path d="M440 98 V145" />
          <path d="M258 188 H320" />
          <path d="M622 188 H560" strokeDasharray={analysis.plays.length ? undefined : "5 5"} />
          <path d="M440 229 V276" strokeDasharray={analysis.plays.length ? undefined : "5 5"} />
          <path d="M138 229 V318 H320" strokeDasharray="5 5" />
          <path d="M560 318 H742 V229" strokeDasharray="5 5" />
        </g>
        <g className="v2-map-edge-labels">
          <text x="448" y="126">
            {say("요건 비교", "Compare requirements")}
          </text>
          <text x="270" y="177">
            {say("지키기", "Keep")}
          </text>
          <text x="568" y="177">
            {analysis.plays.length ? say("확인", "Check") : say("확인 전", "Not yet checked")}
          </text>
          <text x="448" y="257">
            {analysis.plays.length ? say("결과 확인", "Review results") : say("조건 확인", "Check conditions")}
          </text>
        </g>
        {nodes.map(n => (
          <g key={n.tone} className={`v2-map-node ${n.tone}`}>
            <rect x={n.x} y={n.y} width="240" height="84" rx="10" />
            <text x={n.x + 18} y={n.y + 28} className="v2-map-node-title">
              {n.title}
            </text>
            <text x={n.x + 18} y={n.y + 56} className="v2-map-node-value">
              {diagramLines(n.value, ko).map((line, index) => (
                <tspan key={index} x={n.x + 18} dy={index ? 16 : 0}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ))}
      </svg>
      <div className="v2-map-mobile-flow">
        {nodes.map(n => (
          <div key={n.tone} className={`v2-map-mobile-node ${n.tone}`}>
            <span>{n.title}</span>
            <strong>{n.value}</strong>
          </div>
        ))}
      </div>
      <figcaption>
        <p>{evidence}{analysis.priorityEvidence && ` / ${analysis.priorityEvidence.condition}`}</p>
        <div className="v2-map-tradeoff">
          <span>{v2t(state.language, "tradeoff")}</span>
          <strong>
            {`${
              state.protects
                .slice(0, 2)
                .map(k => v2t(state.language, k))
                .join(" · ") || protectedLabel
            } ↔ ${
              state.opens
                .slice(0, 2)
                .map(k => v2t(state.language, k))
                .join(" · ") || analysis.topic
            }`}
          </strong>
        </div>
        <strong>{analysis.question}</strong>
        <p>{analysis.tradeoff}</p>
        {analysis.switching[0] && <p><b>{say("판단이 바뀌는 조건 (Switching) / ", "Switching / ")}</b>{analysis.switching[0].signal}</p>}
        <dl className="v2-map-context">
          <div>
            <dt>{v2t(state.language, "missing")}</dt>
            <dd>{analysis.missingConcept}</dd>
          </div>
          <div>
            <dt>{v2t(state.language, "exposureRisk")}</dt>
            <dd>
              {state.exposes.some(k => k !== "other")
                ? state.exposes.filter(k => k !== "other").map(k => v2t(state.language, k)).join(" · ")
                : v2t(state.language, "noneYet")}
            </dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

export function V2Reasoning({
  analysis,
  intelligence,
  compact = false,
}: {
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  compact?: boolean;
}) {
  const ko = analysis.language === "ko";
  return (
    <div className="v2-reasoning" data-testid="v2-integrated-reasoning" data-count={analysis.findings.length}>
      {analysis.findings.map((f, i) => (
        <article key={f.id} data-provenance={f.provenance.join(" ")}>
          <div className="v2-reasoning-heading">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{f.title}</h3>
          </div>
          <p className="v2-reasoning-basis">{f.basis}</p>
          <p>{f.coreReading}</p>
          {f.selfReports.map((report, index) => (
            <p className="v2-self-report" key={index}>{report}</p>
          ))}
          {f.evidenceIds.map(id => {
            const block = intelligence.evidenceBlocks[id],
              link = analysis.evidenceLinks[id];
            if (!block || !link) return null;
            return (
              <div className="v2-reasoning-source" key={id}>
                <strong>
                  {ko ? `근거 ${id + 1}` : `Evidence ${id + 1}`} /{" "}
                  {v2CustomerEvidenceText(analysis.language, block.headline)}
                </strong>
                <p className="v2-comparison-reading">{link.comparisonLabel}</p>
                {link.comparisonDetail && <p className="v2-self-report">{ko ? "본인 응답: " : "Your answer: "}{link.comparisonDetail}</p>}
                {!compact && (
                  <>
                    {/* Headline and status stay visible; the long fact sits behind one toggle. */}
                    <details className="v2-evidence-trace-detail">
                      <summary>{ko ? "근거 내용·적용 범위·다음 확인 보기" : "Show the fact, scope and next check"}</summary>
                      <p className="v2-source-condition">{v2CustomerEvidenceText(analysis.language, link.sourceFact)}</p>
                      {block.action && <p className="v2-source-condition"><b>{ko ? "할 일: " : "To do: "}</b>{v2CustomerEvidenceText(analysis.language, block.action)}</p>}
                      <dl className="v2-evidence-trace">
                    <div><dt>{ko ? "자료가 다루는 범위" : "What the source covers"}</dt><dd>{v2CustomerEvidenceText(analysis.language, link.sourceScope)}</dd></div>
                    <div><dt>{ko ? "내 조건과 판단" : "Your condition and the reading"}</dt><dd>{link.condition}</dd></div>
                    {link.selfReport && !f.selfReports.includes(link.selfReport) && <div><dt>{ko ? "본인 응답 (외부 확인 전)" : "Your answer (not externally checked)"}</dt><dd>{link.selfReport}</dd></div>}
                    <div><dt>{ko ? "아직 확인되지 않은 점" : "Not yet confirmed"}</dt><dd>{link.unresolved}</dd></div>
                    <div><dt>{ko ? "다음 확인" : "Next check"}</dt><dd>{link.test}</dd></div>
                      </dl>
                    </details>
                  </>
                )}
                {block.sourceUrl && (
                  <a href={block.sourceUrl} target="_blank" rel="noreferrer">
                    {block.sourceLabel} ↗
                  </a>
                )}
              </div>
            );
          })}
        </article>
      ))}
    </div>
  );
}
export function V2FactorMap({
  analysis,
  compact = false,
}: {
  analysis: V2Analysis;
  compact?: boolean;
}) {
  const ko = analysis.language === "ko";
  return (
    <div className="v2-factor-map" data-testid="v2-framework-readings">
      <p className="v2-analysis-note">
        {analysis.factorScopeNote}{" "}
        {analysis.fifwmSource === "unavailable"
          ? ko
            ? "다섯 항목에 답한 내용이 없어 평가하지 않았습니다. 실행 준비도나 안전 여유로 대신 평가하지도 않습니다."
            : "There are no answers for the five items, so they were not assessed. Readiness and safety are not used in their place."
          : analysis.fifwmSource === "case-adapted"
            ? ko
              ? "답한 항목만 같은 0·1·2 기준으로 평가했습니다. 질문은 이 상황에 맞춘 것으로, 원래 조직 평가와 다릅니다. 공개 자료는 점수를 바꾸지 않습니다."
              : "Only answered items are scored, on the same 0/1/2 scale. The questions are adapted to this situation and differ from the original organization assessment. Public sources do not change the scores."
            : ko
              ? "답한 항목만 기존 규칙으로 평가했습니다. 답하지 않았거나 ‘잘 모름’·‘해당 없음’을 고른 항목은 평가하지 않았습니다. 공개 자료는 점수를 바꾸지 않습니다."
              : "Only answered items were assessed, using the existing rules. Items left blank or marked not sure or not applicable were not assessed. Public sources do not change the scores."}
      </p>
      {analysis.factors.map((f, i) => (
        <article key={f.id} data-factor={f.id}>
          <span className="v2-factor-number">0{i + 1}</span>
          <div>
            <h3>{f.title}</h3>
            {f.questionTopic && <p className="v2-factor-question">{f.questionTopic}</p>}
            {(!compact || f.assessed) && <p>
              {compact
                ? f.reading.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || f.reading
                : f.reading}
            </p>}
          </div>
          <div className="v2-factor-state">
            <strong>{f.status}</strong>
            <small>
              {f.evidenceIds.length
                ? `${ko ? "관련 공개 자료" : "Related public sources"} ${f.evidenceIds.map(id => id + 1).join(", ")}`
                : ko
                  ? "이 항목과 연결된 공개 자료는 없습니다"
                  : "No public sources linked to this item"}
            </small>
          </div>
        </article>
      ))}
    </div>
  );
}
export function V2SafetyView({
  analysis,
  band,
}: {
  analysis: V2Analysis;
  band: string;
}) {
  const ko = analysis.language === "ko";
  return (
    <div className="v2-safety-analysis" data-testid="v2-safety-analysis">
      <div className="v2-safety-reading">
        <strong>
          {ko ? "안전 여유 (Safety Margin)" : "Safety Margin"} / {v2t(analysis.language, band as V2CopyKey)}
        </strong>
        <p>{analysis.boundary}</p>
      </div>
      <div className="v2-safety-dimensions">
        {analysis.safety.map(s => (
          <article key={s.id}>
            <div>
              <h3>{s.title}</h3>
              <strong>{v2t(analysis.language, s.band as V2CopyKey)}</strong>
            </div>
            <div
              className={`v2-ordinal ${s.level === null ? "unknown" : ""}`}
              role="img"
              aria-label={`${s.title}: ${v2t(analysis.language, s.band as V2CopyKey)}`}
            >
              {[1, 2, 3].map(n => (
                <i
                  key={n}
                  className={s.level !== null && n <= s.level ? "filled" : ""}
                />
              ))}
              {s.level === null && <span>?</span>}
            </div>
            <p>{s.reading}</p>
          </article>
        ))}
      </div>
      <small>
        {ko
          ? "막대는 답한 조건의 단계를 보여 줍니다. 확률이나 새 점수가 아닙니다. 손실 위험은 낮을수록 칸이 더 많이 찹니다."
          : "Bars show the level of each condition you entered, not a probability or a new score. For downside, a lower risk fills more cells."}
      </small>
    </div>
  );
}
export function V2ChangingView({ analysis }: { analysis: V2Analysis }) {
  const ko = analysis.language === "ko";
  const plays = analysis.plays;
  // Values identical in every card are shown once above the cards.
  const same = (pick: (p: V2Analysis["plays"][number]) => string) =>
    plays.length > 1 && plays.every(p => pick(p) === pick(plays[0]));
  const sharedProtects = same(p => p.protects);
  const sharedTiming = same(p => p.timeExposure);
  const protectsLabel = ko ? "지킬 기반" : "What to keep";
  const timingLabel = ko ? "다시 볼 시점" : "When to review";
  return (
    <div className="v2-changing-analysis" data-testid="v2-changing-analysis" data-count={plays.length}>
      {(sharedProtects || sharedTiming) && (
        <dl className="v2-changing-shared" style={{ gridColumn: "1 / -1", margin: 0 }}>
          {sharedProtects && (
            <div>
              <dt>{protectsLabel} · {ko ? "모든 방법에 공통" : "applies to every option"}</dt>
              <dd>{plays[0].protects}</dd>
            </div>
          )}
          {sharedTiming && (
            <div>
              <dt>{timingLabel} · {ko ? "모든 방법에 공통" : "applies to every option"}</dt>
              <dd>{plays[0].timeExposure}</dd>
            </div>
          )}
        </dl>
      )}
      {plays.length ? (
        plays.map((p, i) => (
          <article key={p.family} data-family={p.family}>
            <div className="v2-changing-title">
              <span>0{i + 1}</span>
              <h3>{p.title}</h3>
            </div>
            <p>{p.move}</p>
            <dl>
              <div>
                <dt>{ko ? "달라지는 점" : "What changes"}</dt>
                <dd>{p.changes}</dd>
              </div>
              {!sharedProtects && (
                <div>
                  <dt>{protectsLabel}</dt>
                  <dd>{p.protects}</dd>
                </div>
              )}
              <div>
                <dt>{ko ? "먼저 갖출 것" : "Needed first"}</dt>
                <dd>{p.needs}</dd>
              </div>
              <div>
                <dt>{ko ? "확인할 결과" : "Result to check"}</dt>
                <dd>{p.evidence}</dd>
              </div>
              <div>
                <dt>{ko ? "감수할 부담" : "The risk you take on"}</dt>
                <dd>{p.exposure}</dd>
              </div>
              {!sharedTiming && (
                <div>
                  <dt>{timingLabel}</dt>
                  <dd>{p.timeExposure}</dd>
                </div>
              )}
            </dl>
          </article>
        ))
      ) : (
        <p>
          {ko
            ? "지금 조건으로는 제시할 경로 조정안이 없습니다. 확인되지 않은 요건부터 확인하세요."
            : "No path adjustment comes out of the current conditions. Check the unconfirmed requirements first."}
        </p>
      )}
    </div>
  );
}
export function V2ExperimentView({
  analysis,
  compact = false,
}: {
  analysis: V2Analysis;
  compact?: boolean;
}) {
  const ko = analysis.language === "ko";
  return (
    <div className="v2-experiment-analysis" data-testid="v2-next-experiment">
      <div className="v2-experiment-now">
        <span>{ko ? "다음에 확인할 질문" : "Next question to check"}</span>
        <h3>{analysis.question}</h3>
        <p>{compact ? analysis.experiment.briefAction : analysis.experiment.action}</p>
        <strong>{ko ? "남길 기록" : "What to record"}</strong>
        <p>{analysis.experiment.output}</p>
      </div>
      {!compact && (
        <ol className="v2-experiment-timeline">
          {analysis.experiment.stages.map(s => (
            <li key={s.day}>
              <span>
                {s.day}
                <small>{ko ? "일" : "days"}</small>
              </span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.action}</p>
                <strong>{s.output}</strong>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="v2-experiment-conditions">
        <article>
          <strong>
            {ko
              ? "다음 단계를 검토할 때"
              : "When to review the next step"}
          </strong>
          <p>{analysis.experiment.continue}</p>
        </article>
        <article>
          <strong>
            {ko ? "규모를 줄일 때" : "When to scale back"}
          </strong>
          <p>{analysis.experiment.pause}</p>
        </article>
      </div>
    </div>
  );
}
