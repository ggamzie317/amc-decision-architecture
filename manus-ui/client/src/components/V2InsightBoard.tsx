import { useState } from "react";
import {
  ArrowRight,
  CircleDashed,
  CircleHelp,
  GitBranch,
  Minus,
  Search,
  ShieldCheck,
  Shuffle,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { V2Analysis } from "../data/amcV2Analysis";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2EvidenceDimensionLabel, v2t, type V2Language } from "../data/v2Language";

/**
 * Executive insight board: a compact, visual reading of the same analysis the
 * rest of the dashboard explains in prose. It derives nothing new — every
 * mark comes from existing bands, evidence cards and engine outputs. Unknown
 * inputs are drawn as dashed, never as a middle value.
 */

type Axis = { key: keyof ProductApplicationV3["postureBasis"]; label: [string, string]; invert?: boolean; market?: boolean };
const axes: Axis[] = [
  { key: "externalValidation", label: ["Market evidence", "시장 근거"], market: true },
  { key: "internalReadiness", label: ["Readiness", "실행 준비도"] },
  { key: "optionBSupport", label: ["Support", "실행 지원"] },
  { key: "safetyMargin", label: ["Safety Margin", "안전 여유"] },
  { key: "reversibility", label: ["Reversibility", "되돌릴 여지"] },
  { key: "structuralRisk", label: ["Low downside", "낮은 손실 위험"], invert: true },
  { key: "constraintLoad", label: ["Light constraints", "가벼운 제약"], invert: true },
];
const level: Record<string, number | null> = {
  strong: 2, developing: 1, weak: 0,
  low: 2, moderate: 1, high: 0,
  light: 2, material: 1, heavy: 0,
  unknown: null,
};

function point(cx: number, cy: number, r: number, i: number, n: number) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

function Radar({
  values,
  labels,
  marketIndex,
  ko,
  title,
}: {
  values: (number | null)[];
  labels: string[];
  marketIndex?: number;
  ko: boolean;
  title: string;
}) {
  const n = values.length;
  const cx = 190, cy = 140, R = 90;
  const ring = (f: number) => Array.from({ length: n }, (_, i) => point(cx, cy, R * f, i, n).join(",")).join(" ");
  // Unknown axes contribute no area: they are drawn on the centre and marked dashed.
  const shape = values.map((v, i) => point(cx, cy, v === null ? 0 : (R * (v + 0.5)) / 2.5, i, n).join(",")).join(" ");
  return (
    <svg viewBox="0 0 380 285" role="img" aria-label={title} className="v2-radar">
      {[1, 0.6, 0.2].map(f => <polygon key={f} points={ring(f)} className="v2-radar-ring" />)}
      {values.map((_, i) => {
        const [x, y] = point(cx, cy, R, i, n);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="v2-radar-spoke" />;
      })}
      <polygon points={shape} className="v2-radar-shape" />
      {values.map((v, i) => {
        const [x, y] = point(cx, cy, v === null ? R * 0.2 : (R * (v + 0.5)) / 2.5, i, n);
        return v === null
          ? <circle key={i} cx={x} cy={y} r={4.5} className="v2-radar-unknown" />
          : <circle key={i} cx={x} cy={y} r={4} className={i === marketIndex ? "v2-radar-dot market" : "v2-radar-dot"} />;
      })}
      {labels.map((label, i) => {
        const [x, y] = point(cx, cy, R + 22, i, n);
        const anchor = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            className={i === marketIndex ? "v2-radar-label market" : values[i] === null ? "v2-radar-label unknown" : "v2-radar-label"}>
            {label}{values[i] === null ? (ko ? " ?" : " ?") : ""}
          </text>
        );
      })}
    </svg>
  );
}

const directionIcon: Record<string, LucideIcon> = { supportive: TrendingUp, caution: TrendingDown, mixed: Minus };

export default function V2InsightBoard({
  language,
  core,
  analysis,
  intelligence,
  mode = "full",
}: {
  language: V2Language;
  core: ProductApplicationV3;
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  /** Report pages print the tiles (page 1) or the profile and comparison (page 3) with every row expanded. */
  mode?: "full" | "tiles" | "evidence";
}) {
  const printed = mode !== "full";
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const [focus, setFocus] = useState<number | null>(null);
  const values = axes.map(axis => level[core.postureBasis[axis.key].band] ?? null);
  const known = values.filter(v => v !== null).length;
  const fifwmScores = Object.values(core.decisionStructure.fifwm).map(f => f.score);
  const fifwmAssessed = fifwmScores.some(s => s !== null);
  const live = intelligence.status === "live" || intelligence.status === "demo";
  const rows = live ? intelligence.evidenceBlocks : [];
  const statusLabel: Record<string, [string, string]> = {
    unreviewed: ["Not compared", "미대조"], matches: ["Matches", "부합"],
    gap: ["Gap", "부족"], not_applicable: ["Not my target", "해당 없음"],
  };
  const tiles: { icon: LucideIcon; label: [string, string]; value: string; detail: string; href: string }[] = [
    {
      icon: Search,
      label: ["Missing point", "놓치기 쉬운 조건"],
      value: analysis.missingConcept,
      // The question that would resolve it, not a restatement of the title.
      detail: analysis.question,
      href: "#v2-map",
    },
    {
      icon: ShieldCheck,
      label: ["Safety Margin", "안전 여유"],
      value: v2t(language, core.safetyMargin.band),
      detail: core.safetyMargin.reading,
      href: "#v2-safety",
    },
    {
      icon: Shuffle,
      label: ["Changing", "실행 경로 조정"],
      value: analysis.plays.length
        ? say(`${analysis.plays.length}개 경로`, `${analysis.plays.length} route${analysis.plays.length > 1 ? "s" : ""}`)
        : say("도출 없음", "None derived"),
      detail: analysis.plays[0]?.title ?? say("검증 후 다시 도출합니다.", "Re-derived after validation."),
      href: "#v2-changing",
    },
    {
      icon: GitBranch,
      label: ["Decision switch", "판단 전환 조건"],
      value: analysis.switching.length
        ? say(`${analysis.switching.length}개 조건`, `${analysis.switching.length} condition${analysis.switching.length > 1 ? "s" : ""}`)
        : say("선택 없음", "None selected"),
      detail: analysis.switching[0] ? `${analysis.switching[0].signal} → ${analysis.switching[0].direction}` : say("8단계에서 고르면 표시됩니다.", "Choose them in step 8."),
      href: "#v2-map",
    },
  ];

  return (
    <section className={`v2-insight-board${printed ? " printed" : ""}`} aria-label={say("구조 인사이트", "Structural insights")} data-testid="v2-insight-board" data-mode={mode}>
      {mode !== "evidence" && <div className="v2-insight-tiles">
        {tiles.map(({ icon: Icon, label, value, detail, href }) => (
          <a key={label[0]} href={href} className="v2-insight-tile">
            <span className="v2-insight-tile-head"><Icon aria-hidden size={16} />{label[ko ? 1 : 0]}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
            <span className="v2-insight-more">{say("자세히", "Details")} <ArrowRight aria-hidden size={13} /></span>
          </a>
        ))}
      </div>}

      {mode !== "tiles" && <div className="v2-insight-grid">
        <figure className="v2-insight-panel">
          <figcaption>
            <strong>{say("구조 프로필", "Structure profile")}</strong>
            <span>{say(`입력 ${values.length}개 중 ${known}개 확인 · 바깥일수록 유리 · ?는 미확인`, `${known} of ${values.length} confirmed · outer is more favourable · ? is unconfirmed`)}</span>
          </figcaption>
          <Radar values={values} labels={axes.map(a => a.label[ko ? 1 : 0])} marketIndex={0} ko={ko}
            title={say("구조 프로필 레이더 차트", "Structure profile radar chart")} />
          <p className="v2-insight-legend">
            <i className="dot market" />{say("시장 근거(공개 자료)", "Market evidence (public sources)")}
            <i className="dot" />{say("고객 입력", "Your inputs")}
            <CircleDashed aria-hidden size={12} />{say("미확인", "Unconfirmed")}
          </p>
          {fifwmAssessed && (
            <div className="v2-insight-fifwm">
              <strong>{analysis.fifwmSource === "case-adapted" ? say("사례 맞춤 구조 평가", "Case-adapted structure assessment") : say("조직·직무 구조 평가", "Organization and role assessment")}</strong>
              <Radar values={fifwmScores} labels={analysis.factors.map(f => f.title)} ko={ko}
                title={say("다섯 구조 요소 오각형 맵", "Five structural factors pentagon map")} />
            </div>
          )}
        </figure>

        <div className="v2-insight-panel">
          <div className="v2-insight-panel-head">
            <strong>{say("시장 대 고객", "Market vs you")}</strong>
            <span>{say("공개 근거의 핵심과 내 조건의 대조 상태", "Key public fact against your condition")}</span>
          </div>
          {rows.length ? (
            <ul className="v2-versus">
              {rows.map((block, i) => {
                const link = analysis.evidenceLinks[i];
                const Dir = directionIcon[block.direction] ?? Minus;
                const status = link?.comparisonStatus ?? "unreviewed";
                return (
                  <li key={i} data-direction={block.direction} data-status={status}
                    aria-expanded={printed || focus === i} onClick={() => !printed && setFocus(focus === i ? null : i)}>
                    <span className="v2-versus-area">{v2EvidenceDimensionLabel(language, block.dimension)}</span>
                    <span className="v2-versus-market"><Dir aria-hidden size={15} />{v2CustomerEvidenceText(language, block.headline)}</span>
                    <span className="v2-versus-you">{link?.condition ?? "—"}</span>
                    <span className="v2-versus-status">{statusLabel[status][ko ? 1 : 0]}</span>
                    {(printed || focus === i) && (
                      <p className="v2-versus-detail">
                        {v2CustomerEvidenceText(language, block.fact)}
                        {link?.test && <><br /><b>{say("다음 확인: ", "Next check: ")}</b>{link.test}</>}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="v2-insight-empty">
              <CircleHelp aria-hidden size={16} />
              {say("아직 연결된 공개 근거가 없습니다. 근거가 확인되면 영역별로 시장 조건과 내 조건을 나란히 보여 줍니다.",
                "No public evidence is connected yet. Once evidence is found, each area shows the market condition beside yours.")}
            </p>
          )}
          {rows.length > 0 && !printed && <p className="v2-insight-note">{say("행을 누르면 근거 사실과 다음 확인이 펼쳐집니다.", "Select a row to expand the fact and the next check.")}</p>}
        </div>
      </div>}
    </section>
  );
}
