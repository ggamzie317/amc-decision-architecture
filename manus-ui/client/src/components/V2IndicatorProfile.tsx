import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2BandAnchor } from "../data/v2BandAnchors";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2BandLevel, v2IndicatorReading, v2Indicators } from "../data/v2Indicators";
import { v2t, type V2CopyKey, type V2Language } from "../data/v2Language";

/**
 * Structural indicator profile in one consistent format (definition, your
 * state against the transition baseline, interpretation, a check question,
 * how to strengthen it, related evidence). Reads existing bands only.
 */
export default function V2IndicatorProfile({
  language,
  core,
  intelligence,
  printed = false,
  bands,
}: {
  language: V2Language;
  core: ProductApplicationV3;
  intelligence: ExternalIntelligenceV2;
  printed?: boolean;
  /** The customer's chosen levels, to show what the chosen level means. */
  bands?: Record<string, string>;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const pick = (pair: readonly [string, string]) => pair[ko ? 0 : 1];
  const blocks = intelligence.status === "live" || intelligence.status === "demo" ? intelligence.evidenceBlocks : [];
  return (
    <section className={`v2-indicators${printed ? " printed" : ""}`} data-testid="v2-indicator-profile"
      aria-label={say("구조 지표 프로필", "Structural indicator profile")}>
      <header className="v2-indicators-head">
        <span>{say("지표", "Indicator")}</span>
        <span>{say("내 상태와 전환 기준선", "Your state vs the transition baseline")}</span>
        <span>{say("해석과 확인 질문", "Reading and check question")}</span>
      </header>
      {v2Indicators.map((indicator, index) => {
        const band = core.postureBasis[indicator.key].band;
        const level = v2BandLevel[band] ?? null;
        const state = level === null ? "unknown" : level < indicator.reference ? "gap" : "met";
        const card = indicator.evidence ? blocks.find(block => indicator.evidence!.test(`${block.headline} ${block.fact}`)) : undefined;
        return (
          <article key={indicator.key} data-state={state}>
            <div className="v2-ind-name">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{v2t(language, indicator.label)}</strong>
                <small>{pick(indicator.definition)}</small>
              </div>
            </div>
            <div className="v2-ind-meter">
              <div className="v2-ind-bar" role="img"
                aria-label={say(`${v2t(language, band as V2CopyKey)}, 기준선 ${indicator.reference}단계`, `${v2t(language, band as V2CopyKey)}, baseline level ${indicator.reference}`)}>
                {[0, 1, 2].map(step => (
                  <i key={step} data-on={level !== null && step <= level} data-baseline={step === indicator.reference} />
                ))}
              </div>
              <b>{v2t(language, band as V2CopyKey)}</b>
              {indicator.variable && bands?.[indicator.variable] && v2BandAnchor(indicator.variable, bands[indicator.variable], ko) && (
                <small className="v2-ind-anchor">{v2BandAnchor(indicator.variable, bands[indicator.variable], ko)}</small>
              )}
              <small>{state === "gap" ? say("기준선 미달", "Below baseline") : state === "met" ? say("기준선 충족", "Meets baseline") : say("미확인", "Unconfirmed")}</small>
            </div>
            <div className="v2-ind-reading">
              <p>{v2IndicatorReading(level, indicator.reference, ko)}</p>
              <p className="v2-ind-question"><b>{say("확인 질문", "Check")}</b>{pick(indicator.question)}</p>
              {state !== "met" && <p className="v2-ind-how"><b>{say("보강 방법", "Strengthen")}</b>{pick(indicator.how)}</p>}
              {card && !printed && <p className="v2-ind-evidence"><b>{say("관련 근거", "Evidence")}</b>{v2CustomerEvidenceText(language, card.headline)}</p>}
            </div>
          </article>
        );
      })}
      <p className="v2-ind-note">{say(
        "막대는 입력한 상태의 단계(0~2)이며 확률이 아닙니다. 굵은 칸은 allofmycareer 판단 공식에서 '전환'이 나오는 최소 균형 수준입니다.",
        "Bars show the level of your stated condition (0–2), not a probability. The marked step is the least balanced level the allofmycareer formula reads as transition."
      )}</p>
    </section>
  );
}
