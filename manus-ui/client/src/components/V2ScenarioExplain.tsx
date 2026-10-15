import { ArrowDownRight, ArrowUpRight, Lightbulb } from "lucide-react";
import { derivePostureAssessment, type ProductApplicationBuildInput } from "../data/amcProductApplicationV3";
import { baselineBands, type ScenarioOverrides } from "../data/amcScenario";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2t, type V2CopyKey, type V2Language } from "../data/v2Language";

/**
 * Explains a simulator scenario in customer terms: what each changed
 * condition means, how the change moves the reading relative to the
 * existing thresholds, and what would make it true in reality (linked to
 * evidence where available). Uses the existing formula only.
 */
// Copy pairs are stored [Korean, English].
const meaning: Record<string, { label: V2CopyKey; what: [ko: string, en: string]; how: [ko: string, en: string]; evidence?: RegExp }> = {
  financialRoom: { label: "financial", what: ["계획대로 되지 않아도 버틸 수 있는 돈과 소득의 여유", "Money and income to absorb a plan that does not work out"],
    how: ["준비 기간에 필요한 생활비와 비용을 계산하고, 그만큼을 따로 떼어 둡니다.", "Work out living costs and expenses for the preparation period and set that amount aside."],
    evidence: /(?:HK\$|US\$|£|€|\$|₩)\s?\d|\d[\d,.]*\s?(?:원|만 ?원|파운드|달러|유로)/ },
  reversibility: { label: "reversibility", what: ["잘 안 되면 원래 자리로 돌아올 수 있는 정도", "How far you can return if it does not work"],
    how: ["휴직·복직 제도, 재지원, 계약 조건 등 돌아올 길을 문서로 확인합니다.", "Confirm a way back in writing: leave and return, re-application, contract terms."],
    evidence: /원격|시간제|파트타임|병행|휴직|part-time|remote|leave/i },
  downsideExposure: { label: "downside", what: ["계획대로 되지 않았을 때 잃을 수 있는 것의 크기", "How much you could lose if the plan does not work out"],
    how: ["되돌릴 수 없는 지출·퇴사 같은 결정을 근거가 생길 때까지 미룹니다.", "Defer irreversible spending or resignation until evidence appears."] },
  internalReadiness: { label: "readinessBand", what: ["새 경로가 요구하는 역량과 결과물을 이미 갖춘 정도", "How far you already have the skills and work the new path needs"],
    how: ["요구 역량 중 부족한 것을 하나 골라 결과물(과제·자격·포트폴리오)로 만듭니다.", "Pick one missing requirement and turn it into a work sample, credential or portfolio piece."],
    evidence: /역량|자격|요건|요구|skill|qualif|requirement/i },
  optionBSupport: { label: "supportBand", what: ["새 경로를 실제로 도와줄 사람·제도·시간", "People, programmes and time that will actually help the new path"],
    how: ["도와줄 사람과 제도를 이름과 역할까지 구체적으로 확보합니다.", "Secure named people and programmes with specific roles."],
    evidence: /장학|지원|후원|scholar|fund|support|sponsor/i },
  constraintLoad: { label: "constraint", what: ["본업·가족·건강 등 동시에 감당해야 하는 부담", "Load from work, family or health you carry at the same time"],
    how: ["일정과 역할을 조정해 새 경로를 준비할 시간을 비워 둡니다.", "Rearrange schedules and roles to free time to prepare for the new path."] },
  externalValidation: { label: "externalValidation", what: ["공개 자료로 확인된 시장·요건의 뒷받침", "Market and requirement support confirmed by public sources"],
    how: ["목표 경로의 공식 요건·수요 자료를 찾아 내 조건과 비교합니다.", "Check official requirements and demand for the target and compare them with your conditions."] },
};

function distance(support: number, ko: boolean) {
  if (support >= 8) return ko ? "전환 판단 기준에 도달" : "At the level needed for a move";
  if (support <= 1) return ko ? "재정비 판단 기준에 도달" : "At the level that calls for reorganising";
  const toTransition = 8 - support;
  return ko
    ? toTransition <= 2 ? "전환 판단 기준에 가까움" : "중간 구간 · 현재 계획 유지"
    : toTransition <= 2 ? "Close to the level needed for a move" : "Middle range · keep the current plan";
}

export default function V2ScenarioExplain({
  language,
  input,
  scenarioInput,
  overrides,
  intelligence,
}: {
  language: V2Language;
  input: ProductApplicationBuildInput;
  scenarioInput: ProductApplicationBuildInput;
  overrides: ScenarioOverrides;
  intelligence: ExternalIntelligenceV2;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const base = baselineBands(input) as Record<string, string>;
  const changed = Object.entries(overrides).filter(([key, band]) => band !== undefined && band !== base[key]);
  if (!changed.length) return null;
  const before = derivePostureAssessment(input).support;
  const after = derivePostureAssessment(scenarioInput).support;
  const blocks = intelligence.status === "live" || intelligence.status === "demo" ? intelligence.evidenceBlocks : [];
  const Arrow = after > before ? ArrowUpRight : ArrowDownRight;
  return (
    <section className="v2-scenario-explain" data-testid="v2-scenario-explain" aria-label={say("이 시나리오 해석", "What this scenario means")}>
      <h3><Lightbulb aria-hidden size={16} />{say("이 시나리오 해석", "What this scenario means")}</h3>
      <p className="v2-scenario-distance">
        <Arrow aria-hidden size={16} />
        <b>{say("판단 위치: ", "Where the reading sits: ")}</b>
        {distance(before, ko)} → <strong>{distance(after, ko)}</strong>
        <small>{after === before
          ? say("이 변화만으로는 판단 위치가 움직이지 않습니다.", "This change alone does not move the reading.")
          : after > before
            ? say("전환 쪽으로 움직였습니다.", "It moves toward transition.")
            : say("지키고 재정비하는 쪽으로 움직였습니다.", "It moves toward protecting and reorganising.")}</small>
      </p>
      <ul>
        {changed.map(([key, band]) => {
          const m = meaning[key];
          if (!m) return null;
          const card = m.evidence ? blocks.find(block => m.evidence!.test(`${block.headline} ${block.fact}`)) : undefined;
          return (
            <li key={key}>
              <strong>{v2t(language, m.label)}: {v2t(language, base[key] as V2CopyKey)} → {v2t(language, band as V2CopyKey)}</strong>
              <span><b>{say("이 조건은: ", "What it is: ")}</b>{m.what[ko ? 0 : 1]}</span>
              <span><b>{say("현실에서 이렇게 되려면: ", "To make it real: ")}</b>{m.how[ko ? 0 : 1]}</span>
              {card && <span className="v2-scenario-evidence"><b>{say("관련 근거: ", "Related evidence: ")}</b>{v2CustomerEvidenceText(language, card.headline)}{card.action ? ` — ${v2CustomerEvidenceText(language, card.action)}` : ""}</span>}
            </li>
          );
        })}
      </ul>
      <small className="v2-scenario-note">{say("가정해 본 조건입니다. 실제 상태는 위 방법으로 확인하세요. 확인하기 전까지 기준 판단은 그대로입니다.",
        "These are assumptions. Check the real state as described above. Until then, the baseline reading stays as it is.")}</small>
    </section>
  );
}
