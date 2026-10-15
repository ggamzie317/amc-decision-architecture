import V2IndicatorProfile from "./V2IndicatorProfile";
import V2ReadingGuide, { V2LeadAndReasons } from "./V2ReadingGuide";
import { v2EvidencePeriod } from "../data/v2Readings";
import { v2AsEntered, v2DecisionText, v2RoleFields } from "../data/v2InputGlossary";
import V2PathMap from "./V2PathMap";
import V2ExecutiveBrief from "./V2ExecutiveBrief";
import V2FrameworkPlan from "./V2FrameworkPlan";
import V2InsightBoard from "./V2InsightBoard";
import { v2PostureCoverageNote } from "../data/v2PostureCoverage";
import { v2SharedSourceNote } from "../data/v2SourceSharing";
import { useEffect, useRef } from "react";
import { buildV2Analysis, type V2EvidencePhase } from "../data/amcV2Analysis";
import type { SelfChecks } from "../data/v2SelfDiagnostic";
import type { EvidenceComparisons } from "../data/v2EvidenceComparison";
import { V2EvidenceComparisonView } from "./V2EvidenceComparisonView";
import { v2CustomerEvidenceText } from "../data/amcV2Presentation";
import {
  limitV2Overrides,
  v2ScenarioComparison,
} from "../data/amcV2SensitivityView";
import type { ScenarioOverrides, ScenarioVariable } from "../data/amcScenario";
import {
  inspectV2ReportDensity,
  lowDensityPages,
} from "../data/amcV2ReportDensity";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import {
  v2Scenario,
  type V2Sensitivity,
  type V2State,
} from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import { v2EvidenceCheckedDate, v2EvidenceLanguageNote } from "../data/v2ReportPresentation";
import {
  v2t,
  v2CaseLabel,
  v2DirectionLabel,
  v2EvidenceDimensionLabel,
  type V2CopyKey,
} from "../data/v2Language";
import {
  V2DecisionMap,
  V2Reasoning,
  V2FactorMap,
  V2SafetyView,
  V2ChangingView,
  V2ExperimentView,
} from "./V2AnalysisView";
import V2SensitivityMatrix from "./V2SensitivityMatrix";
import V2SwitchList from "./V2SwitchList";

export default function V2Report({
  state,
  input,
  core,
  sensitivity,
  visibleVariables,
  scenarioOverrides = {},
  intelligence,
  selfChecks,
  comparisons,
  evidencePhase = intelligence.status,
  evidenceLanguage = state.language,
  onClose,
  onPrint,
}: {
  state: V2State;
  input: ProductApplicationBuildInput;
  core: ProductApplicationV3;
  sensitivity: V2Sensitivity[];
  visibleVariables: readonly ScenarioVariable[];
  scenarioOverrides?: ScenarioOverrides;
  intelligence: ExternalIntelligenceV2;
  selfChecks?: SelfChecks;
  comparisons?: EvidenceComparisons;
  evidencePhase?: V2EvidencePhase;
  evidenceLanguage?: V2State["language"];
  onClose: () => void;
  onPrint: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const t = (k: V2CopyKey) => v2t(state.language, k),
    ko = state.language === "ko";
  const say = (a: string, b: string) => (ko ? a : b);
  const evidenceText = (s: string) => v2CustomerEvidenceText(state.language, s);
  const analysis = buildV2Analysis(state, core, intelligence, evidencePhase, selfChecks, comparisons, evidenceLanguage);
  const roles = v2RoleFields(state.language, state);
  // Only the levels the customer actually chose.
  const answeredBands: Record<string, string> = Object.fromEntries(Object.entries(state.bands).filter(([k]) => state.bandSelections[k as keyof typeof state.bands]));
  const activeOverrides = limitV2Overrides(
    input,
    visibleVariables,
    scenarioOverrides
  );
  const hypothetical = Object.keys(activeOverrides).length
    ? v2Scenario(input, activeOverrides).result
    : null;
  const scenarioAnalysis = hypothetical
    ? buildV2Analysis(state, hypothetical, intelligence, evidencePhase, selfChecks, comparisons, evidenceLanguage)
    : null;
  const scenarioChanges = hypothetical
    ? v2ScenarioComparison(core, hypothetical, state.language).filter(
        ([, a, b]) => a !== b
      )
    : [];
  const hasSources =
    (evidencePhase === "live" && intelligence.status === "live") ||
    (evidencePhase === "demo" && intelligence.status === "demo");
  const draft = !hasSources;
  const evidenceLabel = t(
    evidencePhase === "live"
      ? "liveEvidence"
      : evidencePhase === "demo"
        ? "demoBadge"
        : evidencePhase === "not_checked"
          ? "evidenceNotChecked"
          : evidencePhase === "loading"
            ? "evidenceChecking"
            : "evidenceUnavailable"
  );
  const evidenceNote =
    evidencePhase === "live"
      ? `${t("reviewedAt")}: ${v2EvidenceCheckedDate(intelligence.generatedAt, state.language)}`
      : evidencePhase === "demo"
        ? t("demoOnly")
        : evidencePhase === "not_checked"
          ? t("externalPending")
          : evidencePhase === "loading"
            ? t("evidenceLoadingHint")
        : t("evidenceRetryHint");
  const partialEvidenceNote = intelligence.sourceCoverage === "partial"
    ? say(
        "일부 자료를 제외해 종합 요약은 싣지 않았습니다. 남은 자료도 원문과 비교해 보세요.",
        "Some sources were excluded, so the combined summary is left out. Compare the remaining sources with their original text too."
      )
    : null;
  useEffect(() => {
    let active = true;
    const inspect = () => {
      if (!active || !root.current) return;
      const samples = inspectV2ReportDensity(root.current);
      root.current.dataset.lowDensityPages = lowDensityPages(samples)
        .map(p => p.page)
        .join(",");
    };
    void document.fonts.ready.then(inspect);
    window.addEventListener("beforeprint", inspect);
    return () => {
      active = false;
      window.removeEventListener("beforeprint", inspect);
    };
  }, [state, core, intelligence, scenarioOverrides]);
  const page = (
    n: number,
    english: string,
    title: string,
    children: React.ReactNode
  ) => (
    <section className="v2-paper-page" data-page={n}>
      <header>
        <span>
          allofmycareer <i>/</i> {say("결정 보고서", "Decision report")}
        </span>
        <span>
          {say("섹션", "Section")} {String(n).padStart(2, "0")} / {hasSources ? "09" : "08"}
        </span>
      </header>
      <div className="v2-paper-body">
        <p className="v2-kicker">
          {String(n).padStart(2, "0")} / {english}
        </p>
        <h2>{title}</h2>
        {children}
      </div>
      <footer>
        <span>allofmycareer</span>
        <span>
          {draft ? `${say("검색 없이 본 초안", "Draft without public search")} · ` : ""}
          {evidenceLabel}
        </span>
      </footer>
    </section>
  );
  const sources = (full: boolean) => (
    <div className={`v2-paper-evidence ${full ? "full" : ""}`}>
      {intelligence.evidenceBlocks.map((b, id) => (
        <article key={id} data-provenance="EXTERNAL_EVIDENCE">
          <span>
            {String(id + 1).padStart(2, "0")} /{" "}
            {v2EvidenceDimensionLabel(state.language, b.dimension)} ·{" "}
            {v2DirectionLabel(state.language, b.direction)}
          </span>
          <h3>{evidenceText(b.headline)}</h3>
          <p>{evidenceText(b.fact)}</p>
          {full ? (
            <>
              <p>
                <b>{t("whyMatters")}</b> {evidenceText(b.whyItMatters)}
              </p>
              <p>
                <b>
                  {say(
                    "내 조건과의 관계",
                    "How it relates to your conditions"
                  )}
                </b>{" "}
                {analysis.evidenceLinks[id]?.condition}
              </p>
              {analysis.evidenceLinks[id]?.selfReport && <p className="v2-self-report">{analysis.evidenceLinks[id].selfReport}</p>}
              <p>{analysis.evidenceLinks[id]?.interpretation}</p>
              <p><b>{say("아직 확인할 조건", "Still to verify")}</b>{" "}{analysis.evidenceLinks[id]?.unresolved}</p>
              <p>
                <b>{say("다음 확인", "Next check")}</b>{" "}
                {analysis.evidenceLinks[id]?.test}
              </p>
            </>
          ) : (
            <p>
              {say("적용 범위", "Applicability")}:{" "}
              {evidenceText(b.whyItMatters)}
            </p>
          )}
          <small>
            {t("source")}:{" "}
            {v2SharedSourceNote(intelligence.evidenceBlocks, id, state.language) && (
              <b className="v2-shared-source">{v2SharedSourceNote(intelligence.evidenceBlocks, id, state.language)} · </b>
            )}
            {b.sourceUrl ? (
              <a href={b.sourceUrl} target="_blank" rel="noreferrer">
                {b.sourceLabel}
              </a>
            ) : (
              b.sourceLabel
            )}
            {b.sourceDate && b.sourceDateKind && (
              <>
                {" "}
                ·{" "}
                {t(
                  b.sourceDateKind === "published"
                    ? "sourcePublished"
                    : "sourceUpdated"
                )}
                : {b.sourceDate}
              </>
            )}
          </small>
          {!full && b.sourceUrl && (
            <span className="v2-paper-url">{b.sourceUrl}</span>
          )}
        </article>
      ))}
    </div>
  );
  return (
    <div
      ref={root}
      className="v2-report-shell v2-analysis-report"
      data-testid="v2-report"
    >
      <div className="v2-report-toolbar">
        <button onClick={onClose}>{t("closeReport")}</button>
        <span>
          {draft
            ? say(
                "검색 없이 본 초안 / 공개 자료 확인 전",
                "Draft without public search / public sources not yet checked"
              )
            : t("report")}
        </span>
        <button onClick={onPrint} disabled={evidencePhase === "loading"}>
          {t("print")}
        </button>
      </div>
      {page(
        1,
        say("핵심 요약", "Summary"),
        analysis.topic,
        <>
          <div className="v2-cover">
            <div>
              <p>
                {draft
                  ? say(
                      "검색 없이 본 초안 · 공개 자료 확인 전",
                      "Draft without public search · public sources not yet checked"
                    )
                  : evidenceLabel}
              </p>
              <p>{say("답한 내용으로 본 판단", "Reading from your answers")}</p>
              <h1>{analysis.posture}</h1>
              <p className="v2-posture-coverage" data-coverage={core.postureEvidenceCoverage}>
                {v2PostureCoverageNote(core, state.language).text}
              </p>
              <p>{v2CaseLabel(state.language, state.caseType)}</p>
            </div>
            <div className="v2-cover-mark">allofmycareer</div>
          </div>
          <p className="v2-paper-caption">
            {t("context")}: {v2DecisionText(state.language, state)}
          </p>
          <V2ReadingGuide language={state.language} printed />
          <V2LeadAndReasons className="v2-paper-lead" text={analysis.executiveSummary} language={state.language} />
          <V2ExecutiveBrief language={state.language} core={core} analysis={analysis} intelligence={intelligence} input={input} printed cardsOnly />
          <div className="v2-paper-priorities">
            <article>
              <span>01 / {say("핵심 질문", "Key question")}</span>
              <h3>{analysis.question}</h3>
            </article>
            <article>
              <span>02 / {say("안전 여유 (Safety Margin)", "Safety Margin")}</span>
              <h3>{t(core.safetyMargin.band)}</h3>
              <p>{analysis.boundary}</p>
            </article>
            <article>
              <span>03 / {say("다음 확인", "Next check")}</span>
              <h3>{analysis.experiment.output}</h3>
              <p>{say("자료와 내 조건의 비교는 3번 섹션, 첫 단계의 범위는 6번 섹션에 있습니다.", "Section 3 compares the evidence with your conditions; section 6 sets the size of the first step.")}</p>
            </article>
          </div>
          <p className="v2-paper-caption">
            {say(
              "이 분석은 결정을 대신하지 않습니다. 지금 무엇을 지켜야 하는지, 어떤 근거가 생기면 다음 단계를 검토할 수 있는지 보여 줍니다.",
              "This brief does not decide for you. It shows what to protect now and which evidence would make the next step worth reviewing."
            )}
          </p>
        </>
      )}
      {page(
        2,
        say("판단 이유", "Why this reading"),
        say("지금 이렇게 판단한 이유", "Why this is the current reading"),
        <>
          <V2IndicatorProfile language={state.language} core={core} intelligence={intelligence} bands={answeredBands} printed />
          <V2Reasoning
            analysis={analysis}
            intelligence={intelligence}
            compact
          />
          <div className="v2-paper-note">
            <strong>
              {say(
                "다음 단계를 검토할 수 있는 때",
                "When the next step is worth reviewing"
              )}
            </strong>
            <p>{analysis.experiment.continue}</p>
            <p>
              {say(
                "조건 하나가 나아질 때 남은 제약도 풀리는지는 7·8번 섹션에서 확인하세요.",
                "Sections 7–8 show whether improving one condition also resolves the others."
              )}
            </p>
          </div>
        </>
      )}
      {page(
        3,
        say("공개 자료와 내 조건", "Public sources and your conditions"),
        say(
          "공개 자료와 내 조건 비교",
          "Public sources compared with your conditions"
        ),
        <>
          <div className="v2-paper-band">
            <span>{evidenceLabel}</span>
            <p>{evidenceNote}</p>
            {evidencePhase === "live" && v2EvidenceLanguageNote(state.language, evidenceLanguage) && <p>{v2EvidenceLanguageNote(state.language, evidenceLanguage)}</p>}
            <p>{analysis.externalReading}</p>
          </div>
          {hasSources ? (
            <>
              <V2InsightBoard language={state.language} core={core} analysis={analysis} intelligence={intelligence} mode="evidence" />
              {/* The customer's own comparisons and notes stay in the report. */}
              {analysis.evidenceLinks.some(link => link.comparisonStatus !== "unreviewed" || link.comparisonDetail) && (
                <V2EvidenceComparisonView analysis={analysis} intelligence={intelligence} compact />
              )}
            </>
          ) : (
            <div className="v2-paper-note">
              <strong>
                {say(
                  "공개 자료를 아직 확인하지 않았습니다",
                  "Public sources not yet checked"
                )}
              </strong>
              <p>{analysis.question}</p>
              <p>{analysis.experiment.action}</p>
              <p>
                {say(
                  "대시보드에서 공개 자료를 확인한 뒤 이 보고서를 다시 열면, 같은 답변으로 다시 만들어집니다.",
                  "Check public sources on the dashboard, then reopen this report. It is rebuilt from the same answers."
                )}
              </p>
            </div>
          )}
        </>
      )}
      {page(
        4,
        say("결정 지도", "Decision map"),
        say("갈 수 있는 경로와 목표 쪽 여건", "Possible paths and conditions on the target side"),
        <>
          <V2PathMap language={state.language} state={state} core={core} analysis={analysis} intelligence={intelligence} />
          <V2DecisionMap
            state={state}
            analysis={analysis}
            phase={evidencePhase}
            safetyBand={core.safetyMargin.band}
          />
          <V2FactorMap analysis={analysis} compact />
        </>
      )}
      {page(
        5,
        say("안전 여유 (Safety Margin)", "Safety Margin"),
        say(
          "계획대로 되지 않아도 버틸 수 있나요?",
          "Could you absorb it if the plan does not work out?"
        ),
        <>
          <V2SafetyView analysis={analysis} band={core.safetyMargin.band} />
          <div className="v2-paper-note">
            <strong>
              {say("가장 먼저 해결할 질문", "First question to resolve")}
            </strong>
            <h3>{analysis.question}</h3>
            <p>{analysis.findings[0].implication}</p>
            <p>{analysis.experiment.pause}</p>
          </div>
        </>
      )}
      {page(
        6,
        say("경로 조정 (Changing) · 다음 확인", "Path options (Changing) · Next check"),
        say(
          "목표는 그대로 두고 방법 바꾸기",
          "Keep the goal, change how you get there"
        ),
        <>
          <V2ChangingView analysis={analysis} />
          <V2ExperimentView analysis={analysis} compact />
        </>
      )}
      {page(
        7,
        say("조건이 바뀌면", "If conditions change"),
        t("scenarioSensitivity"),
        <>
          <div className="v2-paper-band">
            <span>{say("답한 내용으로 본 판단", "Reading from your answers")}</span>
            <strong>
              {analysis.posture} / {say("안전 여유 (Safety Margin)", "Safety Margin")}: {t(core.safetyMargin.band)}
            </strong>
            <p>{t("sensitivityIntro")}</p>
          </div>
          {hypothetical && scenarioAnalysis && (
            <div className="v2-paper-scenario">
              <strong>{t("hypotheticalScenario")}</strong>
              <p>{t("hypotheticalNotEvidence")}</p>
              {scenarioChanges.length ? (
                scenarioChanges.map(([label, before, after]) => (
                  <p key={label}>
                    {t(label)}: {`${before} → ${after}`}
                  </p>
                ))
              ) : (
                <p>{t("noChange")}</p>
              )}
              <p>{scenarioAnalysis.summary}</p>
              <p>
                <b>{say("이 가정에서 움직일 범위", "How far to go under this assumption")}</b>{" "}
                {scenarioAnalysis.boundary}
              </p>
            </div>
          )}
          <V2SensitivityMatrix
            rows={sensitivity}
            variables={visibleVariables}
            language={state.language}
          />
          <p className="v2-paper-caption">
            {say(
              "각 행은 조건 하나만 바꿔 같은 방식으로 다시 계산한 결과입니다. 선택지의 순위나 성공 확률이 아닙니다. 여러 조건을 함께 바꿔 보려면 대시보드의 시뮬레이터를 쓰세요.",
              "Each row changes one condition and recalculates the same way. It is not a ranking or a chance of success. To change several conditions at once, use the simulator on the dashboard."
            )}
          </p>
        </>
      )}
      {page(
        8,
        say("판단이 바뀌는 조건 (Switching) · 30·60·90일 확인", "What would change the reading (Switching) · 30/60/90-day check"),
        say(
          "판단이 바뀌는 조건과 30·60·90일 확인 계획",
          "What would change the reading, and a 30/60/90-day check plan"
        ),
        <>
          <V2SwitchList
            state={state}
            input={input}
            baseline={core}
            sensitivity={sensitivity}
            variables={visibleVariables}
            report
          />
          <p className="v2-paper-caption">{evidenceNote}</p>
          <ol className="v2-experiment-timeline">
            {analysis.experiment.stages.map(s => (
              <li key={s.day}>
                <span>
                  {s.day}
                  <small>{ko ? "일" : "days"}</small>
                </span>
                <div>
                  <h3>{s.title}</h3>
                <p>{s.briefAction ?? s.action}</p>
                  <strong>{s.output}</strong>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      {hasSources &&
        page(
          9,
          say("출처와 범위", "Sources and scope"),
          t("sourceNotes"),
          <>
            <p className="v2-paper-caption">
              {evidenceNote.replace(/\.$/, "")}.{" "}
              {evidencePhase === "demo"
                ? say(
                    "이 페이지는 예시로 만든 자료입니다. 실제 출처를 확인한 결과가 아닙니다.",
                    "This page uses made-up example data. It is not a check of real sources."
                  )
                : say(
                    "출처에 접속할 수 있다고 해서 내용이 검증된 것은 아닙니다. 자료의 표본·시점·지역이 내 목표와 맞는지 비교해 보세요.",
                    "A reachable source is not a verified claim. Check whether its sample, timing and region match your target."
                  )}
            </p>
            {partialEvidenceNote && <p className="v2-paper-caption">{partialEvidenceNote}</p>}
            {evidencePhase === "live" && v2EvidenceLanguageNote(state.language, evidenceLanguage) && <p className="v2-paper-caption">{v2EvidenceLanguageNote(state.language, evidenceLanguage)}</p>}
            <h3 className="v2-reference-title">{say("allofmycareer 프레임워크 실행 계획", "allofmycareer framework action plan")}</h3>
            <V2FrameworkPlan language={state.language} core={core} analysis={analysis} intelligence={intelligence} input={input} bands={answeredBands} printed />
            <h3 className="v2-reference-title">{say("출처 원문", "Original sources")}</h3>
            <p className="v2-paper-caption">
              {say("본문의 근거 문장은 한국어로 옮겨 적었습니다. 정확한 표현과 범위는 아래 원문에서 확인하세요.",
                "Evidence in the report is written in English. Check the exact wording and scope in the originals below.")}
            </p>
            <ol className="v2-source-references">
              {intelligence.evidenceBlocks.map((b, id) => (
                <li key={id}>
                  <span>{String(id + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{b.sourceLabel}</strong>
                    <small>
                      {v2EvidenceDimensionLabel(state.language, b.dimension)}
                      {b.period ? ` · ${v2EvidencePeriod(b, state.language)}` : ""}
                      {b.sourceDate && b.sourceDateKind
                        ? ` · ${t(b.sourceDateKind === "published" ? "sourcePublished" : "sourceUpdated")}: ${b.sourceDate}`
                        : ""}
                    </small>
                    {b.sourceUrl && <a href={b.sourceUrl} target="_blank" rel="noreferrer">{b.sourceUrl}</a>}
                  </div>
                </li>
              ))}
            </ol>
            {intelligence.uncertainties.length > 0 && (
              <p className="v2-paper-caption">
                {t("uncertainty")}:{" "}
                {intelligence.uncertainties.map(evidenceText).join(" · ")}
              </p>
            )}
            <div className="v2-paper-context">
              <strong>
                {say("입력한 상황", "Your decision context")}
              </strong>
              <p>{v2DecisionText(state.language, state)}</p>
              <p>{t("optionA")}: {roles.current.text}{v2AsEntered(state.language, roles.current.original)}</p>
              <p>{t("optionB")}: {roles.target.text}{v2AsEntered(state.language, roles.target.original)}</p>
            </div>
          </>
        )}
    </div>
  );
}
