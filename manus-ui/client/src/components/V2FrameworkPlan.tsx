import { CheckSquare, GitBranch, GraduationCap, Search, ShieldCheck, Shuffle, Wallet } from "lucide-react";
import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2Analysis } from "../data/amcV2Analysis";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2t, type V2Language } from "../data/v2Language";

/**
 * The four allofmycareer framework elements as an action plan. Every line
 * comes from the existing engine outputs or a cited evidence card; nothing is
 * scored here. Money and skill cards are routed to the element they inform.
 */
const moneyAreas = new Set(["opportunityCost", "funding", "compensation", "pricing", "geography", "geographyMobility"]);
const skillAreas = new Set(["requiredSkills", "roleDemand", "employmentRelevance", "programOutcomes", "researchRelevance"]);

function firstSentence(text: string) {
  const match = text.match(/^.+?[.!?。](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

export default function V2FrameworkPlan({
  language,
  core,
  analysis,
  intelligence,
  printed = false,
}: {
  language: V2Language;
  core: ProductApplicationV3;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  printed?: boolean;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const text = (value: string) => v2CustomerEvidenceText(language, value);
  const cards = intelligence.status === "live" || intelligence.status === "demo" ? intelligence.evidenceBlocks : [];
  const money = cards.filter(card => card.area && moneyAreas.has(card.area));
  const skills = cards.filter(card => card.area && skillAreas.has(card.area));
  const actions = Array.from(new Set(cards.map(card => card.action).filter((a): a is string => !!a)));
  const switches = analysis.switching.length
    ? analysis.switching
    : core.decisionSwitches.slice(0, 3).map(item => ({ signal: item.signal, direction: item.direction }));

  return (
    <section className={`v2-framework-plan${printed ? " printed" : ""}`} data-testid="v2-framework-plan"
      aria-label={say("allofmycareer 프레임워크 실행 계획", "allofmycareer framework action plan")}>
      <div className="v2-plan-grid">
        <article>
          <h3><Search aria-hidden size={16} />{say("놓치기 쉬운 조건", "Missing point")}</h3>
          <strong>{analysis.missingConcept}</strong>
          <p>{analysis.question}</p>
          <small>{text(core.missingPoint)}</small>
        </article>

        <article>
          <h3><ShieldCheck aria-hidden size={16} />{say("안전 여유 · 버틸 수 있는가", "Safety Margin · can you sustain it")}</h3>
          <strong>{say("내 재정 여유: ", "Your financial room: ")}{v2t(language, core.postureBasis.safetyMargin.band)}</strong>
          {money.length ? (
            <ul className="v2-plan-money">
              {money.slice(0, 4).map((card, i) => (
                <li key={i}><Wallet aria-hidden size={14} /><span><b>{text(card.headline)}</b> {text(firstSentence(card.fact))}</span></li>
              ))}
            </ul>
          ) : (
            <p>{say("비용·소득 금액 근거는 아직 없습니다. 실제 비용(학비·생활비·가족 부양비)과 소득 공백 기간을 직접 적어 보세요.",
              "No cost or income figures yet. Write down actual costs (tuition, living, dependants) and the income gap period.")}</p>
          )}
          <small>{money.length
            ? say("위 금액을 내 저축·소득으로 몇 개월 감당할 수 있는지 계산해 보세요. 감당 기간이 시험 기간보다 짧으면 범위를 줄이세요.",
              "Work out how many months your savings and income cover these amounts. If shorter than the test period, reduce the scope.")
            : text(core.safetyMargin.reading)}</small>
        </article>

        <article>
          <h3><Shuffle aria-hidden size={16} />{say("경로 조정 (Changing)", "Changing")}</h3>
          {analysis.plays.length ? (
            <ol>
              {analysis.plays.slice(0, 3).map(play => (
                <li key={play.family}><b>{play.title}</b> {play.move}</li>
              ))}
            </ol>
          ) : (
            <p>{say("지금 조건에서는 도출된 조정 경로가 없습니다. 미확인 조건을 확인하면 다시 도출됩니다.",
              "No reconfiguration is derived under current conditions. It is re-derived once unknown conditions are confirmed.")}</p>
          )}
        </article>

        <article>
          <h3><GitBranch aria-hidden size={16} />{say("판단 전환 조건 (Switching)", "Decision switches")}</h3>
          {switches.length ? (
            <ol>
              {switches.map((item, i) => (
                <li key={i}><b>{text(item.signal)}</b> → {text(item.direction)}</li>
              ))}
            </ol>
          ) : (
            <p>{say("판단을 바꿀 조건이 아직 정해지지 않았습니다.", "No switching condition is set yet.")}</p>
          )}
        </article>
      </div>

      {(skills.length > 0 || actions.length > 0) && (
        <div className="v2-plan-prep">
          {skills.length > 0 && (
            <div>
              <h3><GraduationCap aria-hidden size={16} />{say("준비할 역량과 준비 경로", "Skills to prepare and where")}</h3>
              <ul>
                {skills.slice(0, 4).map((card, i) => (
                  <li key={i}><b>{text(card.headline)}</b> {text(firstSentence(card.fact))}</li>
                ))}
              </ul>
            </div>
          )}
          {actions.length > 0 && (
            <div>
              <h3><CheckSquare aria-hidden size={16} />{say("놓치기 쉬운 준비 체크리스트", "Preparation checklist")}</h3>
              <ul className="v2-plan-checklist">
                {actions.map((action, i) => <li key={i}>{text(action)}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
