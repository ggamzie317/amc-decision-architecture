import { CheckSquare, FlaskConical, GitBranch, ListChecks, GraduationCap, Search, ShieldCheck, Shuffle, Wallet } from "lucide-react";
import { v2HasAmount } from "../data/v2Amounts";
import type { ProductApplicationBuildInput, ProductApplicationV3 } from "../data/amcProductApplicationV3";
import { v2EngineSwitches } from "../data/v2EngineSwitches";
import type { V2Analysis } from "../data/amcV2Analysis";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2t, type V2CopyKey, type V2Language } from "../data/v2Language";
import { v2Indicators } from "../data/v2Indicators";
import { withKoreanParticle } from "../data/koreanParticle";
import { v2PlainQuestion, v2RecheckPart, v2SafetyProfile } from "../data/v2Readings";

/**
 * The four allofmycareer framework elements as an action plan. Every line
 * comes from the existing engine outputs or a cited evidence card; nothing is
 * scored here. Money and skill cards are routed to the element they inform.
 */
const moneyAreas = new Set(["opportunityCost", "funding", "compensation", "pricing", "geography", "geographyMobility"]);
const skillAreas = new Set(["requiredSkills", "roleDemand", "employmentRelevance", "programOutcomes", "researchRelevance"]);

function firstSentences(text: string, count: number) {
  const parts = text.match(/[^.!?。]+[.!?。]+(?=\s|$)/g);
  return parts ? parts.slice(0, count).join(" ").trim() : text;
}

function firstSentence(text: string) {
  const match = text.match(/^.+?[.!?。](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

export default function V2FrameworkPlan({
  language,
  core,
  analysis,
  intelligence,
  input,
  printed = false,
  bands = {},
}: {
  language: V2Language;
  core: ProductApplicationV3;
  /** Baseline input; enables engine-derived switches. */
  input?: ProductApplicationBuildInput;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  printed?: boolean;
  /** The customer's chosen levels (only those actually answered). */
  bands?: Record<string, string>;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const text = (value: string) => v2CustomerEvidenceText(language, value);
  const cards = intelligence.status === "live" || intelligence.status === "demo" ? intelligence.evidenceBlocks : [];
  // Any card stating an amount informs Safety Margin (fees, loans, wages, costs).
  const hasAmount = v2HasAmount;
  const money = cards.filter(card => (card.area && moneyAreas.has(card.area)) || hasAmount(`${card.headline} ${card.fact}`));
  const skills = cards.filter(card => card.area && skillAreas.has(card.area));
  const actions = Array.from(new Set(cards.map(card => card.action).filter((a): a is string => !!a)));
  // A customer-chosen switch names a condition by its label; find the variable it refers to.
  const switchVariable = (signal: string): string | undefined => {
    const labelled: [string, V2CopyKey][] = [
      ["financialRoom", "financial"], ["reversibility", "reversibility"], ["downsideExposure", "downside"],
      ["internalReadiness", "readinessBand"], ["optionBSupport", "supportBand"], ["constraintLoad", "constraint"],
    ];
    const hit = labelled.find(([, label]) => signal.startsWith(v2t(language, label)));
    if (hit) return hit[0];
    return /확인된다면|confirmed|근거|evidence/i.test(signal) ? "externalValidation" : undefined;
  };
  // Customer-chosen switches first, then the ones the engine itself finds (A3).
  const engineSwitches = input ? v2EngineSwitches(input, core, language) : [];
  const switches = [
    ...analysis.switching.map(item => ({ ...item, engine: false, variable: switchVariable(item.signal) })),
    ...engineSwitches.map(item => ({ signal: item.signal, direction: item.direction, engine: true, variable: item.variable as string | undefined })),
  ].slice(0, 4);
  // Customer-specific open items for the Missing point (A4).
  const unknownLabels: Record<string, [string, string]> = {
    externalValidation: ["market evidence", "시장 근거"], internalReadiness: ["readiness", "실행 준비도"],
    safetyMargin: ["safety margin", "안전 여유"], reversibility: ["reversibility", "되돌릴 여지"],
    optionBSupport: ["support", "실행 지원"], structuralRisk: ["downside", "손실 위험"], constraintLoad: ["constraints", "제약"],
  };
  const unknownKeys = Object.entries(core.postureBasis)
    .filter(([key, signal]) => unknownLabels[key] && signal.band === "unknown")
    .map(([key]) => key);
  const safety = v2SafetyProfile(bands, language);
  const experiment = analysis.experiment;
  const uncovered = analysis.researchCoverage.filter(row => row.status === "none").map(row => row.title);
  // Intermediate routes the evidence itself shows, for Changing (A5).
  const routeCards = cards.filter(card => /원격|시간제|파트타임|병행|주말|온라인|단계적|remote|part-time|online|weekend|distance|phased/i.test(`${card.headline} ${card.fact}`));

  return (
    <section className={`v2-framework-plan${printed ? " printed" : ""}`} data-testid="v2-framework-plan"
      aria-label={say("allofmycareer 프레임워크 실행 계획", "allofmycareer framework action plan")}>
      {analysis.situation.length > 0 && (
        <div className="v2-plan-situation">
          <h3><ListChecks aria-hidden size={16} />{say("내 상황에서 확인할 것", "What to check in your situation")}</h3>
          <ul>
            {analysis.situation.map(item => (
              <li key={item.id}>
                <span className="v2-plan-fact">{item.question} <b>{item.answer}</b></span>
                {item.check && <span>{item.check}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="v2-plan-grid">
        <article>
          <h3><Search aria-hidden size={16} />{say("놓치기 쉬운 조건", "Missing point")}</h3>
          <small className="v2-plan-plain">{v2PlainQuestion("missing", language)}</small>
          <strong>{analysis.missingConcept}</strong>
          <p>{analysis.question}</p>
          {unknownKeys.length > 0 && (
            <ul className="v2-plan-unknowns">
              {unknownKeys.map(key => {
                const indicator = v2Indicators.find(item => item.key === key);
                return (
                  <li key={key}>
                    <b>{unknownLabels[key][ko ? 1 : 0]}</b>
                    {indicator && <span>{say("중요한 이유: ", "Why it matters: ")}{indicator.definition[ko ? 0 : 1]}</span>}
                    {indicator && <span>{say("확인 방법: ", "How to check: ")}{indicator.question[ko ? 0 : 1]}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          {uncovered.length > 0 && (
            <ul className="v2-plan-open">
              <li><b>{say("공개 근거를 못 찾은 주제: ", "Topics without public evidence: ")}</b>{uncovered.join(" · ")}</li>
            </ul>
          )}
          {(unknownKeys.length > 0 || uncovered.length > 0) && (
            <small className="v2-plan-note">{say("확인되지 않았다고 위험하다는 뜻은 아닙니다. 확인해 보면 걱정이 커질 수도, 사라질 수도 있습니다.",
              "Unconfirmed does not mean risky. Checking may raise the concern or remove it.")}</small>
          )}
          <small>{text(core.missingPoint)}</small>
        </article>

        <article>
          <h3><ShieldCheck aria-hidden size={16} />{say("안전 여유 (Safety Margin)", "Safety Margin")}</h3>
          <small className="v2-plan-plain">{v2PlainQuestion("safety", language)}</small>
          <strong>{say("내 재정 여유: ", "Your financial room: ")}{v2t(language, core.postureBasis.safetyMargin.band)}</strong>
          {(safety.absorbs.length > 0 || safety.exposed.length > 0) && (
            <dl className="v2-plan-absorb">
              {safety.absorbs.length > 0 && <div><dt>{say("버틸 수 있는 것", "You can absorb")}</dt><dd>{safety.absorbs.join(" · ")}</dd></div>}
              {safety.exposed.length > 0 && <div><dt>{say("버티기 어려운 상황", "Hard to absorb")}</dt><dd>{safety.exposed.join(" · ")}</dd></div>}
            </dl>
          )}
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
          <small className="v2-plan-certainty">{say(
            `근거가 얼마나 확실한지는 따로 봅니다. 금액 자료 ${money.length}건 · 재정 단계는 본인 응답${safety.unknownCount ? ` · 답하지 않은 항목 ${safety.unknownCount}개` : ""}`,
            `How certain the evidence is, seen separately: ${money.length} cost source(s) · your financial level is your own answer${safety.unknownCount ? ` · ${safety.unknownCount} not answered` : ""}`
          )}</small>
          <small>{money.length
            ? say("위 금액을 내 저축과 소득으로 몇 개월 감당할 수 있는지 계산해 보세요. 그 기간이 준비 기간보다 짧으면, 한 번에 옮기기보다 작은 단계로 먼저 확인하세요.",
              "Work out how many months your savings and income can cover these amounts. If that is shorter than the preparation period, check in small steps before moving fully.")
            : text(core.safetyMargin.reading)}</small>
        </article>

        <article>
          <h3><Shuffle aria-hidden size={16} />{say("경로 조정 (Changing)", "Changing")}</h3>
          <small className="v2-plan-plain">{v2PlainQuestion("changing", language)}</small>
          {analysis.plays.length ? (
            <ol>
              {analysis.plays.slice(0, 3).map(play => (
                <li key={play.family}><b>{play.title}</b> {play.move}</li>
              ))}
            </ol>
          ) : (
            <p>{say("지금 조건으로는 제시할 조정안이 없습니다. 확인 전인 조건을 확인하면 다시 계산합니다.",
              "No path adjustment comes out of the current conditions. It is recalculated once the unconfirmed conditions are checked.")}</p>
          )}
          {routeCards.length > 0 && (
            <ul className="v2-plan-open">
              <li><b>{say("자료에서 확인된 중간 단계: ", "In-between routes found in the evidence: ")}</b>{routeCards.slice(0, 2).map(card => text(card.headline)).join(" · ")}</li>
            </ul>
          )}
        </article>

        <article>
          <h3><GitBranch aria-hidden size={16} />{say("판단 전환 조건 (Switching)", "Decision switches")}</h3>
          <small className="v2-plan-plain">{v2PlainQuestion("switching", language)}</small>
          {switches.length ? (
            <ol>
              {switches.map((item, i) => (
                <li key={i}>
                  <b>{text(item.signal)}</b> → {text(item.direction)}
                  {item.engine && <em className="v2-plan-engine">{say("자동 계산", "calculated")}</em>}
                  <span className="v2-plan-recheck">{say("바뀌면 다시 볼 부분: ", "Then re-check: ")}{v2RecheckPart(item.variable, language)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>{say("판단을 바꿀 조건을 아직 정하지 않았습니다.", "No switching condition is set yet.")}</p>
          )}
        </article>
      </div>

      {/* Benchmark (Careershifters): the next step is tied to the uncertainty it reduces. */}
      <div className="v2-plan-experiment">
        <h3><FlaskConical aria-hidden size={16} />{say("다음 30일, 작게 확인하기", "Next 30 days: a small check")}<small>{v2PlainQuestion("experiment", language)}</small></h3>
        <dl>
          <div><dt>{say("확인할 가정", "Assumption to check")}</dt><dd>{say(`${withKoreanParticle(`‘${analysis.missingConcept}’`, "이/가")} 실제로 맞는지`, `Whether “${analysis.missingConcept}” actually holds`)}</dd></div>
          <div><dt>{say("작게 해 볼 일", "Small step")}</dt><dd>{firstSentences(experiment.action, 2)}</dd></div>
          <div><dt>{say("남길 기록", "What to record")}</dt><dd>{experiment.output}</dd></div>
          <div><dt>{say("규모를 줄일 때", "When to scale back")}</dt><dd>{experiment.pause}</dd></div>
        </dl>
      </div>

      {(skills.length > 0 || actions.length > 0) && (
        <div className="v2-plan-prep">
          {skills.length > 0 && (
            <div>
              <h3><GraduationCap aria-hidden size={16} />{say("준비할 역량과 준비 경로", "Skills to prepare and where")}</h3>
              <p className="v2-plan-mine">{say("내 실행 준비도: ", "Your readiness: ")}<b>{v2t(language, core.postureBasis.internalReadiness.band)}</b></p>
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
