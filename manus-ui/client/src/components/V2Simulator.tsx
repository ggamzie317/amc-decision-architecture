import { useMemo } from "react";
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
  prioritizeV2Thresholds,
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
  onScenarioChange,
  onEvent,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  baseline: ProductApplicationV3;
  sensitivity: V2Sensitivity[];
  visibleVariables: readonly ScenarioVariable[];
  overrides: ScenarioOverrides;
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
  const baseBands = useMemo(() => baselineBands(input), [input]);
  const activeOverrides = useMemo(
    () => limitV2Overrides(input, visibleVariables, overrides),
    [input, visibleVariables, overrides]
  );
  const scenario = useMemo(
    () => v2Scenario(input, activeOverrides).result,
    [input, activeOverrides]
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
  const changeLabels = (row: (typeof sensitivity)[number]) =>
    [
      row.posture ? t("postureShifts") : null,
      row.safety ? t("safetyChanges") : null,
      row.changing ? t("changingChanges") : null,
      row.nextTest ? t("testChanges") : null,
    ]
      .filter(Boolean)
      .join(" · ") || t("noChange");
  const thresholds = prioritizeV2Thresholds(
    sensitivity.filter(row => visibleVariables.includes(row.variable)),
    baseBands
  );
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
      <section className="v2-sensitivity">
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
      </section>
      <section className="v2-thresholds">
        <div>
          <p className="v2-kicker">06 / {t("thresholds")}</p>
          <h2>{t("thresholds")}</h2>
        </div>
        <ol>
          {thresholds.length ? (
            thresholds.map(row => (
              <li
                key={`${row.variable}-${row.band}`}
                data-testid="v2-decision-switch"
                data-variable={row.variable}
              >
                <strong>
                  {t(key[row.variable])} → {t(row.band as V2CopyKey)}
                </strong>
                <span>{changeLabels(row)}</span>
              </li>
            ))
          ) : (
            <li>
              <strong>{t("noChange")}</strong>
              <span>{t("noThreshold")}</span>
            </li>
          )}
        </ol>
      </section>
    </section>
  );
}
