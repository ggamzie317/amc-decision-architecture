import { useEffect, useRef } from "react";
import { buildV2Analysis, type V2EvidencePhase } from "../data/amcV2Analysis";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import {
  limitV2Overrides,
  v2ScenarioComparison,
} from "../data/amcV2SensitivityView";
import type { ScenarioOverrides, ScenarioVariable } from "../data/amcScenario";
import {
  inspectV2ReportDensity,
  lowDensityPages,
} from "../data/amcV2ReportDensity";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import {
  v2Scenario,
  type V2Sensitivity,
  type V2State,
} from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2EvidenceCheckedDate } from "../data/v2ReportPresentation";
import {
  v2t,
  v2CaseLabel,
  v2DirectionLabel,
  v2EvidenceDimensionLabel,
  type V2CopyKey,
} from "../data/v2Language";
import {
  V2DecisionMap,
  V2Reasoning,
  V2FactorMap,
  V2SafetyView,
  V2ChangingView,
  V2ExperimentView,
} from "./V2AnalysisView";
import V2SensitivityMatrix from "./V2SensitivityMatrix";
import V2SwitchList from "./V2SwitchList";

export default function V2Report({
  state,
  input,
  core,
  sensitivity,
  visibleVariables,
  scenarioOverrides = {},
  intelligence,
  evidencePhase = intelligence.status,
  onClose,
  onPrint,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  core: ProductApplicationV3;
  sensitivity: V2Sensitivity[];
  visibleVariables: readonly ScenarioVariable[];
  scenarioOverrides?: ScenarioOverrides;
  intelligence: ExternalIntelligenceV2;
  evidencePhase?: V2EvidencePhase;
  onClose: () => void;
  onPrint: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const t = (k: V2CopyKey) => v2t(state.language, k),
    ko = state.language === "ko";
  const say = (a: string, b: string) => (ko ? a : b);
  const evidenceText = (s: string) => v2CustomerEvidenceText(state.language, s);
  const analysis = buildV2Analysis(state, core, intelligence, evidencePhase);
  const activeOverrides = limitV2Overrides(
    input,
    visibleVariables,
    scenarioOverrides
  );
  const hypothetical = Object.keys(activeOverrides).length
    ? v2Scenario(input, activeOverrides).result
    : null;
  const scenarioAnalysis = hypothetical
    ? buildV2Analysis(state, hypothetical, intelligence, evidencePhase)
    : null;
  const scenarioChanges = hypothetical
    ? v2ScenarioComparison(core, hypothetical, state.language).filter(
        ([, a, b]) => a !== b
      )
    : [];
  const hasSources =
    (evidencePhase === "live" && intelligence.status === "live") ||
    (evidencePhase === "demo" && intelligence.status === "demo");
  const draft = !hasSources;
  const evidenceLabel = t(
    evidencePhase === "live"
      ? "liveEvidence"
      : evidencePhase === "demo"
        ? "demoBadge"
        : evidencePhase === "not_checked"
          ? "evidenceNotChecked"
          : evidencePhase === "loading"
            ? "evidenceChecking"
            : "evidenceUnavailable"
  );
  const evidenceNote =
    evidencePhase === "live"
      ? `${t("reviewedAt")}: ${v2EvidenceCheckedDate(intelligence.generatedAt, state.language)}`
      : evidencePhase === "demo"
        ? t("demoOnly")
        : evidencePhase === "not_checked"
          ? t("externalPending")
          : evidencePhase === "loading"
            ? t("evidenceLoadingHint")
            : t("evidenceRetryHint");
  useEffect(() => {
    let active = true;
    const inspect = () => {
      if (!active || !root.current) return;
      const samples = inspectV2ReportDensity(root.current);
      root.current.dataset.lowDensityPages = lowDensityPages(samples)
        .map(p => p.page)
        .join(",");
    };
    void document.fonts.ready.then(inspect);
    window.addEventListener("beforeprint", inspect);
    return () => {
      active = false;
      window.removeEventListener("beforeprint", inspect);
    };
  }, [state, core, intelligence, scenarioOverrides]);
  const page = (
    n: number,
    english: string,
    title: string,
    children: React.ReactNode
  ) => (
    <section className="v2-paper-page" data-page={n}>
      <header>
        <span>
          allofmycareer <i>/</i> Decision Brief
        </span>
        <span>
          {String(n).padStart(2, "0")} / {hasSources ? "09" : "08"}
        </span>
      </header>
      <div className="v2-paper-body">
        <p className="v2-kicker">
          {String(n).padStart(2, "0")} / {english}
        </p>
        <h2>{title}</h2>
        {children}
      </div>
      <footer>
        <span>allofmycareer</span>
        <span>
          {draft ? `${say("구조 초안", "Structural draft")} · ` : ""}
          {evidenceLabel}
        </span>
      </footer>
    </section>
  );
  const sources = (full: boolean) => (
    <div className={`v2-paper-evidence ${full ? "full" : ""}`}>
      {intelligence.evidenceBlocks.map((b, id) => (
        <article key={id} data-provenance="EXTERNAL_EVIDENCE">
          <span>
            {String(id + 1).padStart(2, "0")} /{" "}
            {v2EvidenceDimensionLabel(state.language, b.dimension)} ·{" "}
            {v2DirectionLabel(state.language, b.direction)}
          </span>
          <h3>{evidenceText(b.headline)}</h3>
          <p>{evidenceText(b.fact)}</p>
          {full ? (
            <>
              <p>
                <b>{t("whyMatters")}</b> {evidenceText(b.whyItMatters)}
              </p>
              <p>
                <b>
                  {say(
                    "현재 조건과의 연결",
                    "Connection to current conditions"
                  )}
                </b>{" "}
                {analysis.evidenceLinks[id]?.condition}
              </p>
              <p>{analysis.evidenceLinks[id]?.interpretation}</p>
            </>
          ) : (
            <p>
              {say("적용 범위", "Applicability")}:{" "}
              {evidenceText(b.whyItMatters)}
            </p>
          )}
          <small>
            {t("source")}:{" "}
            {b.sourceUrl ? (
              <a href={b.sourceUrl} target="_blank" rel="noreferrer">
                {b.sourceLabel}
              </a>
            ) : (
              b.sourceLabel
            )}
            {b.sourceDate && b.sourceDateKind && (
              <>
                {" "}
                ·{" "}
                {t(
                  b.sourceDateKind === "published"
                    ? "sourcePublished"
                    : "sourceUpdated"
                )}
                : {b.sourceDate}
              </>
            )}
          </small>
          {!full && b.sourceUrl && (
            <span className="v2-paper-url">{b.sourceUrl}</span>
          )}
        </article>
      ))}
    </div>
  );
  return (
    <div
      ref={root}
      className="v2-report-shell v2-analysis-report"
      data-testid="v2-report"
    >
      <div className="v2-report-toolbar">
        <button onClick={onClose}>{t("closeReport")}</button>
        <span>
          {draft
            ? say(
                "구조 초안 / 외부 근거 미확인",
                "Structural draft / external evidence unresolved"
              )
            : t("report")}
        </span>
        <button onClick={onPrint} disabled={evidencePhase === "loading"}>
          {t("print")}
        </button>
      </div>
      {page(
        1,
        "Executive Overview",
        analysis.topic,
        <>
          <div className="v2-cover">
            <div>
              <p>
                {draft
                  ? say(
                      "구조 초안 · 외부 근거 미확인",
                      "Structural draft · external evidence unresolved"
                    )
                  : evidenceLabel}
              </p>
              <p>{t("baselineReading")}</p>
              <h1>{analysis.posture}</h1>
              <p>{v2CaseLabel(state.language, state.caseType)}</p>
            </div>
            <div className="v2-cover-mark">allofmycareer</div>
          </div>
          <p className="v2-paper-caption">
            {t("context")}: {state.decision}
          </p>
          <p className="v2-paper-lead">{analysis.summary}</p>
          <div className="v2-paper-priorities">
            <article>
              <span>01 / {say("핵심 질문", "Key question")}</span>
              <h3>{analysis.question}</h3>
            </article>
            <article>
              <span>02 / Safety Margin</span>
              <h3>{t(core.safetyMargin.band)}</h3>
              <p>{analysis.boundary}</p>
            </article>
            <article>
              <span>03 / {say("다음 확인", "Next test")}</span>
              <h3>{analysis.experiment.output}</h3>
              <p>{analysis.experiment.action}</p>
            </article>
          </div>
          <p className="v2-paper-caption">
            {say(
              "이 분석은 선택을 대신 결정하지 않습니다. 현재 조건에서 무엇을 지키고, 어떤 근거가 확보되면 다음 범위를 검토할 수 있는지 보여 줍니다.",
              "This brief does not decide for you. It shows what to protect and which evidence would make the next scope worth reviewing."
            )}
          </p>
        </>
      )}
      {page(
        2,
        "Structural Reading",
        say("현재 구조 판단의 이유", "Why the current structure leads here"),
        <>
          <V2Reasoning
            analysis={analysis}
            intelligence={intelligence}
            compact
          />
          <div className="v2-paper-note">
            <strong>
              {say(
                "판단을 다시 검토할 근거",
                "What would warrant reassessment"
              )}
            </strong>
            <p>{analysis.experiment.continue}</p>
            <p>
              {say(
                "한 조건의 개선이 남은 제약을 해결하는지는 7·8쪽의 조건 변화 분석에서 확인하세요.",
                "Check pages 7–8 to see whether improving one condition resolves the remaining constraints."
              )}
            </p>
          </div>
        </>
      )}
      {page(
        3,
        "External Evidence × Current Conditions",
        say(
          "공개 근거를 현재 조건에 대조",
          "Public evidence in the current decision"
        ),
        <>
          <div className="v2-paper-band">
            <span>{evidenceLabel}</span>
            <p>{evidenceNote}</p>
            {evidencePhase === "live" && (
              <p>
                {say(
                  "출처 링크 접근을 확인했습니다. 주장과 적용 범위는 원문에서 대조하세요.",
                  "Source links were reachable. Compare claims and applicability with the source text."
                )}
              </p>
            )}
            <p>{analysis.externalReading}</p>
          </div>
          {hasSources ? (
            sources(true)
          ) : (
            <div className="v2-paper-note">
              <strong>
                {say(
                  "외부 조건이 확인되지 않았습니다",
                  "External conditions remain unresolved"
                )}
              </strong>
              <p>{analysis.question}</p>
              <p>{analysis.experiment.action}</p>
              <p>
                {say(
                  "대시보드에서 공개 근거를 확인한 뒤, 같은 스냅샷을 사용해 이 보고서를 다시 열 수 있습니다.",
                  "Check public evidence on the dashboard, then reopen this report using the same snapshot."
                )}
              </p>
            </div>
          )}
        </>
      )}
      {page(
        4,
        "Decision Map / Decision Structure",
        say("경로와 조건의 관계", "Relationships between paths and conditions"),
        <>
          <V2DecisionMap
            state={state}
            analysis={analysis}
            phase={evidencePhase}
            safetyBand={core.safetyMargin.band}
          />
          <V2FactorMap analysis={analysis} compact />
        </>
      )}
      {page(
        5,
        "Safety Margin",
        say(
          "계획이 틀려도 회복할 수 있는가",
          "Can you recover if the plan is wrong?"
        ),
        <>
          <V2SafetyView analysis={analysis} band={core.safetyMargin.band} />
          <div className="v2-paper-note">
            <strong>
              {say("가장 먼저 해결할 질문", "First question to resolve")}
            </strong>
            <h3>{analysis.question}</h3>
            <p>{analysis.findings[0].implication}</p>
            <p>{analysis.experiment.pause}</p>
          </div>
        </>
      )}
      {page(
        6,
        "Changing / Next Experiment",
        say(
          "목표를 유지하며 실행 구조 조정",
          "Reconfigure the path while keeping the goal"
        ),
        <>
          <V2ChangingView analysis={analysis} />
          <V2ExperimentView analysis={analysis} compact />
        </>
      )}
      {page(
        7,
        "Interactive Scenario / Sensitivity",
        t("scenarioSensitivity"),
        <>
          <div className="v2-paper-band">
            <span>{t("baselineReading")}</span>
            <strong>
              {analysis.posture} / Safety Margin: {t(core.safetyMargin.band)}
            </strong>
            <p>{t("sensitivityIntro")}</p>
          </div>
          {hypothetical && scenarioAnalysis && (
            <div className="v2-paper-scenario">
              <strong>{t("hypotheticalScenario")}</strong>
              <p>{t("hypotheticalNotEvidence")}</p>
              {scenarioChanges.length ? (
                scenarioChanges.map(([label, before, after]) => (
                  <p key={label}>
                    {t(label)}: {`${before} → ${after}`}
                  </p>
                ))
              ) : (
                <p>{t("noChange")}</p>
              )}
              <p>{scenarioAnalysis.summary}</p>
              <p>
                <b>{say("달라진 실행 범위", "Revised execution boundary")}</b>{" "}
                {scenarioAnalysis.boundary}
              </p>
            </div>
          )}
          <V2SensitivityMatrix
            rows={sensitivity}
            variables={visibleVariables}
            language={state.language}
          />
          <p className="v2-paper-caption">
            {say(
              "각 행은 한 조건만 바꿔 같은 엔진을 실행한 결과입니다. 모든 선택지를 비교한 순위나 성공 확률이 아닙니다. 여러 조건을 함께 바꾸는 분석은 대시보드 시뮬레이터에서 확인할 수 있습니다.",
              "Each row changes one condition and reruns the same engine. It is not a ranking or success probability. Use the dashboard simulator to explore combined changes."
            )}
          </p>
        </>
      )}
      {page(
        8,
        "Switching / 30–60–90-Day Validation",
        say(
          "전환 조건과 검증 계획",
          "Switching conditions and validation plan"
        ),
        <>
          <V2SwitchList
            state={state}
            input={input}
            baseline={core}
            sensitivity={sensitivity}
            variables={visibleVariables}
            report
          />
          <p className="v2-paper-caption">{evidenceNote}</p>
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
        </>
      )}
      {hasSources &&
        page(
          9,
          "Sources / Scope / Decision Context",
          t("sourceNotes"),
          <>
            <p className="v2-paper-caption">
              {evidenceNote.replace(/\.$/, "")}.{" "}
              {evidencePhase === "demo"
                ? say(
                    "이 페이지는 합성 예시입니다. 실제 출처와 주장 검증을 대신하지 않습니다.",
                    "This is a synthetic example, not a check of actual sources or claims."
                  )
                : say(
                    "접근 가능한 출처라는 사실만으로 주장이 검증된 것은 아닙니다. 표본·시점·지역의 제한을 실제 목표 조건과 대조해야 합니다.",
                    "Source accessibility does not prove a claim. Check sample, timing and geography against the actual target conditions."
                  )}
            </p>
            {sources(false)}
            {intelligence.uncertainties.length > 0 && (
              <p className="v2-paper-caption">
                {t("uncertainty")}:{" "}
                {intelligence.uncertainties.map(evidenceText).join(" · ")}
              </p>
            )}
            <div className="v2-paper-context">
              <strong>
                {say("고객 입력 맥락", "Customer decision context")}
              </strong>
              <p>{state.decision}</p>
              <p>A: {state.optionA}</p>
              <p>B: {state.optionB}</p>
            </div>
          </>
        )}
    </div>
  );
}
