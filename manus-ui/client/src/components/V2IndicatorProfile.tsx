import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import { v2ConditionLevel } from "../data/v2Indicators";
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
        <span>{say("내 상태와 전환 판단 기준", "Your level and the level needed for a move")}</span>
        <span>{say("근거와 해석", "Evidence and reading")}</span>
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
                aria-label={say(`${v2t(language, band as V2CopyKey)}, 전환 판단 기준 ${indicator.reference}단계`, `${v2t(language, band as V2CopyKey)}, level needed ${indicator.reference}`)}>
                {[0, 1, 2].map(step => (
                  <i key={step} data-on={level !== null && step <= level} data-baseline={step === indicator.reference} />
                ))}
              </div>
              <b>{v2ConditionLevel(indicator.key, band, language, b => v2t(language, b as V2CopyKey))}</b>
              <small>{state === "gap" ? say("기준에 못 미침", "Below the level needed") : state === "met" ? say("기준 충족", "Meets the level needed") : say("확인 전", "Not yet confirmed")}</small>
            </div>
            <div className="v2-ind-reading">
              {/* Benchmark (CareerLeader): what you said, what public sources show, our reading and what is open stay apart. */}
              <dl className="v2-ind-sources">
                <div data-source="you">
                  <dt>{say("내가 답한 것", "What you said")}</dt>
                  <dd>{indicator.variable === "externalValidation"
                    ? say("직접 답하는 항목이 아닙니다. 공개 자료로만 판단합니다.", "You do not answer this one. It is read from public sources only.")
                    : answered
                      ? `${v2t(language, answered as V2CopyKey)}${anchor ? ` — ${anchor}` : ""}`
                      : say("답하지 않음", "Not answered")}</dd>
                </div>
                <div data-source="public">
                  <dt>{say("공개 자료", "Public sources")}</dt>
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
              <p className="v2-ind-cond"><b>{say("도움이 될 때", "Helps when")}</b>{pick(indicator.worksWhen)}</p>
              <p className="v2-ind-cond weak"><b>{say("약해질 때", "Weakens when")}</b>{pick(indicator.weakensWhen)}</p>
              {state !== "met" && <p className="v2-ind-how"><b>{say("보강 방법", "How to strengthen it")}</b>{pick(indicator.how)}</p>}
            </div>
          </article>
        );
      })}
      <p className="v2-ind-note">{say(
        "막대는 답한 상태를 0~2단계로 보여 줍니다. 확률이 아닙니다. 굵게 표시한 칸은 ‘전환’ 판단에 필요한 최소 수준입니다.",
        "Bars show your answered level on a 0–2 scale. They are not a probability. The bold step is the minimum level needed for a move."
      )}</p>
      {/* Benchmark (CareerLeader): a worked reading example, and self-ratings checked with others. */}
      <p className="v2-ind-note">{say(
        "읽는 법: 막대가 ‘일부 갖춤’까지 차 있고 굵은 칸이 ‘충분함’에 있다면, 전환 판단에는 그 조건이 한 단계 더 필요하다는 뜻입니다.",
        "How to read it: if the bar reaches ‘Partly in place’ and the bold step is at ‘Strong’, that condition needs one more step for a move."
      )}</p>
      <p className="v2-ind-note">{say(
        "단계는 본인이 고른 것입니다. 가능하면 목표 분야에서 일하는 사람 한 명에게 같은 질문을 해 보고, 답이 다르면 그 차이부터 확인하세요.",
        "These levels are your own ratings. If you can, ask one person who works in the target field the same questions; where their answer differs, check that gap first."
      )}</p>
    </section>
  );
}
