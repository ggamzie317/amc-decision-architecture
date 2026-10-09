import { useEffect } from "react";
import V2SensitivityMatrix from "./V2SensitivityMatrix";
import { selectV2SimulatorVariables } from "../data/amcV2SensitivityView";
import { baselineBands } from "../data/amcScenario";
import {
  inspectV2ReportDensity,
  lowDensityPages,
} from "../data/amcV2ReportDensity";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import {
  buildV2Sensitivity,
  v2DecisionReadings,
  type V2State,
} from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import {
  v2t,
  v2CaseLabel,
  v2FamilyLabel,
  v2DirectionLabel,
  type V2CopyKey,
} from "../data/v2Language";
const key = {
  financialRoom: "financial",
  reversibility: "reversibility",
  downsideExposure: "downside",
  internalReadiness: "readinessBand",
  optionBSupport: "supportBand",
  constraintLoad: "constraint",
  externalValidation: "externalValidation",
} as const;
export default function V2Report({
  state,
  input,
  core,
  intelligence,
  onClose,
  onPrint,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  core: ProductApplicationV3;
  intelligence: ExternalIntelligenceV2;
  onClose: () => void;
  onPrint: () => void;
}) {
  const t = (k: V2CopyKey) => v2t(state.language, k),
    d = v2DecisionReadings(state, core),
    sensitivity = buildV2Sensitivity(input, core),
    visibleVariables = selectV2SimulatorVariables(
      sensitivity,
      baselineBands(input)
    );
  const selected = (items: V2CopyKey[]) =>
    items.length ? items.map(t).join(" · ") : t("noneYet");
  const page = (number: number, title: string, body: React.ReactNode) => (
    <section className="v2-paper-page" data-page={number}>
      <header>
        <span>
          allofmycareer <i>/</i> {t("briefHeader")}
        </span>
        <span>
          {String(number).padStart(2, "0")} /{" "}
          {intelligence.status === "demo" ? "09" : "08"}
        </span>
      </header>
      <div className="v2-paper-body">
        <p className="v2-kicker">
          {String(number).padStart(2, "0")} / {t("briefKicker")}
        </p>
        <h2>{title}</h2>
        {body}
      </div>
      <footer>
        <span>allofmycareer</span>
        <span>
          {intelligence.status === "demo"
            ? t("demoBadge")
            : t("evidenceUnavailable")}
        </span>
      </footer>
    </section>
  );
  const fact = (
    <div className="v2-paper-fact">
      <span>{t("context")}</span>
      <p>{state.decision}</p>
    </div>
  );
  const marks = Array.from(
    new Set(
      sensitivity
        .filter(
          x =>
            visibleVariables.includes(x.variable) &&
            (x.posture || x.safety || x.changing || x.nextTest)
        )
        .map(x => x.variable)
    )
  );
  return (
    <div className="v2-report-shell" data-testid="v2-report">
      <div className="v2-report-toolbar">
        <button onClick={onClose}>{t("closeReport")}</button>
        <span>{t("report")}</span>
        <button onClick={onPrint}>{t("print")}</button>
      </div>
      {page(
        1,
        t("report"),
        <>
          <div className="v2-cover">
            <div>
              <p>{t("reportSubtitle")}</p>
              <h1>{core.currentStructuralPosture.label}</h1>
              <div className="v2-cover-rule" />
              <p>
                {t("caseConfirm")} {v2CaseLabel(state.language, state.caseType)}
              </p>
            </div>
            <div className="v2-cover-mark">allofmycareer</div>
          </div>
          {fact}
          <div className="v2-paper-tiles">
            <div>
              <span>{t("safety")}</span>
              <strong>{t(core.safetyMargin.band)}</strong>
            </div>
            <div>
              <span>{t("missing")}</span>
              <strong>{d.missing.value}</strong>
            </div>
            <div>
              <span>{t("nextTest")}</span>
              <strong>{d.nextTest.value}</strong>
            </div>
          </div>
          <p className="v2-paper-caption">
            {t("reading")} / {core.currentStructuralPosture.sentence}
          </p>
        </>
      )}
      {page(
        2,
        t("executiveBoard"),
        <>
          <div className="v2-paper-band">
            <span>{t("posture")}</span>
            <strong>{d.posture.value}</strong>
            <p>{core.currentStructuralPosture.sentence}</p>
          </div>
          <div className="v2-paper-grid two">
            <article>
              <span>{t("missing")}</span>
              <h3>{d.missing.value}</h3>
              <p>
                {t("implication")}: {d.nextTest.value}
              </p>
            </article>
            <article>
              <span>{t("tradeoff")}</span>
              <h3>{d.tradeoff.value}</h3>
              <p>
                {t("keyConstraint")}: {d.constraint.value}
              </p>
            </article>
            <article>
              <span>{t("safety")}</span>
              <h3>{d.safety.value}</h3>
              <p>
                {t("financial")}:{" "}
                {t(core.safetyMargin.inputs.financialRoom.band)} ·{" "}
                {t("reversibility")}:{" "}
                {t(core.safetyMargin.inputs.reversibility.band)}
              </p>
            </article>
            <article>
              <span>{t("validationState")}</span>
              <h3>{t("evidenceUnavailable")}</h3>
              <p>{t("qualitativeNote")}</p>
            </article>
          </div>
          <div className="v2-paper-note">
            <strong>{t("nextTest")}</strong>
            <p>{d.nextTest.value}</p>
          </div>
        </>
      )}
      {page(
        3,
        t("externalBoard"),
        <>
          <div className="v2-paper-band">
            <span>{t("evidence")}</span>
            <strong>
              {intelligence.status === "demo"
                ? t("demoBadge")
                : t("evidenceUnavailable")}
            </strong>
            <p>
              {intelligence.status === "demo"
                ? t("demoOnly")
                : t("externalPending")}
            </p>
          </div>
          <div className="v2-paper-grid two">
            {intelligence.status === "demo" ? (
              intelligence.evidenceBlocks.map((b, i) => (
                <article key={i} data-provenance="EXTERNAL_EVIDENCE">
                  <span>
                    {b.dimension} /{" "}
                    {v2DirectionLabel(state.language, b.direction)}
                  </span>
                  <h3>{b.headline}</h3>
                  <p>{b.fact}</p>
                  <p>
                    <b>{t("whyMatters")}</b> {b.whyItMatters}
                  </p>
                  <small>
                    {t("source")}: {b.sourceLabel}
                    {b.sourceDate ? ` · ${b.sourceDate}` : ""}
                  </small>
                </article>
              ))
            ) : (
              <article className="v2-paper-wide">
                <span>{t("validateArea")}</span>
                <h3>{selected(state.externalAreas)}</h3>
                <p>{t("evidenceUnavailable")}</p>
              </article>
            )}
          </div>
          <div className="v2-paper-note">
            <strong>{t("implication")}</strong>
            <p>{intelligence.implication}</p>
          </div>
        </>
      )}
      {page(
        4,
        t("optionComparison"),
        <>
          <div className="v2-paper-compare">
            <article>
              <span>
                {t("context")} / {t("optionA")}
              </span>
              <h3>{state.optionA}</h3>
              <strong>{t("protects")}</strong>
              <p>{d.protects.value}</p>
            </article>
            <div>
              ↔<small>{t("tradeoff")}</small>
            </div>
            <article>
              <span>
                {t("context")} / {t("optionB")}
              </span>
              <h3>{state.optionB}</h3>
              <strong>{t("opens")}</strong>
              <p>{d.opens.value}</p>
            </article>
          </div>
          <div className="v2-paper-note">
            <strong>{t("tradeoff")}</strong>
            <p>{d.tradeoff.value}</p>
          </div>
          <div className="v2-paper-grid two">
            <article>
              <span>{t("exposureRisk")}</span>
              <h3>{d.exposure.value}</h3>
            </article>
            <article>
              <span>{t("keyConstraint")}</span>
              <h3>{d.constraint.value}</h3>
            </article>
          </div>
          <div className="v2-paper-note">
            <strong>{t("reading")}</strong>
            <p>{core.currentStructuralPosture.sentence}</p>
          </div>
        </>
      )}
      {page(
        5,
        t("readinessSafety"),
        <>
          <div className="v2-paper-band">
            <span>{t("safety")}</span>
            <strong>{t(core.safetyMargin.band)}</strong>
            <p>
              {t("downside")}:{" "}
              {t(core.safetyMargin.inputs.downsideExposure.band)}
            </p>
          </div>
          <div className="v2-paper-bands">
            {(
              [
                "internalReadiness",
                "financialRoom",
                "reversibility",
                "downsideExposure",
                "optionBSupport",
                "constraintLoad",
                "externalValidation",
              ] as const
            ).map(variable => (
              <div key={variable}>
                <span>{t(key[variable])}</span>
                <strong>
                  {t(
                    (variable === "internalReadiness"
                      ? core.postureBasis.internalReadiness.band
                      : variable === "optionBSupport"
                        ? core.postureBasis.optionBSupport.band
                        : variable === "constraintLoad"
                          ? core.postureBasis.constraintLoad.band
                          : variable === "externalValidation"
                            ? core.postureBasis.externalValidation.band
                            : core.safetyMargin.inputs[variable]
                                .band) as V2CopyKey
                  )}
                </strong>
              </div>
            ))}
          </div>
          <div className="v2-paper-grid two">
            <article>
              <span>{t("missingAssets")}</span>
              <h3>{selected(state.missingAssets)}</h3>
            </article>
            <article>
              <span>{t("supportSource")}</span>
              <h3>{selected(state.supportSources)}</h3>
            </article>
          </div>
        </>
      )}
      {page(
        6,
        t("missingChanging"),
        <>
          <div className="v2-paper-band">
            <span>{t("missing")}</span>
            <strong>{d.missing.value}</strong>
            <p>{d.missingDetail.value}</p>
          </div>
          <div className="v2-paper-play-list">
            {core.changingPlays.slice(0, 4).map((play, i) => (
              <article key={v2FamilyLabel(state.language, play.family)}>
                <span>
                  0{i + 1} / {v2FamilyLabel(state.language, play.family)}
                </span>
                <h3>{play.title}</h3>
                <p>{play.changes}</p>
                <small>
                  {t("keyConstraint")}: {play.needs}
                </small>
              </article>
            ))}
          </div>
        </>
      )}
      {page(
        7,
        t("scenarioSensitivity"),
        <>
          <div className="v2-paper-band">
            <span>{t("thresholds")}</span>
            <strong>
              {marks.length
                ? marks.map(v => t(key[v])).join(" · ")
                : t("noChange")}
            </strong>
            <p>{t("sensitivityIntro")}</p>
          </div>
          <V2SensitivityMatrix
            rows={sensitivity}
            variables={visibleVariables}
            language={state.language}
          />
        </>
      )}
      {page(
        8,
        t("switchesPlan"),
        <>
          <div className="v2-paper-grid two">
            <article>
              <span>{t("switches")}</span>
              {core.decisionSwitches.length ? (
                core.decisionSwitches.map((sw, i) => (
                  <p key={i}>
                    <b>0{i + 1}</b> {sw.signal}
                  </p>
                ))
              ) : (
                <p>{t("noneYet")}</p>
              )}
            </article>
            <article>
              <span>{t("nextTest")}</span>
              <h3>{d.nextTest.value}</h3>
              <p>
                {t("validationState")}: {t("evidenceUnavailable")}
              </p>
            </article>
          </div>
          <div className="v2-paper-timeline">
            {core.nextStepExperiment.stages.map((stage, i) => (
              <article key={i}>
                <strong>{stage.period}</strong>
                <div>
                  <span>{stage.title}</span>
                  <p>{stage.action}</p>
                  <small>{stage.output}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="v2-paper-note">
            <strong>{t("sourceNotes")}</strong>
            <p>
              {intelligence.status === "demo"
                ? t("demoOnly")
                : t("evidenceUnavailable")}
            </p>
          </div>
        </>
      )}
      {intelligence.status === "demo" &&
        page(
          9,
          t("sourceNotes"),
          <>
            <div className="v2-paper-band">
              <span>{t("demoBadge")}</span>
              <strong>{t("demoOnly")}</strong>
              <p>{intelligence.implication}</p>
            </div>
            <div className="v2-paper-play-list">
              {intelligence.evidenceBlocks.map((b, i) => (
                <article key={i}>
                  <span>
                    0{i + 1} / {b.dimension}
                  </span>
                  <h3>{b.headline}</h3>
                  <p>{b.fact}</p>
                  <small>
                    {t("source")}: {b.sourceLabel}
                    {b.sourceDate ? ` · ${b.sourceDate}` : ""}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
    </div>
  );
}
