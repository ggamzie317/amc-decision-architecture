import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Download, Eye, EyeOff, Printer, Star, Trash2 } from "lucide-react";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2EvidenceLimit, v2EvidenceNature, v2EvidenceNatureLabel, v2EvidencePeriod } from "../data/v2Readings";
import type { V2TraceSnapshot } from "./traceSnapshot";
import { v2TraceQuestion, v2TraceSourceLabel, v2TraceStages, v2TraceTerm, type TraceStageId } from "./traceSchema";
import traceCss from "./trace.css?raw";
import "./trace.css";

/**
 * Decision Trace — renderer.
 *
 * Builds the screen from the schema: one section per analysis step, in the
 * framework's order. Each section shows the conclusion, the reasons behind it
 * with their source, the evidence they rest on and where the result is used
 * next. The personal layer (notes, stars, hidden steps) lives only in this
 * browser and never changes the analysis. Sharing is a local file export.
 */
type Personal = { notes: Partial<Record<TraceStageId, string>>; starred: TraceStageId[]; hidden: TraceStageId[]; collapsed: TraceStageId[] };
const emptyPersonal: Personal = { notes: {}, starred: [], hidden: [], collapsed: [] };

/** Short, non-reversible key for a decision without a record ID (no text is stored in the key). */
export function v2TraceLocalKey(snapshot: V2TraceSnapshot): string {
  const text = `${snapshot.state.caseType}|${snapshot.state.optionA}|${snapshot.state.optionB}`;
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `local-${(hash >>> 0).toString(36)}`;
}

function readPersonal(key: string): Personal {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return emptyPersonal;
    const value = JSON.parse(raw) as Partial<Personal>;
    return { ...emptyPersonal, ...value, notes: { ...(value.notes ?? {}) } };
  } catch {
    return emptyPersonal;
  }
}
function writePersonal(key: string, value: Personal) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: keep in memory only */ }
}

export default function V2DecisionTrace({ snapshot, recordId }: { snapshot: V2TraceSnapshot; recordId?: string | null }) {
  const ko = snapshot.language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  // Without a record ID, key by the decision itself so one analysis never shows another's notes.
  const storageKey = `amc-trace-personal:${recordId || v2TraceLocalKey(snapshot)}`;
  const [personal, setPersonal] = useState<Personal>(emptyPersonal);
  const root = useRef<HTMLElement>(null);
  useEffect(() => setPersonal(readPersonal(storageKey)), [storageKey]);
  const update = (next: (p: Personal) => Personal) => setPersonal(prev => {
    const value = next(prev);
    writePersonal(storageKey, value);
    return value;
  });
  const toggle = (field: "starred" | "hidden" | "collapsed", id: TraceStageId) =>
    update(p => ({ ...p, [field]: p[field].includes(id) ? p[field].filter(x => x !== id) : [...p[field], id] }));

  const blocks = snapshot.intelligence.status === "live" || snapshot.intelligence.status === "demo" ? snapshot.intelligence.evidenceBlocks : [];
  const stages = useMemo(() => v2TraceStages.map((stage, index) => ({
    stage, index, conclusion: stage.conclusion(snapshot), reasons: stage.reasons(snapshot),
  })), [snapshot]);
  const visible = stages.filter(row => !personal.hidden.includes(row.stage.id));
  const termOf = (id: TraceStageId) => v2TraceTerm(v2TraceStages.find(stage => stage.id === id)!, snapshot.language);
  const anchor = (id: string) => `v2-trace-${id.replace(/[^a-z]+/gi, "-").toLowerCase()}`;

  const exportHtml = () => {
    if (!root.current) return;
    // Notes become plain text in the file; controls are removed.
    const clone = root.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("textarea").forEach((area, i) => {
      const text = root.current!.querySelectorAll("textarea")[i]?.value ?? "";
      const p = document.createElement("p");
      p.className = "v2-trace-note-print";
      p.textContent = text ? `${say("내 메모", "My note")}: ${text}` : "";
      area.replaceWith(p);
    });
    clone.querySelectorAll("[data-trace-control]").forEach(node => node.remove());
    const html = `<!doctype html><html lang="${snapshot.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
      + `<title>allofmycareer · ${say("결론 추적", "Decision trace")}</title><style>body{margin:0;padding:24px;background:#f5f4ef;color:#112b39;font-family:Inter,"Noto Sans KR",Arial,sans-serif}${traceCss}</style></head>`
      + `<body>${clone.outerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `allofmycareer_${say("결론추적", "decision-trace")}_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const clearPersonal = () => {
    try { window.localStorage.removeItem(storageKey); } catch { /* nothing stored */ }
    setPersonal(emptyPersonal);
  };
  const print = () => {
    document.body.classList.add("v2-trace-printing");
    const done = () => { document.body.classList.remove("v2-trace-printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <section ref={root} className="v2-trace" data-testid="v2-decision-trace" aria-label={say("결론 추적", "Decision trace")}>
      <header className="v2-trace-head">
        <div>
          <p className="v2-trace-kicker">allofmycareer · {say("결론 추적", "Decision trace")}</p>
          <h2>{snapshot.analysis.posture}</h2>
          <p>{say("이 결론이 어떤 단계를 거쳐 나왔는지, 단계마다 무엇을 근거로 삼았는지 따라가 보세요. 순서와 이름은 allofmycareer 분석 단계 그대로입니다.",
            "Follow how this reading was reached, step by step, and what each step relied on. The order and names are the allofmycareer analysis steps.")}</p>
        </div>
        <div className="v2-trace-actions" data-trace-control>
          <button type="button" onClick={exportHtml}><Download aria-hidden size={15} />{say("파일로 저장", "Save as file")}</button>
          <button type="button" onClick={print}><Printer aria-hidden size={15} />{say("인쇄·PDF", "Print / PDF")}</button>
          <button type="button" onClick={clearPersonal}><Trash2 aria-hidden size={15} />{say("메모 모두 지우기", "Clear my notes")}</button>
        </div>
      </header>

      <ul className="v2-trace-legend" aria-label={say("근거 출처 구분", "Source legend")}>
        {(["you", "public", "engine", "open"] as const).map(source => (
          <li key={source} data-source={source}>{v2TraceSourceLabel[source][ko ? 0 : 1]}</li>
        ))}
      </ul>

      <nav className="v2-trace-nav" aria-label={say("분석 단계", "Analysis steps")} data-trace-control>
        <ol>
          {stages.map(({ stage, index }) => (
            <li key={stage.id} data-hidden={personal.hidden.includes(stage.id)}>
              <a href={`#${anchor(stage.id)}`}>{String(index + 1).padStart(2, "0")} {v2TraceTerm(stage, snapshot.language)}</a>
              <button type="button" aria-pressed={!personal.hidden.includes(stage.id)} onClick={() => toggle("hidden", stage.id)}
                title={personal.hidden.includes(stage.id) ? say("다시 보기", "Show") : say("숨기기", "Hide")}>
                {personal.hidden.includes(stage.id) ? <EyeOff aria-hidden size={13} /> : <Eye aria-hidden size={13} />}
              </button>
            </li>
          ))}
        </ol>
        <small>{say("숨기기·별표·메모는 이 브라우저에만 저장되며 분석 결과를 바꾸지 않습니다.", "Hiding, stars and notes are saved in this browser only and never change the analysis.")}</small>
      </nav>

      {visible.map(({ stage, index, conclusion, reasons }) => {
        const collapsed = personal.collapsed.includes(stage.id);
        const starred = personal.starred.includes(stage.id);
        return (
          <article key={stage.id} id={anchor(stage.id)} className="v2-trace-stage" data-starred={starred} data-stage={stage.id}>
            <div className="v2-trace-stage-head">
              <span className="v2-trace-step">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{v2TraceTerm(stage, snapshot.language)}</h3>
                <p className="v2-trace-question">{v2TraceQuestion(stage, snapshot.language)}</p>
              </div>
              <div className="v2-trace-stage-controls" data-trace-control>
                <button type="button" aria-pressed={starred} onClick={() => toggle("starred", stage.id)} title={say("중요 표시", "Star")}>
                  <Star aria-hidden size={15} />
                </button>
                <button type="button" aria-expanded={!collapsed} onClick={() => toggle("collapsed", stage.id)}>
                  {collapsed ? say("펼치기", "Expand") : say("접기", "Collapse")}
                </button>
              </div>
            </div>
            <p className="v2-trace-conclusion">{conclusion}</p>
            {!collapsed && (
              <>
                {reasons.length > 0 && (
                  <ul className="v2-trace-reasons">
                    {reasons.map((reason, i) => (
                      <li key={i} data-source={reason.source}>
                        <span className="v2-trace-chip">{v2TraceSourceLabel[reason.source][ko ? 0 : 1]}</span>
                        <div>
                          <b>{reason.label}</b> <span>{reason.value}</span>
                          {reason.note && <small>{reason.note}</small>}
                          {!stage.showsEvidence && reason.evidenceIds && reason.evidenceIds.length > 0 && blocks.length > 0 && (
                            <small className="v2-trace-refs">
                              {say("근거", "Evidence")} {reason.evidenceIds.filter(id => blocks[id]).map(id => (
                                <a key={id} href={`#v2-trace-evidence-${id + 1}`}>{id + 1}</a>
                              ))}
                            </small>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {stage.showsEvidence && blocks.length > 0 && (
                  <ol className="v2-trace-evidence">
                    {blocks.map((block, id) => (
                      <li key={id} id={`v2-trace-evidence-${id + 1}`}>
                        <b>{id + 1}. {v2CustomerEvidenceText(snapshot.language, block.headline)}</b>
                        <p>{v2CustomerEvidenceText(snapshot.language, block.fact)}</p>
                        <small>
                          {v2EvidenceNatureLabel(v2EvidenceNature(block), snapshot.language)} · {v2EvidencePeriod(block, snapshot.language)} · {v2EvidenceLimit(block.area, snapshot.language)}
                        </small>
                        {block.sourceUrl && <a href={block.sourceUrl} target="_blank" rel="noreferrer">{block.sourceLabel} ↗</a>}
                      </li>
                    ))}
                  </ol>
                )}
                {stage.feeds.length > 0 && (
                  <p className="v2-trace-feeds">
                    <ArrowDown aria-hidden size={14} />
                    {say("이 단계의 결과가 쓰이는 곳: ", "Used next in: ")}
                    {stage.feeds.map((id, i) => (
                      <span key={id}>{i > 0 && " · "}<a href={`#${anchor(id)}`}>{termOf(id)}</a></span>
                    ))}
                  </p>
                )}
                <label className="v2-trace-note">
                  <span>{say("내 메모 (이 브라우저에만 저장)", "My note (saved in this browser only)")}</span>
                  <textarea rows={2} maxLength={600} value={personal.notes[stage.id] ?? ""}
                    onChange={event => { const text = event.target.value; update(p => ({ ...p, notes: { ...p.notes, [stage.id]: text } })); }} />
                </label>
              </>
            )}
          </article>
        );
      })}
      <p className="v2-trace-foot">{say(
        "이 화면은 이미 계산된 분석 결과를 읽기만 합니다. 결정을 대신하거나 확률을 말하지 않습니다.",
        "This view only reads the analysis that was already calculated. It does not decide for you or state probabilities."
      )}</p>
    </section>
  );
}
