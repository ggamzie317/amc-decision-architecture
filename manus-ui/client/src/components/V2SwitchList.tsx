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
                    ? "이 조건은 본인의 적합성·수요를 실제로 확인했다는 가정입니다. 공개 자료를 읽는 것만으로 충족되지 않습니다."
                    : "This assumes actual personal fit or demand has been validated. Reading a public source does not meet this condition."
                  : postureSame
                    ? ko
                      ? "이 조건만 바꿔서는 현재 구조 판단이 바뀌지 않습니다. 남은 준비·제약·회복 조건을 함께 확인해야 합니다."
                      : "This condition alone does not change the current posture. Remaining readiness, constraints and recovery conditions still matter."
                    : ko
                      ? "이 결과는 조건이 달라졌다는 가정하에 기존 구조 분석을 다시 실행한 것입니다. 실제 변경 전에 해당 조건을 확인해야 합니다."
                      : "This reruns the existing structure under a changed assumption. Verify the condition before acting on the change."}
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
