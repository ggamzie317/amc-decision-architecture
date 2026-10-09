import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2State } from "../data/amcV2Model";
import { v2DecisionReadings } from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2t, v2DirectionLabel, type V2CopyKey } from "../data/v2Language";
import "../styles/v2.css";
const fmt = (s: V2State, key: V2CopyKey) => v2t(s.language, key);
export function V2ExternalBoard({
  state,
  intelligence,
}: {
  state: V2State;
  intelligence: ExternalIntelligenceV2;
}) {
  const t = (key: V2CopyKey) => fmt(state, key),
    demo = intelligence.status === "demo";
  const metrics = intelligence.metrics.filter(metric =>
    Number.isFinite(metric.value)
  );
  return (
    <section className="v2-external" aria-label={t("externalBoard")}>
      <div className="v2-section-top">
        <div>
          <p className="v2-kicker">03 / {t("evidence")}</p>
          <h2>{t("externalBoard")}</h2>
        </div>
        <span className={demo ? "v2-demo-label" : "v2-status-label"}>
          {demo
            ? t("demoBadge")
            : intelligence.status === "live"
              ? t("liveEvidence")
              : t("evidenceUnavailable")}
        </span>
      </div>
      {intelligence.status === "unavailable" ? (
        <div className="v2-empty-evidence">
          <span aria-hidden="true">◌</span>
          <strong>{t("evidenceUnavailable")}</strong>
          <p>{t("externalPending")}</p>
        </div>
      ) : (
        <>
          {demo && <p className="v2-evidence-caveat">{t("demoOnly")}</p>}
          <div className="v2-evidence-grid">
            {intelligence.evidenceBlocks.map((block, index) => (
              <article
                className="v2-evidence-card"
                data-provenance={block.provenance}
                key={index}
              >
                <div className="v2-evidence-number">
                  0{index + 1}{" "}
                  <span>
                    {block.dimension} ·{" "}
                    {v2DirectionLabel(state.language, block.direction)}
                  </span>
                </div>
                <h3>{block.headline}</h3>
                <p>{block.fact}</p>
                <div className="v2-evidence-why">
                  <strong>{t("whyMatters")}</strong>
                  <p>{block.whyItMatters}</p>
                </div>
                <div className="v2-source">
                  {t("source")}:{" "}
                  {block.sourceUrl ? (
                    <a href={block.sourceUrl} target="_blank" rel="noreferrer">
                      {block.sourceLabel}
                    </a>
                  ) : (
                    block.sourceLabel
                  )}
                  {block.sourceDate ? ` · ${block.sourceDate}` : ""}
                </div>
              </article>
            ))}
          </div>
          {metrics.length > 0 && (
            <div className="v2-metrics">
              {metrics.map((m, i) => (
                <article key={i}>
                  <strong>
                    {m.value} {m.unit}
                  </strong>
                  <span>{m.label}</span>
                  <small>{m.sourceLabel}</small>
                </article>
              ))}
            </div>
          )}
          <div className="v2-evidence-foot">
            <div>
              <strong>{t("opportunity")}</strong>
              <p>{intelligence.opportunitySignals.join(" · ")}</p>
            </div>
            <div>
              <strong>{t("friction")}</strong>
              <p>{intelligence.frictionSignals.join(" · ")}</p>
            </div>
            <div>
              <strong>{t("uncertainty")}</strong>
              <p>{intelligence.uncertainties.join(" · ")}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
export default function V2Dashboard({
  state,
  core,
  intelligence,
  onReport,
}: {
  state: V2State;
  core: ProductApplicationV3;
  intelligence: ExternalIntelligenceV2;
  onReport: () => void;
}) {
  const t = (key: V2CopyKey) => fmt(state, key),
    d = v2DecisionReadings(state, core);
  const items: [V2CopyKey, string, string][] = [
    ["posture", d.posture.value, d.posture.provenance],
    ["missing", d.missing.value, d.missing.provenance],
    ["safety", d.safety.value, d.safety.provenance],
    ["tradeoff", d.tension.value, d.tension.provenance],
    ["nextTest", d.nextTest.value, d.nextTest.provenance],
  ];
  const signals: [V2CopyKey, string][] = [
    ["externalValidation", core.postureBasis.externalValidation.band],
    ["readiness", core.postureBasis.internalReadiness.band],
    ["financial", core.safetyMargin.inputs.financialRoom.band],
    ["reversibility", core.safetyMargin.inputs.reversibility.band],
    ["supportBand", core.postureBasis.optionBSupport.band],
    ["constraint", core.postureBasis.constraintLoad.band],
  ];
  return (
    <main className="v2-dashboard" data-testid="v2-dashboard">
      <section className="v2-hero">
        <div className="v2-hero-copy">
          <p className="v2-kicker">01 / {t("dashboard")}</p>
          <h1>{t("currentStructure")}</h1>
          <p className="v2-hero-posture" data-provenance="DERIVED_CORE_RULE">
            {d.posture.value}
          </p>
          <p className="v2-hero-sub">
            {core.currentStructuralPosture.sentence}
          </p>
        </div>
        <div className="v2-hero-side">
          <span>{t("safety")}</span>
          <strong data-provenance="DERIVED_CORE_RULE">{d.safety.value}</strong>
          <div className="v2-hero-track">
            <i
              style={{
                width:
                  core.safetyMargin.band === "strong"
                    ? "86%"
                    : core.safetyMargin.band === "developing"
                      ? "55%"
                      : core.safetyMargin.band === "weak"
                        ? "26%"
                        : "8%",
              }}
            />
          </div>
          <small>
            {t("downside")}: {t(core.safetyMargin.inputs.downsideExposure.band)}
          </small>
        </div>
      </section>
      <section className="v2-readout" aria-label={t("currentStructure")}>
        {items.slice(1).map(([key, value, provenance], i) => (
          <article
            key={key}
            className={i === 0 ? "v2-readout-primary" : ""}
            data-provenance={provenance}
          >
            <span>
              0{i + 2} / {t(key)}
            </span>
            <strong>{value || t("noneYet")}</strong>
          </article>
        ))}
      </section>
      <section className="v2-decision-map">
        <div className="v2-section-top">
          <div>
            <p className="v2-kicker">02 / {t("decisionMap")}</p>
            <h2>{t("decisionMap")}</h2>
          </div>
        </div>
        <div className="v2-map-flow">
          <article data-provenance="USER_STRUCTURED">
            <span>{t("optionA")}</span>
            <h3>{state.optionA}</h3>
            <p>
              <b>{t("protects")}</b> {d.protects.value}
            </p>
          </article>
          <article className="v2-map-tension" data-provenance="USER_STRUCTURED">
            <span>↔ {t("tension")} ↔</span>
            <strong>{d.tension.value}</strong>
          </article>
          <article data-provenance="USER_STRUCTURED">
            <span>{t("optionB")}</span>
            <h3>{state.optionB}</h3>
            <p>
              <b>{t("opens")}</b> {d.opens.value}
            </p>
          </article>
        </div>
        <div className="v2-map-bottom">
          <span>
            <b>{t("keyConstraint")}</b> {d.constraint.value}
          </span>
          <span>
            <b>{t("validationState")}</b> {t("evidenceUnavailable")}
          </span>
        </div>
      </section>
      <section className="v2-structural">
        <div className="v2-section-top">
          <div>
            <p className="v2-kicker">{t("structuralMap")}</p>
            <h2>{t("structuralMap")}</h2>
          </div>
          <p>{t("qualitativeNote")}</p>
        </div>
        <div className="v2-signal-grid">
          {signals.map(([key, band]) => (
            <div
              key={key}
              className="v2-signal"
              data-provenance="DERIVED_CORE_RULE"
            >
              <div>
                <span>{t(key)}</span>
                <strong>{t(band as V2CopyKey)}</strong>
              </div>
              <div className={`v2-cells v2-band-${band}`}>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          ))}
        </div>
        <p className="v2-downside">
          {t("downside")} ·{" "}
          <strong>{t(core.safetyMargin.inputs.downsideExposure.band)}</strong>
        </p>
      </section>
      <V2ExternalBoard state={state} intelligence={intelligence} />
      <div className="v2-report-cta">
        <div>
          <p className="v2-kicker">{t("report")}</p>
          <h2>{t("reportInvite")}</h2>
        </div>
        <button type="button" onClick={onReport}>
          {t("openReport")} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </main>
  );
}
