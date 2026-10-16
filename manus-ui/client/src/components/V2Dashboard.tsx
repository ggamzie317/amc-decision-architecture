import V2IndicatorProfile from "./V2IndicatorProfile";
import V2ReadingGuide, { V2LeadAndReasons } from "./V2ReadingGuide";
import { v2AsEntered, v2DecisionText, v2RoleFields } from "../data/v2InputGlossary";
import V2PathMap from "./V2PathMap";
import V2ExecutiveBrief from "./V2ExecutiveBrief";
import V2FrameworkPlan from "./V2FrameworkPlan";
import V2InsightBoard from "./V2InsightBoard";
import { v2PostureCoverageNote } from "../data/v2PostureCoverage";
import { v2SharedSourceNote } from "../data/v2SourceSharing";
import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2State } from "../data/amcV2Model";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2EvidenceCheckedDate, v2EvidenceLanguageNote } from "../data/v2ReportPresentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import {
  v2t,
  v2DirectionLabel,
  v2EvidenceDimensionLabel,
  type V2CopyKey,
} from "../data/v2Language";
import { buildV2Analysis, type V2Analysis, type V2EvidencePhase } from "../data/amcV2Analysis";
import type { SelfChecks } from "../data/v2SelfDiagnostic";
import type { EvidenceComparison, EvidenceComparisons } from "../data/v2EvidenceComparison";
import { V2EvidenceComparisonView } from "./V2EvidenceComparisonView";
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
  analysis,
  phase,
  onCheckEvidence,
}: {
  state: V2State;
  intelligence: ExternalIntelligenceV2;
  analysis: V2Analysis;
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
          <p className="v2-kicker">{state.language === "ko" ? "출처 / 공개 자료" : "Sources / public sources"}</p>
          <h2>{t("externalBoard")}</h2>
        </div>
        <span className={demo ? "v2-demo-label" : "v2-status-label"}>
          {phase === "loading"
            ? t("evidenceChecking")
            : t(v2EvidenceStatusLabel(phase))}
        </span>
      </div>
      {phase === "live" && v2EvidenceLanguageNote(state.language, analysis.evidenceLanguage) && (
        <p className="v2-evidence-language-note">{v2EvidenceLanguageNote(state.language, analysis.evidenceLanguage)}</p>
      )}
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
              {" · "}
              {state.language === "ko"
                ? "출처 링크가 열리는 것을 확인했습니다. 내용과 적용 범위는 원문과 비교해 보세요."
                : "Source links open. Compare the claims and their scope with the original text."}
            </p>
          )}
          {phase === "live" && intelligence.sourceCoverage === "partial" && (
            <p className="v2-evidence-caveat" role="status">
              {state.language === "ko"
                ? "일부 자료를 제외해 종합 요약은 보여 드리지 않습니다. 남은 자료도 원문과 비교해 보세요."
                : "Some sources were excluded, so the combined summary is not shown. Compare the remaining sources with their original text too."}
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
                {analysis.evidenceLinks[index] && (
                  <details className="v2-evidence-trace-detail">
                    <summary>{state.language === "ko" ? "내 조건과의 관계 보기" : "How this relates to your conditions"}</summary>
                    <dl className="v2-evidence-trace">
                      <div><dt>{state.language === "ko" ? "출처가 말하는 내용" : "What the source says"}</dt><dd>{evidenceText(analysis.evidenceLinks[index].sourceFact)}</dd></div>
                      <div><dt>{state.language === "ko" ? "관련된 내 조건" : "Your related condition"}</dt><dd>{analysis.evidenceLinks[index].condition}</dd></div>
                      {analysis.evidenceLinks[index].selfReport && <div><dt>{state.language === "ko" ? "본인 응답 (외부 확인 전)" : "Your answer (not externally checked)"}</dt><dd>{analysis.evidenceLinks[index].selfReport}</dd></div>}
                      <div><dt>{state.language === "ko" ? "allofmycareer 해석" : "allofmycareer reading"}</dt><dd>{analysis.evidenceLinks[index].interpretation}</dd></div>
                      <div><dt>{state.language === "ko" ? "아직 확인할 조건" : "Still to verify"}</dt><dd>{analysis.evidenceLinks[index].unresolved}</dd></div>
                      <div><dt>{state.language === "ko" ? "다음에 할 일" : "Next step"}</dt><dd>{analysis.evidenceLinks[index].test}</dd></div>
                    </dl>
                  </details>
                )}
                <div className="v2-source">
                  {t("source")}:{" "}
                  {v2SharedSourceNote(intelligence.evidenceBlocks, index, state.language) && (
                    <b className="v2-shared-source">{v2SharedSourceNote(intelligence.evidenceBlocks, index, state.language)} · </b>
                  )}
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
  selfChecks,
  comparisons,
  onComparisonChange,
  evidencePhase = intelligence.status,
  evidenceLanguage = state.language,
  onCheckEvidence = () => {},
  onRetryFailedTopics,
  onReport,
  input,
}: {
  state: V2State;
  core: ProductApplicationV3;
  intelligence: ExternalIntelligenceV2;
  selfChecks?: SelfChecks;
  comparisons?: EvidenceComparisons;
  onComparisonChange?: (key: string, answer: EvidenceComparison) => void;
  evidencePhase?: V2EvidencePhase;
  evidenceLanguage?: V2State["language"];
  onCheckEvidence?: () => void;
  /** Shown only after a partial search: re-searches the failed topics alone. */
  onRetryFailedTopics?: () => void;
  onReport: () => void;
  /** Baseline input for engine-derived decision switches. */
  input?: import("../data/amcProductApplicationV3").ProductApplicationBuildInput;
}) {
  const t = (key: V2CopyKey) => fmt(state, key),
    ko = state.language === "ko";
  const say = (a: string, b: string) => (ko ? a : b);
  const analysis = buildV2Analysis(state, core, intelligence, evidencePhase, selfChecks, comparisons, evidenceLanguage);
  const roles = v2RoleFields(state.language, state);
  // Only the levels the customer actually chose.
  const answeredBands: Record<string, string> = Object.fromEntries(Object.entries(state.bands).filter(([k]) => state.bandSelections[k as keyof typeof state.bands]));
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
      <div className={`v2-analysis-status ${draft ? "draft" : ""}`}>
        {t(v2EvidenceStatusLabel(evidencePhase))}
        {draft && ` · ${say("검색 없이 본 초안", "Draft without public search")}`}
      </div>
      {onRetryFailedTopics && (
        <button type="button" className="v2-retry-failed" onClick={onRetryFailedTopics}>
          {t("retryFailedTopics")}
        </button>
      )}
      <V2ExecutiveBrief language={state.language} core={core} analysis={analysis} intelligence={intelligence} input={input} />
      <V2ReadingGuide language={state.language} />
      <details className="v2-overview-detail">
        <summary>{say("판단 이유와 공개 자료의 한계 자세히 보기", "See the reasoning and the limits of public sources")}</summary>
        <V2LeadAndReasons text={analysis.summary} language={state.language} />
      </details>
      <section className="v2-analysis-section" id="v2-path">
        {head("A", say("경로", "Path"), say("지금 자리에서 고민하는 커리어까지", "From where you are to the career you are considering"))}
        <V2PathMap language={state.language} state={state} core={core} analysis={analysis} intelligence={intelligence} />
      </section>
      <section className="v2-analysis-section" id="v2-indicators">
        {head("B", say("일곱 가지 조건", "Seven conditions"), say("일곱 가지 구조 지표", "Seven structural indicators"))}
        <V2IndicatorProfile language={state.language} core={core} intelligence={intelligence} bands={answeredBands} />
      </section>
      <V2InsightBoard language={state.language} core={core} analysis={analysis} intelligence={intelligence} mode="board" />
      <V2FrameworkPlan language={state.language} core={core} analysis={analysis} intelligence={intelligence} input={input} bands={answeredBands} />
      <nav
        className="v2-analysis-nav"
        aria-label={say("분석 바로가기", "Analysis navigation")}
      >
        <a href="#v2-reasons">{say("판단 이유", "Reasoning")}</a>
        <a href="#v2-map">{say("결정 지도", "Decision map")}</a>
        <a href="#v2-safety">{say("안전 여유 (Safety Margin)", "Safety Margin")}</a>
        <a href="#v2-changing">{say("경로 조정 (Changing)", "Path options (Changing)")}</a>
        <a href="#v2-simulator">{t("simulator")}</a>
      </nav>
      <section className="v2-analysis-section" id="v2-reasons">
        {head(
          "01",
          say("판단 이유", "Why this reading"),
          say(
            "지금 이렇게 판단한 이유",
            "Why this is the current reading"
          )
        )}
        <V2Reasoning analysis={analysis} intelligence={intelligence} />
      </section>
      <section className="v2-analysis-section" id="v2-conditions">
        {head("01A", say("공개 자료와 내 근거", "Public sources and your evidence"), say("공개 자료와 내 근거 비교", "Public sources compared with yours"))}
        <V2EvidenceComparisonView analysis={analysis} intelligence={intelligence} onChange={onComparisonChange} />
      </section>
      <section className="v2-analysis-section" id="v2-map">
        {head(
          "02",
          say("결정 지도", "Decision map"),
          say(
            "지킬 기반과 알아볼 경로",
            "What to keep, and the path to explore"
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
            {say("입력한 상황", "Your decision context")}
          </summary>
          <p>{v2DecisionText(state.language, state)}</p>
          <dl>
            <div>
              <dt>{t("optionA")}</dt>
              <dd>{roles.current.text}{v2AsEntered(state.language, roles.current.original)}</dd>
            </div>
            <div>
              <dt>{t("optionB")}</dt>
              <dd>{roles.target.text}{v2AsEntered(state.language, roles.target.original)}</dd>
            </div>
          </dl>
        </details>
      </section>
      <section className="v2-analysis-section">
        {head(
          "03",
          say("목표 쪽 여건", "Target-side conditions"),
          say(
            "목표 쪽 조직·직무 여건",
            "Organization and role conditions on the target side"
          )
        )}
        <V2FactorMap analysis={analysis} />
      </section>
      <section className="v2-analysis-section" id="v2-safety">
        {head(
          "04",
          say("안전 여유 (Safety Margin)", "Safety Margin"),
          say(
            "계획대로 되지 않아도 버틸 수 있는 여유",
            "Room to absorb it if the plan does not work out"
          )
        )}
        <V2SafetyView analysis={analysis} band={core.safetyMargin.band} />
      </section>
      <section className="v2-analysis-section" id="v2-changing">
        {head(
          "05",
          say("경로 조정 (Changing)", "Path options (Changing)"),
          say(
            "목표는 그대로 두고 방법을 바꾸는 길",
            "The goal stays; the way there can change"
          )
        )}
        <V2ChangingView analysis={analysis} />
      </section>
      <V2ExternalBoard
        state={state}
        intelligence={intelligence}
        analysis={analysis}
        phase={evidencePhase}
        onCheckEvidence={onCheckEvidence}
      />
      <section className="v2-analysis-section">
        {head(
          "06",
          say("다음 확인", "Next check"),
          say(
            "다음 결정 전에 작게 확인하기",
            "A small check before the next decision"
          )
        )}
        <V2ExperimentView analysis={analysis} compact />
      </section>
      <div className="v2-report-cta">
        <div>
          <p className="v2-kicker">{say("결정 보고서", "Decision report")}</p>
          <h2>
            {draft
              ? say(
                  "공개 자료를 확인하면 분석이 완성됩니다",
                  "Check public sources to complete the analysis"
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
              ? say("검색 없이 본 초안 보기", "View draft without public search")
              : t("openReport")}{" "}
          ↗
        </button>
      </div>
    </main>
  );
}
