import { useMemo, useState } from "react";
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
  buildV2Sensitivity,
  v2Scenario,
  type V2State,
} from "../data/amcV2Model";
import { v2t, type V2CopyKey } from "../data/v2Language";
import {
  limitV2Overrides,
  prioritizeV2Thresholds,
  selectV2SimulatorVariables,
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
  onEvent,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  baseline: ProductApplicationV3;
  onEvent?: (
    type:
      | "simulator_opened"
      | "scenario_variable_changed"
      | "scenario_evaluated"
      | "scenario_reset",
    metadata?: Record<string, unknown>
  ) => void;
}) {
  const [overrides, setOverrides] = useState<ScenarioOverrides>({});
  const t = (k: V2CopyKey) => v2t(state.language, k);
  const baseBands = useMemo(() => baselineBands(input), [input]);
  const sensitivity = useMemo(
    () => buildV2Sensitivity(input, baseline),
    [input, baseline]
  );
  const visibleVariables = useMemo(
    () => selectV2SimulatorVariables(sensitivity, baseBands),
    [sensitivity, baseBands]
  );
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
    setOverrides(next);
    onEvent?.("scenario_variable_changed", {
      variable,
      baselineBand: baseBands[variable],
      newBand: band,
      mode: "multi",
    });
    const result = v2Scenario(input, next).result;
    onEvent?.("scenario_evaluated", {
      mode: "multi",
      postureChanged:
        result.currentStructuralPosture.label !==
        baseline.currentStructuralPosture.label,
      safetyChanged: result.safetyMargin.band !== baseline.safetyMargin.band,
      changingChanged:
        result.changingPlays.length !== baseline.changingPlays.length,
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
                setOverrides({});
                onEvent?.("scenario_reset", { mode: "multi" });
              }}
            >
              {t("reset")}
            </button>
          </div>
          <p className="v2-lab-hold">{t("baselineHold")}</p>
          {visibleVariables.map(variable => (
            <fieldset
              key={variable}
              data-testid="v2-simulator-control"
              data-variable={variable}
            >
              <legend>{t(key[variable])}</legend>
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
        <aside className="v2-lab-impact">
          <span className="v2-kicker">{t("impact")}</span>
          <h3>
            {Object.keys(activeOverrides).length
              ? `${Object.keys(activeOverrides).length}${state.language === "ko" ? "" : " "}${t(Object.keys(activeOverrides).length === 1 ? "conditionChanged" : "conditionsChanged")}`
              : t("noChange")}
          </h3>
          <ul>
            {changedImpact.map(([label, before, after]) => (
              <li key={label} className="v2-impact-changed">
                <span>{t(label)}</span>
                <strong>
                  {label === "changing"
                    ? `${baseline.changingPlays.length} → ${scenario.changingPlays.length}`
                    : `${before} → ${after}`}
                </strong>
              </li>
            ))}
            {changedImpact.length === 0 && (
              <li className="v2-impact-empty">{t("noChange")}</li>
            )}
          </ul>
        </aside>
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
              <li key={`${row.variable}-${row.band}`}>
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
