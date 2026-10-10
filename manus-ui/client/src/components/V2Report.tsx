import { useEffect } from "react";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import V2SensitivityMatrix from "./V2SensitivityMatrix";
import {
  limitV2Overrides,
  prioritizeV2Thresholds,
  v2ScenarioComparison,
} from "../data/amcV2SensitivityView";
import { baselineBands } from "../data/amcScenario";
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
  v2DecisionReadings,
  v2Scenario,
  type V2Sensitivity,
  type V2State,
} from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import {
  v2CustomerPlayText,
  v2CustomerPosture,
  v2EvidenceCheckedDate,
} from "../data/v2ReportPresentation";
import {
  v2t,
  v2CaseLabel,
  v2FamilyLabel,
  v2DirectionLabel,
  v2EvidenceDimensionLabel,
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
  evidencePhase?: "not_checked" | "loading" | "live" | "unavailable" | "demo";
  onClose: () => void;
  onPrint: () => void;
}) {
  const t = (k: V2CopyKey) => v2t(state.language, k),
    d = v2DecisionReadings(state, core);
  const evidenceText = (value: string) =>
    v2CustomerEvidenceText(state.language, value);
  const posture = v2CustomerPosture(
    state.language,
    core.currentStructuralPosture.label,
    core.currentStructuralPosture.sentence,
    state.optionA,
    state.optionB
  );
  const activeOverrides = limitV2Overrides(
    input,
    visibleVariables,
    scenarioOverrides
  );
  const hypothetical = Object.keys(activeOverrides).length
    ? v2Scenario(input, activeOverrides).result
    : null;
  const scenarioChanges = hypothetical
    ? v2ScenarioComparison(core, hypothetical, state.language).filter(
        ([, before, after]) => before !== after
      )
    : [];
  const switchRows = prioritizeV2Thresholds(
    sensitivity.filter(row => visibleVariables.includes(row.variable)),
    baselineBands(input)
  );
  const selected = (items: V2CopyKey[]) =>
    items.length ? items.map(t).join(" · ") : t("noneYet");
  const hasSources =
    intelligence.status === "live" || intelligence.status === "demo";
  const evidenceLabel =
    intelligence.status === "live"
      ? t("liveEvidence")
      : intelligence.status === "demo"
        ? t("demoBadge")
        : evidencePhase === "not_checked"
          ? t("evidenceNotChecked")
          : evidencePhase === "loading"
            ? t("evidenceChecking")
            : t("evidenceUnavailable");
  const evidenceNote =
    intelligence.status === "live"
      ? `${t("reviewedAt")}: ${v2EvidenceCheckedDate(intelligence.generatedAt, state.language)}`
      : intelligence.status === "demo"
        ? t("demoOnly")
        : evidencePhase === "not_checked"
          ? t("externalPending")
          : evidencePhase === "loading"
            ? t("evidenceChecking")
            : t("evidenceRetryHint");
  const page = (number: number, title: string, body: React.ReactNode) => (
    <section className="v2-paper-page" data-page={number}>
      <header>
        <span>
          allofmycareer <i>/</i> {t("briefHeader")}
        </span>
        <span>
          {String(number).padStart(2, "0")} / {hasSources ? "09" : "08"}
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
        <span>{evidenceLabel}</span>
      </footer>
    </section>
  );
  const fact = (
    <div className="v2-paper-fact">
      <span>{t("context")}</span>
      <p>{state.decision}</p>
    </div>
  );
  const marks = visibleVariables.filter(variable =>
    sensitivity.some(
      row =>
        row.variable === variable &&
        (row.posture || row.safety || row.changing || row.nextTest)
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
              {hypothetical && <p>{t("baselineReading")}</p>}
              <h1>{posture.label}</h1>
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
            {t("reading")} / {posture.sentence}
          </p>
        </>
      )}
      {page(
        2,
        t("executiveBoard"),
        <>
          <div className="v2-paper-band">
            <span>{t("posture")}</span>
            <strong>{posture.label}</strong>
            <p>{posture.sentence}</p>
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
              <span>{t("publicEvidenceStatus")}</span>
              <h3>{evidenceLabel}</h3>
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
            <strong>{evidenceLabel}</strong>
            <p>{evidenceNote}</p>
          </div>
          <div className="v2-paper-grid two">
            {hasSources ? (
              intelligence.evidenceBlocks.map((b, i) => (
                <article key={i} data-provenance="EXTERNAL_EVIDENCE">
                  <span>
                    {evidenceText(
                      v2EvidenceDimensionLabel(state.language, b.dimension)
                    )}{" "}
                    / {v2DirectionLabel(state.language, b.direction)}
                  </span>
                  <h3>{evidenceText(b.headline)}</h3>
                  <p>{evidenceText(b.fact)}</p>
                  <p>
                    <b>{t("whyMatters")}</b> {evidenceText(b.whyItMatters)}
                  </p>
                  <small>
                    {t("source")}:{" "}
                    {b.sourceUrl ? (
                      <a href={b.sourceUrl}>{b.sourceLabel}</a>
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
                </article>
              ))
            ) : (
              <article className="v2-paper-wide">
                <span>{t("validateArea")}</span>
                <h3>{selected(state.externalAreas)}</h3>
                <p>{evidenceLabel}</p>
              </article>
            )}
          </div>
          <div className="v2-paper-note">
            <strong>{t("implication")}</strong>
            <p>{evidenceText(intelligence.implication)}</p>
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
            <p>{posture.sentence}</p>
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
                <h3>{v2CustomerPlayText(state.language, play.title)}</h3>
                <p>{v2CustomerPlayText(state.language, play.changes)}</p>
                <small>
                  {t("playNeeds")}:{" "}
                  {v2CustomerPlayText(state.language, play.needs)}
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
            <span>{t("baselineReading")}</span>
            <strong>
              {marks.length
                ? marks.map(v => t(key[v])).join(" · ")
                : t("noChange")}
            </strong>
            <p>{t("sensitivityIntro")}</p>
          </div>
          {hypothetical && (
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
            </div>
          )}
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
            <article data-testid="v2-report-switches">
              <span>{t("switches")}</span>
              {switchRows.length ? (
                switchRows.map((row, i) => (
                  <p
                    key={i}
                    data-testid="v2-report-switch"
                    data-variable={row.variable}
                  >
                    <b>0{i + 1}</b> {t(key[row.variable])} →{" "}
                    {t(row.band as V2CopyKey)}
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
                {t("publicEvidenceStatus")}: {evidenceLabel}
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
            <p>{evidenceNote}</p>
          </div>
        </>
      )}
      {hasSources &&
        page(
          9,
          t("sourceNotes"),
          <>
            <div className="v2-paper-band">
              <span>{evidenceLabel}</span>
              <strong>{evidenceNote}</strong>
              <p>{evidenceText(intelligence.implication)}</p>
            </div>
            <div className="v2-paper-play-list">
              {intelligence.evidenceBlocks.map((b, i) => (
                <article key={i}>
                  <span>
                    0{i + 1} /{" "}
                    {evidenceText(
                      v2EvidenceDimensionLabel(state.language, b.dimension)
                    )}
                  </span>
                  <h3>{evidenceText(b.headline)}</h3>
                  <p>{evidenceText(b.fact)}</p>
                  <small>
                    {t("source")}: {b.sourceLabel}
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
                    {b.sourceUrl && (
                      <span className="v2-paper-source-url">{b.sourceUrl}</span>
                    )}
                  </small>
                </article>
              ))}
            </div>
          </>
        )}
    </div>
  );
}
