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
const impacts = [
  ["P", "posture", "posture"],
  ["S", "safety", "safety"],
  ["C", "changing", "changing"],
  ["N", "nextTest", "nextTestShort"],
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
  return (
    <div className="v2-sensitivity-matrix" data-testid="v2-sensitivity-matrix">
      <div className="v2-matrix-legend" aria-label={t("impactLegend")}>
        <span>{t("impactLegend")}</span>
        {impacts.map(([letter, , label]) => (
          <span key={letter}>
            <b>{letter}</b> {t(label)}
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
                  {impacts.map(([letter, property, label]) => (
                    <abbr
                      key={letter}
                      className={
                        row[property] ? "v2-marker-active" : "v2-marker-muted"
                      }
                      title={`${t(label)}: ${row[property] ? t("changeLabel") : t("noChange")}`}
                    >
                      {letter}
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
