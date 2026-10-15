import { ArrowRight, Flag, GitFork, MapPin, Milestone } from "lucide-react";
import { v2RoleFields } from "../data/v2InputGlossary";
import { v2BandAnchor } from "../data/v2BandAnchors";
import { v2ChartQuestion } from "../data/v2Readings";
import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2Analysis } from "../data/amcV2Analysis";
import type { V2State } from "../data/amcV2Model";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2BandLevel, v2Indicators } from "../data/v2Indicators";
import { v2t, type V2Language } from "../data/v2Language";

/**
 * Career path map: where you are, the nearest next step, the considered
 * career and alternative routes — each with what it requires and what is
 * still missing. Steps come from the engine's Changing plays and the
 * evidence; distances are descriptive, not scores.
 */
export default function V2PathMap({
  language,
  state,
  core,
  analysis,
  intelligence,
}: {
  language: V2Language;
  state: V2State;
  core: ProductApplicationV3;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const text = (value: string) => v2CustomerEvidenceText(language, value);
  const blocks = intelligence.status === "live" || intelligence.status === "demo" ? intelligence.evidenceBlocks : [];
  const [next, ...alternatives] = analysis.plays;
  const gaps = v2Indicators
    .filter(indicator => {
      const level = v2BandLevel[core.postureBasis[indicator.key].band];
      return level === null || level < indicator.reference;
    })
    .map(indicator => v2t(language, indicator.label));
  const requirement = blocks.find(block => /요건|자격|비자|요구|requirement|eligib|visa|qualif/i.test(`${block.headline} ${block.fact}`));
  const roles = v2RoleFields(language, state);
  const reversibilityNote = state.bandSelections.reversibility ? v2BandAnchor("reversibility", state.bands.reversibility, ko) : undefined;
  const current = roles.current.text;
  const target = roles.target.text;

  return (
    <section className="v2-pathmap" data-testid="v2-path-map" aria-label={say("커리어 경로 지도", "Career path map")}>
      <p className="v2-chart-question">{v2ChartQuestion("path", language)}</p>
      <div className="v2-path-lane">
        <article className="v2-path-node now">
          <span className="v2-path-tag"><MapPin aria-hidden size={14} />{say("현재 위치", "Where you are")}</span>
          <strong>{current}</strong>
          <small>{say("지키려는 것: ", "Protecting: ")}{state.protects.some(p => p !== "other") ? state.protects.filter(p => p !== "other").map(p => v2t(language, p)).join(" · ") : say("현재의 소득과 생활 기반", "current income and living base")}</small>
        </article>
        <ArrowRight aria-hidden className="v2-path-arrow" size={22} />
        <article className="v2-path-node next">
          <span className="v2-path-tag"><Milestone aria-hidden size={14} />{say("바로 다음 단계", "Next step")}</span>
          <strong>{next ? next.title : say("작게 확인할 것 1개", "One small check")}</strong>
          <small>{next ? next.move : analysis.experiment.briefAction}</small>
        </article>
        <ArrowRight aria-hidden className="v2-path-arrow" size={22} />
        <article className="v2-path-node goal">
          <span className="v2-path-tag"><Flag aria-hidden size={14} />{say("고민하는 커리어 · 목표", "Considered career · goal")}</span>
          <strong>{target}</strong>
          <small>{say("현재 판단: ", "Current reading: ")}{analysis.posture}</small>
          {requirement && <em>{say("핵심 요건: ", "Key requirement: ")}{text(requirement.headline)}</em>}
          {gaps.length > 0 && <em className="gap">{say("보강하거나 확인할 것: ", "To strengthen or confirm: ")}{gaps.slice(0, 3).join(" · ")}</em>}
        </article>
      </div>
      {next && (
        // Benchmark (Fuel50 / Phenom): the line between steps carries its conditions, not just an arrow.
        <dl className="v2-path-terms" aria-label={say("다음 단계에 필요한 것", "What the next step needs")}>
          <div><dt>{say("필요한 것", "What it needs")}</dt><dd>{next.needs}</dd></div>
          <div><dt>{say("확인할 결과", "Result to check")}</dt><dd>{next.evidence}</dd></div>
          <div><dt>{next.timeExposure ? say("확인 일정", "Check-in schedule") : say("감수할 부담", "The risk you take on")}</dt><dd>{next.timeExposure || next.exposure}</dd></div>
          <div><dt>{say("돌아올 길", "Way back")}</dt><dd>{v2t(language, core.postureBasis.reversibility.band)}{reversibilityNote ? ` — ${reversibilityNote}` : ""}</dd></div>
        </dl>
      )}
      {alternatives.length > 0 && (
        <div className="v2-path-alt">
          <span className="v2-path-tag"><GitFork aria-hidden size={14} />{say("대안 경로", "Alternative routes")}</span>
          <ul>
            {alternatives.map(play => (
              <li key={play.family}><b>{play.title}</b>{play.move}{play.needs && <small>{say("필요: ", "Needs: ")}{play.needs}</small>}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="v2-path-note">{say(
        "경로는 allofmycareer가 계산한 경로 조정안과 공개 근거로 그렸습니다. 단계 사이의 간격은 배치일 뿐, 점수가 아닙니다.",
        "Routes come from the path adjustments allofmycareer calculated and from public evidence. The spacing between steps is layout only, not a score."
      )}</p>
    </section>
  );
}
