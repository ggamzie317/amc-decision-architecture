import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import { baselineBands, type ScenarioVariable } from "../data/amcScenario";
import {
  v2Scenario,
  type V2Sensitivity,
  type V2State,
} from "../data/amcV2Model";
import {
  prioritizeV2Thresholds,
  v2ScenarioComparison,
} from "../data/amcV2SensitivityView";
import { v2t, type V2CopyKey } from "../data/v2Language";

export const v2VariableLabel: Record<ScenarioVariable, V2CopyKey> = {
  financialRoom: "financial",
  reversibility: "reversibility",
  downsideExposure: "downside",
  internalReadiness: "readinessBand",
  optionBSupport: "supportBand",
  constraintLoad: "constraint",
  externalValidation: "externalValidation",
};
/** Actual engine results, reused in the interactive dashboard and the saved brief. */
export default function V2SwitchList({
  state,
  input,
  baseline,
  sensitivity,
  variables,
  report = false,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  baseline: ProductApplicationV3;
  sensitivity: V2Sensitivity[];
  variables: readonly ScenarioVariable[];
  report?: boolean;
}) {
  const t = (k: V2CopyKey) => v2t(state.language, k),
    ko = state.language === "ko";
  const bands = baselineBands(input),
    rows = prioritizeV2Thresholds(
      sensitivity.filter(r => variables.includes(r.variable)),
      bands
    );
  return (
    <ol
      className="v2-switch-analysis"
      data-testid={report ? "v2-report-switches" : undefined}
    >
      {rows.length ? (
        rows.map(row => {
          const result = v2Scenario(input, { [row.variable]: row.band }).result;
          const changes = v2ScenarioComparison(
            baseline,
            result,
            state.language
          ).filter(([, a, b]) => a !== b);
          const postureSame =
            result.currentStructuralPosture.label ===
            baseline.currentStructuralPosture.label;
          return (
            <li
              key={row.variable}
              data-testid={report ? "v2-report-switch" : "v2-decision-switch"}
              data-variable={row.variable}
            >
              <strong>
                {t(v2VariableLabel[row.variable])}:{" "}
                {t(bands[row.variable] as V2CopyKey)} →{" "}
                {t(row.band as V2CopyKey)}
              </strong>
              <p>
                {changes.length
                  ? changes
                      .map(([label, a, b]) => `${t(label)}: ${a} → ${b}`)
                      .join(" · ")
                  : t("noChange")}
              </p>
              <small>
                {row.variable === "externalValidation"
                  ? ko
                    ? "내가 목표에 맞는지, 실제 수요가 있는지 확인했다고 가정한 결과입니다. 공개 자료를 읽는 것만으로는 이 조건이 채워지지 않습니다."
                    : "This assumes you have actually confirmed your fit and real demand. Reading public sources alone does not meet it."
                  : postureSame
                    ? ko
                      ? "이 조건 하나만 바뀌어서는 현재 판단이 달라지지 않습니다. 준비도, 제약, 되돌아올 여유도 함께 확인하세요."
                      : "This condition alone does not change the current reading. Check readiness, constraints and room to absorb a setback as well."
                    : ko
                      ? "이 조건이 달라진다면 판단이 이렇게 바뀐다는 계산입니다. 실제로 움직이기 전에 이 조건이 사실인지 확인하세요."
                      : "This shows how the reading would change if this condition were different. Before acting, check that the condition is real."}
              </small>
            </li>
          );
        })
      ) : (
        <li>
          <strong>{t("noChange")}</strong>
          <p>{t("noThreshold")}</p>
        </li>
      )}
    </ol>
  );
}
