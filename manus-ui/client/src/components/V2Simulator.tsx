import { useMemo, useState } from "react";
import { buildV2Analysis, type V2EvidencePhase } from "../data/amcV2Analysis";
import {
  unavailableIntelligence,
  type ExternalIntelligenceV2,
} from "../data/externalIntelligenceV2";
import {
  V2DecisionMap,
  V2SafetyView,
  V2ChangingView,
  V2ExperimentView,
} from "./V2AnalysisView";
import V2SwitchList from "./V2SwitchList";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import {
  baselineBands,
  updateScenario,
  type ScenarioOverrides,
  type ScenarioVariable,
} from "../data/amcScenario";
import {
  v2Scenario,
  type V2Sensitivity,
  type V2State,
} from "../data/amcV2Model";
import { v2t, type V2CopyKey } from "../data/v2Language";
import {
  limitV2Overrides,
  v2ScenarioComparison,
} from "../data/amcV2SensitivityView";
import V2SensitivityMatrix from "./V2SensitivityMatrix";
const key: Record<ScenarioVariable, V2CopyKey> = {
  financialRoom: "financial",
  reversibility: "reversibility",
  downsideExposure: "downside",
  internalReadiness: "readiness",
  optionBSupport: "supportBand",
  constraintLoad: "constraint",
  externalValidation: "externalValidation",
};
const choices = (variable: ScenarioVariable) =>
  variable === "downsideExposure"
    ? ["low", "moderate", "high", "unknown"]
    : variable === "constraintLoad"
      ? ["light", "material", "heavy", "unknown"]
      : ["strong", "developing", "weak", "unknown"];
export default function V2Simulator({
  state,
  input,
  baseline,
  sensitivity,
  visibleVariables,
  overrides,
  intelligence = unavailableIntelligence(state.caseType, state.language),
  evidencePhase = intelligence.status,
  onScenarioChange,
  onEvent,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  baseline: ProductApplicationV3;
  sensitivity: V2Sensitivity[];
  visibleVariables: readonly ScenarioVariable[];
  overrides: ScenarioOverrides;
  intelligence?: ExternalIntelligenceV2;
  evidencePhase?: V2EvidencePhase;
  onScenarioChange: (overrides: ScenarioOverrides) => void;
  onEvent?: (
    type:
      | "simulator_opened"
      | "scenario_variable_changed"
      | "scenario_evaluated"
      | "scenario_reset",
    metadata?: Record<string, unknown>
  ) => void;
}) {
  const t = (k: V2CopyKey) => v2t(state.language, k);
  const ko = state.language === "ko",
    say = (a: string, b: string) => (ko ? a : b);
  const [view, setView] = useState<"reading" | "map" | "plan">("reading");
  const baseBands = useMemo(() => baselineBands(input), [input]);
  const activeOverrides = useMemo(
    () => limitV2Overrides(input, visibleVariables, overrides),
    [input, visibleVariables, overrides]
  );
  const scenario = useMemo(
    () => v2Scenario(input, activeOverrides).result,
    [input, activeOverrides]
  );
  const analysis = buildV2Analysis(
    state,
    scenario,
    intelligence,
    evidencePhase
  );
  const setBand = (variable: ScenarioVariable, band: string) => {
    if (!visibleVariables.includes(variable)) return;
    const next = updateScenario(
      input,
      activeOverrides,
      variable,
      band,
      "multi"
    );
    onScenarioChange(next);
    onEvent?.("scenario_variable_changed", {
      selectedVariables: visibleVariables,
      variable,
      baselineBand: baseBands[variable],
      newBand: band,
      mode: "multi",
    });
    const result = v2Scenario(input, next).result;
    onEvent?.("scenario_evaluated", {
      selectedVariables: visibleVariables,
      mode: "multi",
      postureChanged:
        result.currentStructuralPosture.label !==
        baseline.currentStructuralPosture.label,
      safetyChanged: result.safetyMargin.band !== baseline.safetyMargin.band,
      changingChanged:
        result.changingPlays.map(play => play.family).join("|") !==
        baseline.changingPlays.map(play => play.family).join("|"),
      nextTestChanged:
        result.nextStepExperiment.whatToTest !==
        baseline.nextStepExperiment.whatToTest,
    });
  };
  const compare = v2ScenarioComparison(baseline, scenario, state.language);
  const changedImpact = compare.filter(([, before, after]) => before !== after);
  const leverImpacts = (variable: ScenarioVariable) =>
    (["posture", "safety", "changing", "nextTest"] as const)
      .filter(impact =>
        sensitivity.some(row => row.variable === variable && row[impact])
      )
      .map(impact => t(impact))
      .join(" · ");
  const overrideCount = Object.keys(activeOverrides).length;
  return (
    <section
      id="v2-simulator"
      className="v2-lab"
      aria-label={t("simulator")}
      data-testid="v2-simulator"
    >
      <div className="v2-lab-head">
        <p className="v2-kicker">04 / {t("simulator")}</p>
        <h2>{t("simulator")}</h2>
        <p>{t("simulatorIntro")}</p>
      </div>
      <div className="v2-lab-grid">
        <section className="v2-lab-controls">
          <div className="v2-lab-title">
            <h3>{t("controls")}</h3>
            <button
              type="button"
              onClick={() => {
                onScenarioChange({});
                onEvent?.("scenario_reset", {
                  selectedVariables: visibleVariables,
                  mode: "multi",
                });
              }}
            >
              {t("reset")}
            </button>
          </div>
          <div className="v2-live-summary" role="status" aria-live="polite">
            <strong>{t("impact")}</strong>
            <span>
              {changedImpact.length
                ? changedImpact.map(([label]) => t(label)).join(" · ")
                : t("noChange")}
            </span>
          </div>
          {visibleVariables.length === 0 && (
            <p className="v2-lab-empty">{t("noLevers")}</p>
          )}
          {visibleVariables.map((variable, index) => (
            <fieldset
              key={variable}
              data-testid="v2-simulator-control"
              data-variable={variable}
            >
              <legend>
                <span className="v2-lever-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {t(key[variable])}
              </legend>
              <p className="v2-lever-baseline">
                {t("currentBand")}:{" "}
                <strong>{t(baseBands[variable] as V2CopyKey)}</strong>
              </p>
              <p className="v2-lever-reach">
                {t("canAffect")}: {leverImpacts(variable)}
              </p>
              <div className="v2-control-row">
                {choices(variable).map(band => (
                  <button
                    key={band}
                    type="button"
                    aria-pressed={
                      (activeOverrides[variable] ?? baseBands[variable]) ===
                      band
                    }
                    onClick={() => setBand(variable, band)}
                  >
                    {t(band as V2CopyKey)}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </section>
        <aside className="v2-lab-impact">
          <span className="v2-kicker">{t("impact")}</span>
          <h3>
            {overrideCount
              ? `${overrideCount}${state.language === "ko" ? "" : " "}${t(overrideCount === 1 ? "conditionChanged" : "conditionsChanged")}`
              : t("noChange")}
          </h3>
          <p>{analysis.posture}</p>
          <p>
            {overrideCount
              ? analysis.summary
              : say(
                  "왼쪽 조건을 바꾸면 같은 구조 분석이 다시 실행됩니다. 개선된 부분과 여전히 남는 제약을 함께 확인하세요.",
                  "Change the conditions to rerun the same analysis. Review both improvements and constraints that remain."
                )}
          </p>
          <ul>
            {changedImpact.map(([label, before, after]) => (
              <li key={label} className="v2-impact-changed">
                <span>{t(label)}</span>
                <strong>{`${before} → ${after}`}</strong>
              </li>
            ))}
            {changedImpact.length === 0 && (
              <li className="v2-impact-empty">{t("noChange")}</li>
            )}
          </ul>
        </aside>
        <section className="v2-lab-comparison">
          <h3>
            {t("baseline")} <span aria-hidden="true">↔</span> {t("scenario")}
          </h3>
          <div className="v2-compare-grid">
            <span />
            <b>{t("baseline")}</b>
            <b>{t("scenario")}</b>
            {compare.map(([label, before, after]) => (
              <div className="v2-compare-row" key={label}>
                <span>{t(label)}</span>
                <p>{before}</p>
                <p className={before === after ? "v2-muted" : "v2-shift"}>
                  {after}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section
        className="v2-scenario-reading"
        data-testid="v2-scenario-reading"
      >
        <div className="v2-section-top">
          <div>
            <p className="v2-kicker">
              {overrideCount ? t("hypotheticalScenario") : t("baselineReading")}
            </p>
            <h2>
              {say(
                "조건을 바꾼 뒤의 전체 해석",
                "The full reading after changing conditions"
              )}
            </h2>
          </div>
        </div>
        <p className="v2-analysis-note">{t("hypotheticalNotEvidence")}</p>
        <div
          className="v2-scenario-tabs"
          role="tablist"
          aria-label={say("시나리오 결과 보기", "Scenario result view")}
        >
          {(["reading", "map", "plan"] as const).map(item => (
            <button
              key={item}
              id={`v2-scenario-tab-${item}`}
              type="button"
              role="tab"
              aria-selected={view === item}
              aria-controls="v2-scenario-panel"
              tabIndex={view === item ? 0 : -1}
              onClick={() => setView(item)}
              onKeyDown={e => {
                const tabs = ["reading", "map", "plan"] as const;
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                const next =
                  tabs[
                    (tabs.indexOf(item) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                  ];
                setView(next);
                document.getElementById(`v2-scenario-tab-${next}`)?.focus();
              }}
            >
              {item === "reading"
                ? say("해석과 안전마진", "Reading and safety")
                : item === "map"
                  ? "Decision Map"
                  : say("Changing과 다음 실험", "Changing and next test")}
            </button>
          ))}
        </div>
        <div
          id="v2-scenario-panel"
          role="tabpanel"
          aria-labelledby={`v2-scenario-tab-${view}`}
          tabIndex={0}
        >
          {view === "reading" ? (
            <>
              <div className="v2-scenario-reasons">
                {analysis.findings.map(f => (
                  <article key={f.id}>
                    <h3>{f.title}</h3>
                    <p>{f.basis}</p>
                    <p>{f.implication}</p>
                  </article>
                ))}
              </div>
              <V2SafetyView
                analysis={analysis}
                band={scenario.safetyMargin.band}
              />
            </>
          ) : view === "map" ? (
            <V2DecisionMap
              state={state}
              analysis={analysis}
              phase={evidencePhase}
              safetyBand={scenario.safetyMargin.band}
            />
          ) : (
            <>
              <V2ChangingView analysis={analysis} />
              <V2ExperimentView analysis={analysis} compact />
            </>
          )}
        </div>
      </section>
      <details className="v2-sensitivity">
        <summary>
          {say(
            "조건별 구조 변화표 자세히 보기",
            "Inspect the condition-by-condition structure changes"
          )}
        </summary>
        <div className="v2-section-top">
          <div>
            <p className="v2-kicker">05 / {t("sensitivity")}</p>
            <h2>{t("sensitivity")}</h2>
          </div>
          <p>{t("sensitivityIntro")}</p>
        </div>
        <V2SensitivityMatrix
          rows={sensitivity}
          variables={visibleVariables}
          language={state.language}
        />
      </details>
      <section className="v2-thresholds">
        <div>
          <p className="v2-kicker">06 / {t("thresholds")}</p>
          <h2>{t("thresholds")}</h2>
        </div>
        <V2SwitchList
          state={state}
          input={input}
          baseline={baseline}
          sensitivity={sensitivity}
          variables={visibleVariables}
        />
      </section>
    </section>
  );
}
