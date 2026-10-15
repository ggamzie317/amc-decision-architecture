import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2BandAnchor } from "../data/v2BandAnchors";
import { v2ChartQuestion } from "../data/v2Readings";
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
      <p className="v2-chart-question">{v2ChartQuestion("indicators", language)}</p>
      <header className="v2-indicators-head">
        <span>{say("지표", "Indicator")}</span>
        <span>{say("내 상태와 전환 기준선", "Your state vs the transition baseline")}</span>
        <span>{say("근거 구분과 조건부 해석", "Sources and conditional reading")}</span>
      </header>
      {v2Indicators.map((indicator, index) => {
        const band = core.postureBasis[indicator.key].band;
        const level = v2BandLevel[band] ?? null;
        const state = level === null ? "unknown" : level < indicator.reference ? "gap" : "met";
        const card = indicator.key === "externalValidation" ? blocks[0] : indicator.evidence ? blocks.find(block => indicator.evidence!.test(`${block.headline} ${block.fact}`)) : undefined;
        const answered = indicator.variable ? bands?.[indicator.variable] : undefined;
        const anchor = indicator.variable && answered ? v2BandAnchor(indicator.variable, answered, ko) : undefined;
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
              <b>{indicator.key === "externalValidation" && band === "unknown" ? say("근거 확인 전", "Not yet established") : v2t(language, band as V2CopyKey)}</b>
              <small>{state === "gap" ? say("기준선 미달", "Below baseline") : state === "met" ? say("기준선 충족", "Meets baseline") : say("미확인", "Unconfirmed")}</small>
            </div>
            <div className="v2-ind-reading">
              {/* Benchmark (CareerLeader): what you said, what public sources show, our reading and what is open stay apart. */}
              <dl className="v2-ind-sources">
                <div data-source="you">
                  <dt>{say("내가 답한 것", "What you said")}</dt>
                  <dd>{indicator.variable === "externalValidation"
                    ? say("직접 답하는 항목이 아닙니다 — 공개 근거로만 판단합니다.", "Not a self-reported item — read from public evidence only.")
                    : answered
                      ? `${v2t(language, answered as V2CopyKey)}${anchor ? ` — ${anchor}` : ""}`
                      : say("답하지 않음", "Not answered")}</dd>
                </div>
                <div data-source="public">
                  <dt>{say("공개 근거", "Public evidence")}</dt>
                  <dd>{card ? v2CustomerEvidenceText(language, card.headline) : "—"}</dd>
                </div>
                <div data-source="reading">
                  <dt>{say("allofmycareer 해석", "allofmycareer reading")}</dt>
                  <dd>{v2IndicatorReading(level, indicator.reference, ko)}</dd>
                </div>
                <div data-source="open">
                  <dt>{say("아직 확인할 것", "Still to check")}</dt>
                  <dd>{pick(indicator.question)}</dd>
                </div>
              </dl>
              <p className="v2-ind-cond"><b>{say("활용되는 조건", "Works when")}</b>{pick(indicator.worksWhen)}</p>
              <p className="v2-ind-cond weak"><b>{say("약해지는 조건", "Weakens when")}</b>{pick(indicator.weakensWhen)}</p>
              {state !== "met" && <p className="v2-ind-how"><b>{say("보강 방법", "Strengthen")}</b>{pick(indicator.how)}</p>}
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
