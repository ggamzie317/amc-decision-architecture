import { useMemo, useState } from "react";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import {
  baselineBands,
  updateScenario,
  scenarioVariables,
  type ScenarioOverrides,
  type ScenarioVariable,
} from "../data/amcScenario";
import {
  buildV2Sensitivity,
  v2Scenario,
  type V2State,
} from "../data/amcV2Model";
import { v2t, v2FamilyLabel, type V2CopyKey } from "../data/v2Language";
import { prioritizeV2Thresholds } from "../data/amcV2SensitivityView";
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
  const t = (k: V2CopyKey) => v2t(state.language, k),
    baseBands = baselineBands(input);
  const scenario = useMemo(
    () => v2Scenario(input, overrides).result,
    [input, overrides]
  );
  const sensitivity = useMemo(
    () => buildV2Sensitivity(input, baseline),
    [input, baseline]
  );
  const setBand = (variable: ScenarioVariable, band: string) => {
    const next = updateScenario(input, overrides, variable, band, "multi");
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
  const compare: [V2CopyKey, string, string][] = [
    [
      "posture",
      baseline.currentStructuralPosture.label,
      scenario.currentStructuralPosture.label,
    ],
    ["safety", t(baseline.safetyMargin.band), t(scenario.safetyMargin.band)],
    ["missing", baseline.missingPoint, scenario.missingPoint],
    [
      "changing",
      `${baseline.changingPlays.length} · ${baseline.changingPlays.map(p => v2FamilyLabel(state.language, p.family)).join(" · ") || t("noneYet")}`,
      `${scenario.changingPlays.length} · ${scenario.changingPlays.map(p => v2FamilyLabel(state.language, p.family)).join(" · ") || t("noneYet")}`,
    ],
    [
      "nextTest",
      baseline.nextStepExperiment.whatToTest,
      scenario.nextStepExperiment.whatToTest,
    ],
  ];
  const changeLabels = (row: (typeof sensitivity)[number]) =>
    [
      row.posture ? t("postureShifts") : null,
      row.safety ? t("safetyChanges") : null,
      row.changing ? t("changingChanges") : null,
      row.nextTest ? t("testChanges") : null,
    ]
      .filter(Boolean)
      .join(" · ") || t("noChange");
  const thresholds = prioritizeV2Thresholds(sensitivity, baseBands);
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
          {scenarioVariables.map(variable => (
            <fieldset key={variable}>
              <legend>{t(key[variable])}</legend>
              <div className="v2-control-row">
                {choices(variable).map(band => (
                  <button
                    key={band}
                    type="button"
                    aria-pressed={
                      (overrides[variable] ?? baseBands[variable]) === band
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
            {Object.keys(overrides).length
              ? `${Object.keys(overrides).length}${state.language === "ko" ? "" : " "}${t("conditionsChanged")}`
              : t("noChange")}
          </h3>
          <ul>
            {compare.map(([label, before, after]) => (
              <li
                key={label}
                className={before !== after ? "v2-impact-changed" : ""}
              >
                <span>{t(label)}</span>
                <strong>
                  {before !== after
                    ? label === "changing"
                      ? `${baseline.changingPlays.length} → ${scenario.changingPlays.length}`
                      : `${before} → ${after}`
                    : t("noChange")}
                </strong>
              </li>
            ))}
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
        <V2SensitivityMatrix rows={sensitivity} language={state.language} />
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
