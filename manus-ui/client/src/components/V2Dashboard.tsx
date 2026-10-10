import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2State } from "../data/amcV2Model";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2EvidenceCheckedDate } from "../data/v2ReportPresentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import {
  v2t,
  v2DirectionLabel,
  v2EvidenceDimensionLabel,
  type V2CopyKey,
} from "../data/v2Language";
import { buildV2Analysis, type V2EvidencePhase } from "../data/amcV2Analysis";
import {
  V2DecisionMap,
  V2Reasoning,
  V2FactorMap,
  V2SafetyView,
  V2ChangingView,
  V2ExperimentView,
} from "./V2AnalysisView";
import "../styles/v2.css";
import "../styles/v2-analysis.css";
const fmt = (s: V2State, key: V2CopyKey) => v2t(s.language, key);
export type { V2EvidencePhase } from "../data/amcV2Analysis";
export function v2EvidenceStatusLabel(phase: V2EvidencePhase): V2CopyKey {
  return phase === "live"
    ? "liveEvidence"
    : phase === "demo"
      ? "demoBadge"
      : phase === "not_checked"
        ? "evidenceNotChecked"
        : phase === "loading"
          ? "evidenceChecking"
          : "evidenceUnavailable";
}
export function V2ExternalBoard({
  state,
  intelligence,
  phase,
  onCheckEvidence,
}: {
  state: V2State;
  intelligence: ExternalIntelligenceV2;
  phase: V2EvidencePhase;
  onCheckEvidence: () => void;
}) {
  const t = (key: V2CopyKey) => fmt(state, key),
    demo = phase === "demo";
  const evidenceText = (value: string) =>
    v2CustomerEvidenceText(state.language, value);
  const metrics = intelligence.metrics.filter(metric =>
    Number.isFinite(metric.value)
  );
  return (
    <section className="v2-external" aria-label={t("externalBoard")}>
      <div className="v2-section-top">
        <div>
          <p className="v2-kicker">Sources / {t("evidence")}</p>
          <h2>{t("externalBoard")}</h2>
        </div>
        <span className={demo ? "v2-demo-label" : "v2-status-label"}>
          {phase === "loading"
            ? t("evidenceChecking")
            : t(v2EvidenceStatusLabel(phase))}
        </span>
      </div>
      {phase === "not_checked" ||
      phase === "loading" ||
      phase === "unavailable" ? (
        <div className="v2-empty-evidence" aria-live="polite">
          <span aria-hidden="true">◌</span>
          <strong>
            {t(
              phase === "loading"
                ? "evidenceChecking"
                : v2EvidenceStatusLabel(phase)
            )}
          </strong>
          <p>
            {t(
              phase === "unavailable"
                ? "evidenceRetryHint"
                : phase === "loading"
                  ? "evidenceLoadingHint"
                  : "externalPending"
            )}
          </p>
          {phase !== "loading" && (
            <div className="v2-evidence-action">
              <button type="button" onClick={onCheckEvidence}>
                {t(phase === "unavailable" ? "retryEvidence" : "checkEvidence")}
              </button>
              <p>{t("evidenceDisclosure")}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {demo && <p className="v2-evidence-caveat">{t("demoOnly")}</p>}
          {phase === "live" && intelligence.generatedAt && (
            <p className="v2-evidence-caveat">
              {t("reviewedAt")}:{" "}
              {v2EvidenceCheckedDate(intelligence.generatedAt, state.language)}
            </p>
          )}
          <div className="v2-evidence-grid">
            {intelligence.evidenceBlocks.map((block, index) => (
              <article
                className="v2-evidence-card"
                data-provenance={block.provenance}
                key={index}
              >
                <div className="v2-evidence-number">
                  0{index + 1}{" "}
                  <span>
                    {evidenceText(
                      v2EvidenceDimensionLabel(state.language, block.dimension)
                    )}{" "}
                    · {v2DirectionLabel(state.language, block.direction)}
                  </span>
                </div>
                <h3>{evidenceText(block.headline)}</h3>
                <p>{evidenceText(block.fact)}</p>
                <div className="v2-evidence-why">
                  <strong>{t("whyMatters")}</strong>
                  <p>{evidenceText(block.whyItMatters)}</p>
                </div>
                <div className="v2-source">
                  {t("source")}:{" "}
                  {block.sourceUrl ? (
                    <a href={block.sourceUrl} target="_blank" rel="noreferrer">
                      {block.sourceLabel}
                    </a>
                  ) : (
                    block.sourceLabel
                  )}
                  {block.sourceDate && block.sourceDateKind && (
                    <>
                      {" "}
                      ·{" "}
                      {t(
                        block.sourceDateKind === "published"
                          ? "sourcePublished"
                          : "sourceUpdated"
                      )}
                      : {block.sourceDate}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
          {metrics.length > 0 && (
            <div className="v2-metrics">
              {metrics.map((m, i) => (
                <article key={i}>
                  <strong>
                    {m.value} {m.unit}
                  </strong>
                  <span>{evidenceText(m.label)}</span>
                  <small>{m.sourceLabel}</small>
                </article>
              ))}
            </div>
          )}
          <div className="v2-evidence-foot">
            {intelligence.opportunitySignals.length > 0 && (
              <div>
                <strong>{t("opportunity")}</strong>
                <p>
                  {intelligence.opportunitySignals
                    .map(evidenceText)
                    .join(" · ")}
                </p>
              </div>
            )}
            {intelligence.frictionSignals.length > 0 && (
              <div>
                <strong>{t("friction")}</strong>
                <p>
                  {intelligence.frictionSignals.map(evidenceText).join(" · ")}
                </p>
              </div>
            )}
            {intelligence.uncertainties.length > 0 && (
              <div>
                <strong>{t("uncertainty")}</strong>
                <p>
                  {intelligence.uncertainties.map(evidenceText).join(" · ")}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
export default function V2Dashboard({
  state,
  core,
  intelligence,
  evidencePhase = intelligence.status,
  onCheckEvidence = () => {},
  onReport,
}: {
  state: V2State;
  core: ProductApplicationV3;
  intelligence: ExternalIntelligenceV2;
  evidencePhase?: V2EvidencePhase;
  onCheckEvidence?: () => void;
  onReport: () => void;
}) {
  const t = (key: V2CopyKey) => fmt(state, key),
    ko = state.language === "ko";
  const say = (a: string, b: string) => (ko ? a : b);
  const analysis = buildV2Analysis(state, core, intelligence, evidencePhase);
  const draft = evidencePhase !== "live" && evidencePhase !== "demo";
  const head = (n: string, english: string, title: string, note?: string) => (
    <div className="v2-section-top">
      <div>
        <p className="v2-kicker">
          {n} / {english}
        </p>
        <h2>{title}</h2>
      </div>
      {note && <p>{note}</p>}
    </div>
  );
  return (
    <main
      className="v2-dashboard v2-analysis-dashboard"
      data-testid="v2-dashboard"
    >
      <section className="v2-hero">
        <div className="v2-hero-copy">
          <p className="v2-kicker">Executive Dashboard / {analysis.topic}</p>
          <div className={`v2-analysis-status ${draft ? "draft" : ""}`}>
            {t(v2EvidenceStatusLabel(evidencePhase))}
            {draft && ` · ${say("구조 초안", "Structural draft")}`}
          </div>
          <h1>{analysis.posture}</h1>
          <p className="v2-hero-sub">{analysis.summary}</p>
        </div>
        <aside className="v2-hero-side">
          <span>
            {say("판단을 바꿀 핵심 질문", "The question that matters")}
          </span>
          <strong>{analysis.question}</strong>
          <small>Safety Margin / {t(core.safetyMargin.band)}</small>
        </aside>
      </section>
      <nav
        className="v2-analysis-nav"
        aria-label={say("분석 바로가기", "Analysis navigation")}
      >
        <a href="#v2-reasons">{say("판단 이유", "Reasoning")}</a>
        <a href="#v2-map">Decision Map</a>
        <a href="#v2-safety">Safety Margin</a>
        <a href="#v2-changing">Changing</a>
        <a href="#v2-simulator">{t("simulator")}</a>
      </nav>
      <section className="v2-analysis-section" id="v2-reasons">
        {head(
          "01",
          "Structural Reading",
          say(
            "현재 조건에서 도출한 판단 이유",
            "Why the current conditions lead here"
          )
        )}
        <V2Reasoning analysis={analysis} intelligence={intelligence} />
      </section>
      <section className="v2-analysis-section" id="v2-map">
        {head(
          "02",
          "Decision Map",
          say(
            "유지할 기반과 탐색할 경로",
            "The protected base and the path to explore"
          )
        )}
        <V2DecisionMap
          state={state}
          analysis={analysis}
          phase={evidencePhase}
          safetyBand={core.safetyMargin.band}
        />
        <details className="v2-input-context">
          <summary>
            {say("고객이 입력한 결정 맥락", "Your decision context")}
          </summary>
          <p>{state.decision}</p>
          <dl>
            <div>
              <dt>{t("optionA")}</dt>
              <dd>{state.optionA}</dd>
            </div>
            <div>
              <dt>{t("optionB")}</dt>
              <dd>{state.optionB}</dd>
            </div>
          </dl>
        </details>
      </section>
      <section className="v2-analysis-section">
        {head(
          "03",
          "Decision Structure",
          say(
            "환경과 준비 조건의 연결",
            "How environment and readiness fit together"
          )
        )}
        <V2FactorMap analysis={analysis} />
      </section>
      <section className="v2-analysis-section" id="v2-safety">
        {head(
          "04",
          "Safety Margin",
          say(
            "계획이 틀려도 회복할 수 있는 범위",
            "Room to recover if the plan is wrong"
          )
        )}
        <V2SafetyView analysis={analysis} band={core.safetyMargin.band} />
      </section>
      <section className="v2-analysis-section" id="v2-changing">
        {head(
          "05",
          "Changing",
          say(
            "목표를 유지하며 실행 구조를 바꾸는 방법",
            "Ways to change the structure while keeping the goal"
          )
        )}
        <V2ChangingView analysis={analysis} />
      </section>
      <V2ExternalBoard
        state={state}
        intelligence={intelligence}
        phase={evidencePhase}
        onCheckEvidence={onCheckEvidence}
      />
      <section className="v2-analysis-section">
        {head(
          "06",
          "Next Experiment",
          say(
            "다음 결정을 위한 작은 검증",
            "A bounded test for the next decision"
          )
        )}
        <V2ExperimentView analysis={analysis} compact />
      </section>
      <div className="v2-report-cta">
        <div>
          <p className="v2-kicker">Decision Brief</p>
          <h2>
            {draft
              ? say(
                  "외부 근거를 확인하면 분석을 완성할 수 있습니다",
                  "Complete the analysis by checking external evidence"
                )
              : t("reportInvite")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onReport}
          disabled={evidencePhase === "loading"}
        >
          {evidencePhase === "loading"
            ? t("evidenceChecking")
            : draft
              ? say("구조 초안 보기", "View structural draft")
              : t("openReport")}{" "}
          ↗
        </button>
      </div>
    </main>
  );
}
