import { CalendarCheck, CircleDollarSign, GitBranch, Search, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ProductApplicationBuildInput, ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2Analysis } from "../data/amcV2Analysis";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2EngineSwitches } from "../data/v2EngineSwitches";
import { v2PostureCoverageNote } from "../data/v2PostureCoverage";
import { v2t, type V2CopyKey, type V2Language } from "../data/v2Language";

/**
 * Executive brief: the whole analysis in keywords at a glance. Every keyword
 * is taken from an existing output — posture, evidence amounts, the weakest
 * structural signal, the missing point, a decision switch and the first
 * preparation step. Nothing new is scored.
 */
const amountPattern = /(?:HK\$|US\$|A\$|S\$|£|€|\$|₩)\s?\d[\d,.]*(?:\s?(?:만|억|천))?|\d[\d,.]*\s?(?:만 ?원|억 ?원|원|파운드|달러|유로)/;

export function v2AmountKeywords(blocks: ExternalIntelligenceV2["evidenceBlocks"], language: V2Language, max = 3) {
  const out: { amount: string; label: string }[] = [];
  for (const block of blocks) {
    const source = `${block.headline} ${block.fact}`;
    const match = source.match(amountPattern);
    if (!match) continue;
    const label = v2CustomerEvidenceText(language, block.headline).replace(amountPattern, "").replace(/[:：,·\s]+$/, "").trim();
    out.push({ amount: match[0].trim(), label: label.length > 26 ? `${label.slice(0, 25)}…` : label });
    if (out.length >= max) break;
  }
  return out;
}

const signalOrder: [keyof ProductApplicationV3["postureBasis"], V2CopyKey][] = [
  ["safetyMargin", "safety"], ["internalReadiness", "readinessBand"], ["externalValidation", "externalValidation"],
  ["reversibility", "reversibility"], ["optionBSupport", "supportBand"], ["structuralRisk", "downside"], ["constraintLoad", "constraint"],
];
const weak = new Set(["weak", "high", "heavy"]);

export default function V2ExecutiveBrief({
  language,
  core,
  analysis,
  intelligence,
  input,
  printed = false,
  cardsOnly = false,
}: {
  language: V2Language;
  core: ProductApplicationV3;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  input?: ProductApplicationBuildInput;
  printed?: boolean;
  /** Report cover already shows the posture; print only the keyword cards. */
  cardsOnly?: boolean;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const text = (value: string) => v2CustomerEvidenceText(language, value);
  const blocks = intelligence.status === "live" || intelligence.status === "demo" ? intelligence.evidenceBlocks : [];
  const amounts = v2AmountKeywords(blocks, language);
  const weakest = signalOrder.find(([key]) => weak.has(core.postureBasis[key].band))
    ?? signalOrder.find(([key]) => core.postureBasis[key].band === "unknown");
  const weakestBand = weakest ? core.postureBasis[weakest[0]].band : null;
  const switchItem = analysis.switching[0] ?? (input ? v2EngineSwitches(input, core, language, 1)[0] : undefined);
  const firstAction = blocks.find(block => block.action)?.action;
  const coverage = v2PostureCoverageNote(core, language);
  const cards: { icon: LucideIcon; label: string; keyword: string; detail: string; tone?: "warn" }[] = [
    {
      icon: CircleDollarSign,
      label: say("핵심 숫자", "Key figures"),
      keyword: amounts[0]?.amount ?? say("금액 근거 없음", "No figures yet"),
      detail: amounts.length
        ? amounts.map(a => `${a.amount} ${a.label}`).join(" · ")
        : say("학비·생활비·임금 같은 금액이 확인되면 여기에 표시됩니다.", "Costs, fees or pay appear here once confirmed."),
    },
    {
      icon: TriangleAlert,
      label: say("가장 큰 부족", "Biggest gap"),
      keyword: weakest ? v2t(language, weakest[1]) : say("뚜렷한 부족 없음", "No clear gap"),
      detail: weakest && weakestBand
        ? say(`현재 ${v2t(language, weakestBand as V2CopyKey)} — 이 조건이 판단을 가장 크게 제한합니다.`,
          `Now ${v2t(language, weakestBand as V2CopyKey)} — this condition limits the reading most.`)
        : say("입력한 조건 중 약한 항목이 없습니다.", "None of your conditions is weak."),
      tone: weakest ? "warn" : undefined,
    },
    {
      icon: Search,
      label: say("놓치기 쉬운 조건", "Easy to miss"),
      keyword: analysis.missingConcept,
      detail: analysis.question,
    },
    {
      icon: GitBranch,
      label: say("판단을 바꿀 조건", "What would change it"),
      keyword: switchItem ? text(switchItem.signal).split(/ \+ |: /)[0] : say("아직 없음", "None yet"),
      detail: switchItem ? `${text(switchItem.signal)} → ${text(switchItem.direction)}` : say("조건이 정해지면 표시됩니다.", "Appears once a condition is set."),
    },
    {
      icon: CalendarCheck,
      label: say("다음 30일 할 일", "Next 30 days"),
      keyword: say("작은 시험 1개", "One small test"),
      detail: firstAction ? text(firstAction) : analysis.experiment.briefAction,
    },
  ];

  return (
    <section className={`v2-brief${printed ? " printed" : ""}`} data-testid="v2-executive-brief" aria-label={say("핵심 요약", "Executive brief")}>
      {!cardsOnly && <div className="v2-brief-head">
        <div>
          <p className="v2-kicker">{say("핵심 요약", "Executive brief")} / {analysis.topic}</p>
          <h1>{analysis.posture}</h1>
          <p className="v2-brief-coverage" data-coverage={coverage.level}>
            {coverage.text}
          </p>
        </div>
        <aside>
          <span>{say("판단을 바꿀 핵심 질문", "The question that matters")}</span>
          <strong>{analysis.question}</strong>
        </aside>
      </div>}
      <div className="v2-brief-cards">
        {cards.map(({ icon: Icon, label, keyword, detail, tone }) => (
          <article key={label} data-tone={tone}>
            <span className="v2-brief-label"><Icon aria-hidden size={15} />{label}</span>
            <strong className="v2-brief-keyword">{keyword}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
