import { useId } from "react";
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
  const protectedLabel = state.protects.length
    ? state.protects.map(k => v2t(state.language, k)).join(" · ")
    : say("현재 소득과 생활 기반", "Current income and living base");
  const play =
    analysis.plays[0]?.title ??
    say("작은 범위에서 요건 확인", "Test requirements at a small scope");
  const evidence =
    phase === "live"
      ? say("공개 근거 확인됨", "Public evidence available")
      : phase === "demo"
        ? say("합성 예시 근거", "Synthetic example evidence")
        : phase === "loading"
          ? say("공개 근거 확인 중", "Public research in progress")
          : say("외부 요건 미확인", "External requirements unresolved");
  const nodes = [
    {
      x: 320,
      y: 14,
      title: "External Evidence",
      value: evidence,
      tone: "evidence",
    },
    {
      x: 18,
      y: 145,
      title: say("A / 현재 기반", "A / Current base"),
      value: cut(protectedLabel, ko ? 26 : 37),
      tone: "base",
    },
    {
      x: 320,
      y: 145,
      title: "Changing",
      value: cut(play, ko ? 24 : 35),
      tone: "changing",
    },
    {
      x: 622,
      y: 145,
      title: say("B / 탐색할 경로", "B / Path to explore"),
      value: analysis.topic,
      tone: "target",
    },
    {
      x: 320,
      y: 276,
      title: "Safety Margin → Switching",
      value: say(
        `안전마진: ${v2t(state.language, safetyBand as V2CopyKey)}`,
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
            "현재 기반, 공개 근거, 병행 시험과 전환 조건의 관계",
            "Relationships between current capacity, public evidence, testing and switching conditions"
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
          <path d="M622 188 H560" />
          <path d="M440 229 V276" />
          <path d="M138 229 V318 H320" strokeDasharray="5 5" />
          <path d="M560 318 H742 V229" strokeDasharray="5 5" />
        </g>
        <g className="v2-map-edge-labels">
          <text x="448" y="126">
            {say("요건 대조", "Requirements")}
          </text>
          <text x="270" y="177">
            {say("유지", "Protect")}
          </text>
          <text x="568" y="177">
            {say("검증", "Test")}
          </text>
          <text x="448" y="257">
            {say("결과 확인", "Review results")}
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
        <dl className="v2-map-context">
          <div>
            <dt>{v2t(state.language, "missing")}</dt>
            <dd>{analysis.missingConcept}</dd>
          </div>
          <div>
            <dt>{v2t(state.language, "exposureRisk")}</dt>
            <dd>
              {state.exposes.length
                ? state.exposes.map(k => v2t(state.language, k)).join(" · ")
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
    <div className="v2-reasoning" data-testid="v2-integrated-reasoning">
      {analysis.findings.map((f, i) => (
        <article key={f.id} data-provenance={f.provenance.join(" ")}>
          <div className="v2-reasoning-heading">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{f.title}</h3>
          </div>
          <p className="v2-reasoning-basis">{f.basis}</p>
          <p>{f.implication}</p>
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
                {!compact && (
                  <>
                    <p>
                      {ko ? "현재 조건" : "Current condition"}: {link.condition}
                    </p>
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
        {ko
          ? "다섯 관점으로 요건과 현재 조건을 연결한 해석입니다. 미확인 조건을 점수로 채우지 않습니다."
          : "Five framework perspectives connect external requirements with current conditions. Unresolved conditions are not assigned scores."}
      </p>
      {analysis.factors.map((f, i) => (
        <article key={f.id} data-factor={f.id}>
          <span className="v2-factor-number">0{i + 1}</span>
          <div>
            <h3>{f.title}</h3>
            <p>
              {compact
                ? f.reading.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || f.reading
                : f.reading}
            </p>
          </div>
          <div className="v2-factor-state">
            <strong>{f.status}</strong>
            <small>
              {f.evidenceIds.length
                ? `${ko ? "연결 근거" : "Evidence"} ${f.evidenceIds.map(id => id + 1).join(", ")}`
                : ko
                  ? "추가 확인 필요"
                  : "Further validation needed"}
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
          Safety Margin / {v2t(analysis.language, band as V2CopyKey)}
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
          ? "막대는 입력한 조건의 단계 표시입니다. 확률이나 새로운 점수가 아닙니다. 손실 위험은 낮을수록 회복 여력이 커지는 방향으로 표시합니다."
          : "Bars represent qualitative input bands, not probabilities or new scores. Lower downside is shown as more room for recovery."}
      </small>
    </div>
  );
}
export function V2ChangingView({ analysis }: { analysis: V2Analysis }) {
  const ko = analysis.language === "ko";
  return (
    <div className="v2-changing-analysis" data-testid="v2-changing-analysis">
      {analysis.plays.length ? (
        analysis.plays.map((p, i) => (
          <article key={p.family} data-family={p.family}>
            <div className="v2-changing-title">
              <span>0{i + 1}</span>
              <h3>{p.title}</h3>
            </div>
            <p>{p.move}</p>
            <dl>
              <div>
                <dt>{ko ? "유지할 기반" : "Protect"}</dt>
                <dd>{p.protects}</dd>
              </div>
              <div>
                <dt>{ko ? "먼저 확보할 조건" : "Prerequisites"}</dt>
                <dd>{p.needs}</dd>
              </div>
              <div>
                <dt>{ko ? "확인할 결과" : "Evidence to collect"}</dt>
                <dd>{p.evidence}</dd>
              </div>
            </dl>
          </article>
        ))
      ) : (
        <p>
          {ko
            ? "현재 엔진에서 도출된 경로 조정안이 없습니다. 확인되지 않은 요건을 먼저 검증하세요."
            : "The current engine derives no reconfiguration play. Validate unresolved requirements first."}
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
        <span>{ko ? "다음에 확인할 질문" : "Next question to test"}</span>
        <h3>{analysis.question}</h3>
        <p>{analysis.experiment.action}</p>
        <strong>{ko ? "남길 결과물" : "Deliverable"}</strong>
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
              ? "다음 단계 검토 조건"
              : "Condition for reviewing the next step"}
          </strong>
          <p>{analysis.experiment.continue}</p>
        </article>
        <article>
          <strong>
            {ko ? "범위를 줄일 조건" : "Condition for reducing scope"}
          </strong>
          <p>{analysis.experiment.pause}</p>
        </article>
      </div>
    </div>
  );
}
