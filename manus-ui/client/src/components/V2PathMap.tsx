import { ArrowRight, Flag, GitFork, MapPin, Milestone } from "lucide-react";
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
  const current = state.optionA.trim() || say("현재 직무", "Current role");
  const target = state.optionB.trim() || say("고민하는 커리어", "Considered career");

  return (
    <section className="v2-pathmap" data-testid="v2-path-map" aria-label={say("커리어 경로 지도", "Career path map")}>
      <div className="v2-path-lane">
        <article className="v2-path-node now">
          <span className="v2-path-tag"><MapPin aria-hidden size={14} />{say("현재 위치", "Where you are")}</span>
          <strong>{current}</strong>
          <small>{say("지키려는 것: ", "Protecting: ")}{state.protects.length ? state.protects.map(p => v2t(language, p)).join(" · ") : say("현재의 소득과 생활 기반", "current income and living base")}</small>
        </article>
        <ArrowRight aria-hidden className="v2-path-arrow" size={22} />
        <article className="v2-path-node next">
          <span className="v2-path-tag"><Milestone aria-hidden size={14} />{say("다음 단계 · 가까움", "Next step · near")}</span>
          <strong>{next ? next.title : say("작은 시험 1개", "One small test")}</strong>
          <small>{next ? next.move : analysis.experiment.briefAction}</small>
          {next && <em>{say("필요: ", "Needs: ")}{next.needs}</em>}
        </article>
        <ArrowRight aria-hidden className="v2-path-arrow" size={22} />
        <article className="v2-path-node goal">
          <span className="v2-path-tag"><Flag aria-hidden size={14} />{say("고민하는 커리어 · 목표", "Considered career · goal")}</span>
          <strong>{target}</strong>
          <small>{say("현재 구조 판단: ", "Current reading: ")}{analysis.posture}</small>
          {requirement && <em>{say("핵심 요건: ", "Key requirement: ")}{text(requirement.headline)}</em>}
          {gaps.length > 0 && <em className="gap">{say("아직 부족·미확인: ", "Still short or unconfirmed: ")}{gaps.slice(0, 3).join(" · ")}</em>}
        </article>
      </div>
      {alternatives.length > 0 && (
        <div className="v2-path-alt">
          <span className="v2-path-tag"><GitFork aria-hidden size={14} />{say("대안 경로", "Alternative routes")}</span>
          <ul>
            {alternatives.map(play => (
              <li key={play.family}><b>{play.title}</b>{play.move}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="v2-path-note">{say(
        "경로는 allofmycareer 엔진이 도출한 실행 경로 조정과 공개 근거로 그렸습니다. 거리는 설명이며 점수가 아닙니다.",
        "Routes come from the engine's Changing plays and public evidence. Distances are descriptive, not scores."
      )}</p>
    </section>
  );
}
