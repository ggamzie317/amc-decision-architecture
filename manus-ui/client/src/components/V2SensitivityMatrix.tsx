import type { V2Sensitivity } from "../data/amcV2Model";
import { groupV2Sensitivity } from "../data/amcV2SensitivityView";
import { v2t, type V2CopyKey, type V2Language } from "../data/v2Language";
import type { ScenarioVariable } from "../data/amcScenario";

const labels: Record<ScenarioVariable, V2CopyKey> = {
  financialRoom: "financial",
  reversibility: "reversibility",
  downsideExposure: "downside",
  internalReadiness: "readiness",
  optionBSupport: "supportBand",
  constraintLoad: "constraint",
  externalValidation: "externalValidation",
};
// [EN letter, KO letter, property, KO label, EN label]
const impacts = [
  ["P", "판", "posture", "현재 판단", "Current reading"],
  ["S", "안", "safety", "안전 여유", "Safety Margin"],
  ["C", "경", "changing", "경로 조정", "Path adjustment"],
  ["N", "확", "nextTest", "다음 확인", "Next check"],
] as const;
export default function V2SensitivityMatrix({
  rows,
  variables,
  language,
}: {
  rows: V2Sensitivity[];
  variables: readonly ScenarioVariable[];
  language: V2Language;
}) {
  const t = (key: V2CopyKey) => v2t(language, key);
  const ko = language === "ko";
  const legend = ko ? "진한 칸: 이 조건만 바꾸면 달라지는 부분" : "Shaded: what changes if only this condition changes";
  return (
    <div className="v2-sensitivity-matrix" data-testid="v2-sensitivity-matrix">
      <div className="v2-matrix-legend" aria-label={legend}>
        <span>{legend}</span>
        {impacts.map(([letter, koLetter, , koLabel, enLabel]) => (
          <span key={letter}>
            <b>{ko ? koLetter : letter}</b> {ko ? koLabel : enLabel}
          </span>
        ))}
      </div>
      {variables.length === 0 && (
        <p className="v2-matrix-empty">{t("noLevers")}</p>
      )}
      {groupV2Sensitivity(rows, variables).map(group => (
        <div
          className="v2-matrix-row"
          data-testid="v2-sensitivity-row"
          data-variable={group.variable}
          key={group.variable}
        >
          <strong className="v2-matrix-variable">
            {t(labels[group.variable])}
          </strong>
          <div className="v2-matrix-alternatives">
            {group.alternatives.map(row => (
              <div className="v2-matrix-alternative" key={row.band}>
                <span>{t(row.band as V2CopyKey)}</span>
                <div className="v2-matrix-impacts">
                  {impacts.map(([letter, koLetter, property, koLabel, enLabel]) => (
                    <abbr
                      key={letter}
                      className={
                        row[property] ? "v2-marker-active" : "v2-marker-muted"
                      }
                      title={`${ko ? koLabel : enLabel}: ${row[property] ? (ko ? "달라짐" : "changes") : (ko ? "그대로" : "no change")}`}
                    >
                      {ko ? koLetter : letter}
                    </abbr>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
