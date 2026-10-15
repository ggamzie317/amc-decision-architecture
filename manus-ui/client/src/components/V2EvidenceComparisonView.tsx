import type { V2Analysis } from "../data/amcV2Analysis";
import { v2EvidenceLimit, v2EvidenceNature, v2EvidenceNatureLabel, v2EvidencePeriod } from "../data/v2Readings";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import { v2EvidenceDimensionLabel } from "../data/v2Language";
import { v2ComparisonLabel, type EvidenceComparison } from "../data/v2EvidenceComparison";

/** One comparison model for screen and report; editing changes private context
 * only. It never calls search, rewrites a source, or modifies core score inputs. */
export function V2EvidenceComparisonView({ analysis, intelligence, onChange, compact = false }: {
  analysis: V2Analysis;
  intelligence: ExternalIntelligenceV2;
  onChange?: (key: string, answer: EvidenceComparison) => void;
  compact?: boolean;
}) {
  const ko = analysis.language === "ko";
  const say = (a: string, b: string) => ko ? a : b;
  const labels = [say("공개 자료의 조건", "What the public source says"), say("지금 내 근거", "Your evidence now"), say("아직 확인할 것", "Still to check")];
  const captionId = compact ? "v2-report-comparison-caption" : "v2-screen-comparison-caption";
  return <div className={`v2-condition-comparison ${compact ? "compact" : ""}`} data-testid="v2-condition-comparison">
    <p className="v2-analysis-note">{analysis.externalContextReading}</p>
    <ul className="v2-research-coverage" aria-label={say("검색 항목별 근거 범위", "Evidence by research topic")}>
      {analysis.researchCoverage.map(item => <li key={item.area} data-covered={!!item.evidenceIds.length}>
        <span>{item.title}</span><strong>{item.status === "found" ? say("공개 자료 있음", "Public sources found")
          : item.status === "pending" ? say("찾는 중", "Collecting")
            : item.status === "not_searched" ? say("아직 찾지 않음", "Not searched yet")
              : say("찾은 자료 없음", "Nothing usable found")}</strong>
      </li>)}
    </ul>
    {analysis.evidenceLinks.length > 0 ? <>
      <p id={captionId} className="v2-comparison-caption">{say("공개 자료와 내 근거 비교 · 내가 충족하는지는 외부 확인 전", "Public sources compared with yours · whether you meet them is not externally checked")}</p>
      <table aria-labelledby={captionId}>
      <thead><tr>{labels.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{analysis.evidenceLinks.map(link => {
        const block = intelligence.evidenceBlocks[link.id];
        if (!block) return null;
        return <tr key={link.comparisonKey} data-comparison={link.comparisonStatus}>
          <td data-label={labels[0]}>
            <span className="v2-comparison-reference">{say("근거", "Evidence")} {link.id + 1} / {v2EvidenceDimensionLabel(analysis.language, block.dimension)}</span>
            <p>{v2CustomerEvidenceText(analysis.language, link.sourceFact)}</p>
            <p className="v2-evidence-scope"><b>{v2EvidenceNatureLabel(v2EvidenceNature(block), analysis.language)}</b>{` · ${v2EvidencePeriod(block, analysis.language)}`} · {v2EvidenceLimit(block.area, analysis.language)}</p>
            {block.sourceUrl && <a href={block.sourceUrl} target="_blank" rel="noreferrer">{block.sourceLabel} ↗</a>}
          </td>
          <td data-label={labels[1]}>
            <strong>{link.condition}</strong>
            <p>{link.customerEvidence}</p>
            <span className="v2-comparison-status">{link.comparisonLabel}</span>
            {onChange && <fieldset>
              <legend>{say("이 조건을 내 상황과 비교해 보세요", "Compare this condition with your situation")}</legend>
              <div className="v2-comparison-options">
                {(["unreviewed", "matches", "gap", "not_applicable"] as const).map(status => <button
                  key={status} type="button" aria-pressed={link.comparisonStatus === status}
                  onClick={() => onChange(link.comparisonKey, { status, detail: link.comparisonDetail })}
                >{v2ComparisonLabel(status, ko)}</button>)}
              </div>
              {link.comparisonStatus !== "unreviewed" && <label>
                <span>{say("비교에 쓴 결과물·수치·반응 · 선택", "Work, figures or responses you compared · optional")}</span>
                <textarea maxLength={240} rows={2}
                  value={link.comparisonDetail}
                  onChange={event => onChange(link.comparisonKey, { status: link.comparisonStatus, detail: event.target.value })}
                  placeholder={say("예: 해당 공정 개선 결과물을 아직 만들지 못했습니다", "For example: I have not produced the required work sample")}
                />
              </label>}
            </fieldset>}
          </td>
          <td data-label={labels[2]}><p>{compact ? link.testReference : link.test}</p>{!compact && <small>{link.unresolved}</small>}</td>
        </tr>;
      })}</tbody>
    </table></> : <p>{say("공개 자료가 확인되면 이 표에서 내 조건과 비교합니다. 확인하지 않은 요건으로 적합성을 판단하지 않습니다.", "Once public sources are found, this table compares them with your conditions. Requirements that have not been checked are not used to judge fit.")}</p>}
    {onChange && <p className="v2-analysis-note">{say("이 답은 본인 응답이며, 점수나 검증 완료로 바뀌지 않습니다. 지금 연 탭에만 남습니다.", "These are your own answers. They do not become scores or a verified mark, and they stay in this tab only.")}</p>}
  </div>;
}
