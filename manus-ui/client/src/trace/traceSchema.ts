import { AMC_ANALYSIS_SEQUENCE } from "../data/amcProductApplicationV3";
import type { V2CopyKey, V2Language } from "../data/v2Language";
import { v2CaseLabel, v2t } from "../data/v2Language";
import { v2ConditionLevel, v2Indicators } from "../data/v2Indicators";
import { v2DecisionText } from "../data/v2InputGlossary";
import { v2RecheckPart, v2SafetyProfile } from "../data/v2Readings";
import { v2BandAnchor } from "../data/v2BandAnchors";
import type { V2TraceSnapshot } from "./traceSnapshot";

/**
 * Decision Trace — schema.
 *
 * The screen is generated from this list: one stage per step of the official
 * allofmycareer analysis sequence (AMC_ANALYSIS_SEQUENCE), in the same order
 * and with the same terms. Each stage declares the snapshot fields it reads,
 * the conclusion it shows and the reasons behind it, each reason tagged with
 * where it came from. Stages only read existing outputs; nothing is scored.
 * Pairs are stored [Korean, English].
 */
type Pair = readonly [ko: string, en: string];
export type TraceSource = "you" | "public" | "engine" | "open";
export type TraceReason = {
  label: string;
  value: string;
  source: TraceSource;
  /** Index into intelligence.evidenceBlocks, when a public fact supports this reason. */
  evidenceIds?: number[];
  note?: string;
};
export type TraceStageId = (typeof AMC_ANALYSIS_SEQUENCE)[number];
export type TraceStage = {
  id: TraceStageId;
  /** The framework's own name for the step, unchanged. */
  term: Pair;
  /** The plain question the step answers. */
  question: Pair;
  /** Snapshot fields this stage reads (checked by a test against real data). */
  reads: string[];
  /** Later stages that use what this stage establishes. */
  feeds: TraceStageId[];
  conclusion: (s: V2TraceSnapshot) => string;
  reasons: (s: V2TraceSnapshot) => TraceReason[];
  /** Shows the evidence cards inline. */
  showsEvidence?: boolean;
};

const pick = (pair: Pair, language: V2Language) => pair[language === "ko" ? 0 : 1];
const say = (s: V2TraceSnapshot, ko: string, en: string) => (s.language === "ko" ? ko : en);
const label = (s: V2TraceSnapshot, key: string) => v2t(s.language, key as V2CopyKey);
const chips = (s: V2TraceSnapshot, keys: readonly string[]) =>
  keys.filter(k => k !== "other").map(k => label(s, k)).join(" · ");

/** Where a structural signal came from, in trace terms. */
export function traceSource(source: string): TraceSource {
  if (source === "current-user-structured" || source === "canonical-current-case") return "you";
  if (source === "live-external-evidence") return "public";
  if (source === "current-case-derived") return "engine";
  return "open";
}

const signalLabels: Record<string, V2CopyKey> = {
  externalValidation: "externalValidation", internalReadiness: "readinessBand", safetyMargin: "safety",
  reversibility: "reversibility", optionBSupport: "supportBand", structuralRisk: "downside", constraintLoad: "constraint",
};
const favourable: Record<string, number> = { strong: 2, developing: 1, weak: 0, low: 2, moderate: 1, high: 0, light: 2, material: 1, heavy: 0 };

function signalReasons(s: V2TraceSnapshot): TraceReason[] {
  return v2Indicators.map(indicator => {
    const signal = s.core.postureBasis[indicator.key];
    const level = favourable[signal.band];
    const position = level === undefined
      ? say(s, "중간값으로 계산", "counted as a middle value")
      : level >= indicator.reference
        ? say(s, "전환 판단 기준 충족", "meets the level needed for a move")
        : say(s, "전환 판단 기준에 못 미침", "below the level needed for a move");
    const answered = indicator.variable && s.state.bandSelections[indicator.variable as keyof V2TraceSnapshot["state"]["bands"]]
      ? v2BandAnchor(indicator.variable, s.state.bands[indicator.variable as keyof V2TraceSnapshot["state"]["bands"]], s.language === "ko")
      : undefined;
    return {
      label: label(s, signalLabels[indicator.key]),
      value: `${v2ConditionLevel(indicator.key, signal.band, s.language, b => label(s, b))} — ${position}`,
      source: traceSource(signal.source),
      evidenceIds: indicator.key === "externalValidation" ? s.intelligence.evidenceBlocks.map((_, i) => i) : undefined,
      note: answered,
    };
  });
}

export const v2TraceStages: TraceStage[] = [
  {
    id: "User Input",
    term: ["입력한 상황", "Your input"],
    question: ["무엇을 두고 고민하고 있나요?", "What are you deciding between?"],
    reads: ["state.optionA", "state.optionB", "state.caseType", "state.whyNow", "state.protects", "state.opens", "state.exposes", "analysis.situation"],
    feeds: ["FIFWM / Decision Structure", "Current Structural Posture", "Safety Margin"],
    conclusion: s => v2DecisionText(s.language, s.state),
    reasons: s => [
      { label: say(s, "결정 유형", "Decision type"), value: v2CaseLabel(s.language, s.state.caseType), source: "engine" as const, note: say(s, "입력한 두 칸에서 자동으로 판단했습니다.", "Inferred from the two fields you wrote.") },
      ...(s.state.whyNow.length ? [{ label: say(s, "지금 고민하는 이유", "Why now"), value: chips(s, s.state.whyNow), source: "you" as const }] : []),
      ...(s.state.protects.length ? [{ label: say(s, "지키려는 것", "What you protect"), value: chips(s, s.state.protects), source: "you" as const }] : []),
      ...(s.state.opens.length ? [{ label: say(s, "얻으려는 것", "What you hope to gain"), value: chips(s, s.state.opens), source: "you" as const }] : []),
      ...(s.state.exposes.length ? [{ label: say(s, "걱정되는 위험", "Risks you named"), value: chips(s, s.state.exposes), source: "you" as const }] : []),
      ...s.analysis.situation.map(item => ({ label: item.question, value: item.answer, source: "you" as const, note: item.check })),
    ],
  },
  {
    id: "Live External Evidence",
    term: ["공개 자료", "Public sources"],
    question: ["공개 자료로 무엇이 확인됐고, 무엇이 아직인가요?", "What do public sources confirm, and what is still open?"],
    reads: ["analysis.researchCoverage", "intelligence.evidenceBlocks", "core.postureBasis.externalValidation"],
    feeds: ["FIFWM / Decision Structure", "Current Structural Posture", "Safety Margin"],
    showsEvidence: true,
    conclusion: s => {
      const found = s.analysis.researchCoverage.filter(row => row.status === "found").length;
      const total = s.analysis.researchCoverage.length;
      const cards = s.intelligence.status === "live" || s.intelligence.status === "demo" ? s.intelligence.evidenceBlocks.length : 0;
      const items = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;
      // State the topic count only when it agrees with the cards (older or demo cards carry no topic).
      if (cards === 0) return say(s, "아직 찾은 공개 자료가 없습니다.", "No public sources found yet.");
      if (found === 0 || total === 0) return say(s, `공개 자료 ${cards}건을 찾았습니다.`, `Found ${items(cards)} in public sources.`);
      return say(s, `조사한 주제 ${total}개 중 ${found}개에서 공개 자료 ${cards}건을 찾았습니다.`, `Public sources found for ${found} of ${total} topics (${items(cards)}).`);
    },
    reasons: s => [
      ...s.analysis.researchCoverage.map(row => ({
        label: row.title,
        value: row.status === "found" ? say(s, `자료 ${row.evidenceIds.length}건`, `${row.evidenceIds.length} ${row.evidenceIds.length === 1 ? "item" : "items"}`)
          : row.status === "pending" ? say(s, "찾는 중", "Collecting")
            : row.status === "not_searched" ? say(s, "아직 찾지 않음", "Not searched yet")
              : say(s, "찾은 자료 없음", "Nothing usable found"),
        source: row.status === "found" ? "public" as const : "open" as const,
        evidenceIds: row.evidenceIds,
      })),
      {
        label: say(s, "판단에 들어간 방식", "How it enters the reading"),
        value: v2ConditionLevel("externalValidation", s.core.postureBasis.externalValidation.band, s.language, b => label(s, b)),
        source: traceSource(s.core.postureBasis.externalValidation.source),
        note: say(s, "공개 자료는 점수로 바뀌지 않고, ‘시장 근거’ 한 항목으로만 판단에 반영됩니다.", "Public sources never become a score; they enter the reading only as the single ‘Market evidence’ condition."),
      },
    ],
  },
  {
    id: "FIFWM / Decision Structure",
    term: ["다섯 가지 관점 (FIFWM)", "Five lenses (FIFWM)"],
    question: ["기회·연결·구조·실행·지속은 각각 어떤 상태인가요?", "Where do opportunity, connection, structure, execution and staying power stand?"],
    reads: ["analysis.factors", "core.decisionStructure"],
    feeds: ["What You May Be Missing", "Current Structural Posture"],
    conclusion: s => s.analysis.factors.some(f => f.assessed)
      ? say(s, `다섯 요소 중 ${s.analysis.factors.filter(f => f.assessed).length}개를 평가했습니다.`, `${s.analysis.factors.filter(f => f.assessed).length} of five factors assessed.`)
      : say(s, "다섯 가지 질문에 답한 내용이 없어 평가하지 않았습니다.", "The five questions were not answered, so they were not assessed."),
    reasons: s => s.analysis.factors.map(factor => ({
      label: factor.title,
      value: factor.status,
      source: factor.assessed ? "you" as const : "open" as const,
      evidenceIds: factor.evidenceIds,
      note: factor.reading,
    })),
  },
  {
    id: "What You May Be Missing",
    term: ["놓치기 쉬운 조건", "Missing point"],
    question: ["아직 모르는데, 알게 되면 판단이 달라질 수 있는 것은?", "What is still unknown that could change the reading?"],
    reads: ["analysis.missingConcept", "analysis.question", "core.postureBasis", "analysis.researchCoverage"],
    feeds: ["Current Structural Posture", "Next Experiment"],
    conclusion: s => s.analysis.missingConcept,
    reasons: s => [
      { label: say(s, "답해야 할 질문", "Question to answer"), value: s.analysis.question, source: "engine" as const },
      ...v2Indicators
        .filter(indicator => s.core.postureBasis[indicator.key].band === "unknown")
        .map(indicator => ({
          label: label(s, signalLabels[indicator.key]),
          value: say(s, "확인 전", "Not yet confirmed"),
          source: "open" as const,
          note: pick(indicator.question, s.language),
        })),
      ...s.analysis.researchCoverage.filter(row => row.status === "none").map(row => ({
        label: row.title, value: say(s, "공개 자료를 찾지 못함", "No public sources found"), source: "open" as const,
      })),
    ],
  },
  {
    id: "Current Structural Posture",
    term: ["현재 구조 판단", "Current reading"],
    question: ["지금 조건에 가장 잘 맞는 움직임은 무엇인가요?", "Which move fits your current conditions best?"],
    reads: ["analysis.posture", "core.currentStructuralPosture", "core.postureBasis", "core.why", "sensitivity"],
    feeds: ["Changing", "Safety Margin", "Decision Switches"],
    conclusion: s => s.analysis.posture,
    reasons: s => [
      ...signalReasons(s),
      ...s.sensitivity
        .filter(row => row.posture)
        .map(row => ({
          label: say(s, "이것만 바뀌어도 판단이 달라짐", "This change alone changes the reading"),
          value: `${label(s, ({ externalValidation: "externalValidation", internalReadiness: "readinessBand", financialRoom: "financial", reversibility: "reversibility", downsideExposure: "downside", optionBSupport: "supportBand", constraintLoad: "constraint" } as Record<string, V2CopyKey>)[row.variable] ?? "noneYet")} → ${v2ConditionLevel(row.variable, row.band, s.language, b => label(s, b))}`,
          source: "engine" as const,
        })),
    ],
  },
  {
    id: "Changing",
    term: ["경로 조정 (Changing)", "Path options (Changing)"],
    question: ["지금 가진 자산을 다르게 조합하면 어떤 선택지가 생기나요?", "What options appear if you recombine what you have?"],
    reads: ["analysis.plays"],
    feeds: ["Next Experiment"],
    conclusion: s => s.analysis.plays.length
      ? s.analysis.plays.map(play => play.title).join(" · ")
      : say(s, "지금 조건에서는 도출된 조정 경로가 없습니다.", "No path adjustment is derived under current conditions."),
    reasons: s => s.analysis.plays.map(play => ({
      label: play.title, value: play.move, source: "engine" as const,
      note: say(s, `필요한 것: ${play.needs}`, `Needs: ${play.needs}`),
    })),
  },
  {
    id: "Safety Margin",
    term: ["안전 여유 (Safety Margin)", "Safety Margin"],
    question: ["예상과 다르게 흘러가도 계속할 여유가 얼마나 있나요?", "How much room is left if things go differently?"],
    reads: ["core.safetyMargin", "state.bands", "state.bandSelections"],
    feeds: ["Decision Switches", "Next Experiment"],
    conclusion: s => `${say(s, "안전 여유", "Safety Margin")}: ${label(s, s.core.safetyMargin.band)}`,
    reasons: s => {
      const answered = Object.fromEntries(Object.entries(s.state.bands).filter(([key]) => s.state.bandSelections[key as keyof typeof s.state.bands]));
      const profile = v2SafetyProfile(answered, s.language);
      return [
        ...(["financialRoom", "reversibility", "downsideExposure"] as const).map(key => ({
          label: label(s, ({ financialRoom: "financial", reversibility: "reversibility", downsideExposure: "downside" } as const)[key]),
          value: label(s, s.core.safetyMargin.inputs[key].band),
          source: traceSource(s.core.safetyMargin.inputs[key].source),
          note: answered[key] ? v2BandAnchor(key, answered[key], s.language === "ko") : undefined,
        })),
        ...(profile.absorbs.length ? [{ label: say(s, "버틸 수 있는 것", "Can absorb"), value: profile.absorbs.join(" · "), source: "engine" as const }] : []),
        ...(profile.exposed.length ? [{ label: say(s, "버티기 어려운 상황", "Hard to absorb"), value: profile.exposed.join(" · "), source: "engine" as const }] : []),
      ];
    },
  },
  {
    id: "Decision Switches",
    term: ["판단이 바뀌는 조건 (Switching)", "What would change the reading (Switching)"],
    question: ["어떤 사실이 바뀌면 판단을 다시 해야 하나요?", "Which facts, if they change, call for a new reading?"],
    reads: ["analysis.switching", "engineSwitches"],
    feeds: ["Next Experiment"],
    conclusion: s => say(s, `직접 고른 조건 ${s.analysis.switching.length}개, 자동 계산 ${s.engineSwitches.length}개`, `${s.analysis.switching.length} chosen by you, ${s.engineSwitches.length} calculated`),
    reasons: s => [
      ...s.analysis.switching.map(item => ({ label: item.signal, value: item.direction, source: "you" as const })),
      ...s.engineSwitches.map(item => ({
        label: item.signal, value: item.direction, source: "engine" as const,
        note: say(s, `다시 볼 부분: ${v2RecheckPart(item.variable, s.language)}`, `Re-check: ${v2RecheckPart(item.variable, s.language)}`),
      })),
    ],
  },
  {
    id: "Next Experiment",
    term: ["다음 확인", "Next check"],
    question: ["다음 30일 동안 무엇을 확인해 불확실성을 줄일까요?", "What will you check in the next 30 days to reduce uncertainty?"],
    reads: ["analysis.experiment", "core.nextStepExperiment"],
    feeds: [],
    conclusion: s => s.analysis.experiment.briefAction,
    reasons: s => [
      { label: say(s, "남길 기록", "Record to keep"), value: s.analysis.experiment.output, source: "engine" as const },
      { label: say(s, "계속할 때", "Continue when"), value: s.analysis.experiment.continue, source: "engine" as const },
      { label: say(s, "규모를 줄일 때", "Scale back when"), value: s.analysis.experiment.pause, source: "engine" as const },
      ...s.analysis.experiment.stages.map(stage => ({ label: `${stage.day} · ${stage.title}`, value: stage.action, source: "engine" as const, note: stage.output })),
    ],
  },
];

export function v2TraceTerm(stage: TraceStage, language: V2Language) { return pick(stage.term, language); }
export function v2TraceQuestion(stage: TraceStage, language: V2Language) { return pick(stage.question, language); }
export const v2TraceSourceLabel: Record<TraceSource, Pair> = {
  you: ["내 답변", "Your answer"],
  public: ["공개 자료", "Public sources"],
  engine: ["allofmycareer 계산", "allofmycareer calculation"],
  open: ["확인 전", "Not yet confirmed"],
};
