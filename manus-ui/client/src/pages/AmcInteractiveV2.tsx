import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import V2DecisionTracePanel from "../trace/V2DecisionTracePanel";
import { v2BandAnchor } from "../data/v2BandAnchors";
import { v2KeyFactQuestions } from "../../../shared/v2KeyFacts";
import { v2SurveyGroups, v2SurveyGroupsFor, type V2SurveyField } from "../data/v2SurveyGroups";
import { v2RoleFields } from "../data/v2InputGlossary";
import { buildProductApplicationV3 } from "../data/amcProductApplicationV3";
import { baselineBands, type ScenarioOverrides } from "../data/amcScenario";
import { selectV2SimulatorVariables } from "../data/amcV2SensitivityView";
import {
  caseTypes,
  projectInteractiveMetadata,
  projectInteractivePatch,
  v2Identity,
} from "../../../shared/interactivePrivacy";
import { activeAmcSubmissionId, trackV2Journey, type JourneyEventType, type JourneyTrackingObservation } from "../data/amcFounderOps";
import { v2FeedbackMailto } from "../data/v2Feedback";
import {
  initialV2State,
  v2Choices,
  v2ExternalOptions,
  v2ModuleKeys,
  v2SwitchCandidates,
  buildV2Input,
  buildV2Sensitivity,
  v2UnansweredBands,
  v2AllBandsAnswered,
  v2RequiredBandsByStep,
  type V2State,
  type V2CaseType,
} from "../data/amcV2Model";
import { v2DemoFixture, type V2DemoKind } from "../data/amcV2Demos";
import {
  unavailableIntelligence,
  type ExternalIntelligenceV2,
} from "../data/externalIntelligenceV2";
import {
  buildV2EvidenceRequest,
  requestV2Evidence,
  v2SituationalAreas,
} from "../data/v2ExternalEvidenceClient";
import type { V2EvidenceHttpObservation } from "../../../shared/v2EvidenceProtocol";
import {
  v2t,
  v2CaseLabel,
  type V2CopyKey,
  type V2Language,
} from "../data/v2Language";
import V2Dashboard from "../components/V2Dashboard";
import V2Simulator from "../components/V2Simulator";
import V2Report from "../components/V2Report";
import { v2PublicSearchTarget } from "../data/amcV2Analysis";
import type { EvidenceComparisons } from "../data/v2EvidenceComparison";
import {
  prepareV2PrintTitle,
  v2ReportFileName,
} from "../data/v2ReportPresentation";
import {
  initialSelfChecks,
  selfCheckCards,
  selfCheckComplete,
  type SelfCheckId,
  type SelfCheckStatus,
} from "../data/v2SelfDiagnostic";
import {
  canonicalFifwmFields,
  canonicalFifwmQuestion,
  canonicalFifwmChoiceLabel,
  initialCanonicalFifwmAssessment,
  v2CanAskCanonicalFifwm,
} from "../data/v2CanonicalFifwm";
import { mergeV2Evidence, v2EvidenceGroups } from "../../../shared/v2EvidenceMerge";
import type { V2EvidenceRequest } from "../../../shared/externalIntelligenceV2Request";
import {
  v2AreasForCase,
  v2MissingGroups,
  v2PickEvidence,
  v2ShouldRetryTopic,
  v2StoreEvidence,
  v2WithCaseType,
  v2WithoutPending,
} from "../data/v2EvidenceFlow";
import V2Processing from "../components/V2Processing";
import { v2CaseFifwmSet } from "../data/v2CaseFifwm";
import {
  inferV2CaseRanking,
  inferV2CaseType,
  inferV2Geography,
  inferV2SearchTarget,
  v2CaseDescription,
} from "../data/v2CaseInference";
import { Compass, FileSearch, Layers, Lock } from "lucide-react";
import "../styles/v2.css";

// "processing" holds the customer on an honest in-progress screen while the
// explicit public-evidence analysis runs; results open only after it settles.
type Phase = "setup" | "modules" | "processing" | "dashboard" | "report";
const bandStrength = ["strong", "developing", "weak", "unknown"] as const;
const bandRisk = ["low", "moderate", "high", "unknown"] as const;
const bandLoad = ["light", "material", "heavy", "unknown"] as const;
export default function AmcInteractiveV2() {
  const params = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search
  );
  const demoMode = params.get("demo") === "1";
  const initialKind: V2DemoKind =
    params.get("fixture") === "industry" ? "industry" : "entrepreneurship";
  const initialLanguage: V2Language =
    params.get("lang") === "ko" ||
    (!params.has("lang") &&
      typeof navigator !== "undefined" &&
      navigator.language.startsWith("ko"))
      ? "ko"
      : "en";
  const [language, setLanguage] = useState<V2Language>(initialLanguage);
  // A language toggle changes presentation, not the research snapshot or its identity.
  const [researchLanguage, setResearchLanguage] = useState<V2Language>(initialLanguage);
  const [kind, setKind] = useState<V2DemoKind>(initialKind);
  const [state, setState] = useState<V2State>(() =>
    demoMode
      ? v2DemoFixture(initialKind, initialLanguage).state
      : initialV2State(initialLanguage)
  );
  const [phase, setPhase] = useState<Phase>(demoMode ? "dashboard" : "setup");
  const [step, setStep] = useState(0);
  const [resultView, setResultView] = useState<"dashboard" | "trace">("dashboard");
  const [casePinned, setCasePinned] = useState(false);
  const [showAllCases, setShowAllCases] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showBandError, setShowBandError] = useState(false);
  const [showSelfCheckError, setShowSelfCheckError] = useState(false);
  const [selfChecks, setSelfChecks] = useState(initialSelfChecks);
  const [evidenceComparisons, setEvidenceComparisons] = useState<EvidenceComparisons>({});
  const [fifwmAssessment, setFifwmAssessment] = useState(initialCanonicalFifwmAssessment);
  const [scenarioOverrides, setScenarioOverrides] = useState<ScenarioOverrides>(
    {}
  );
  const [evidenceByLanguage, setEvidenceByLanguage] = useState<
    Record<V2Language, ExternalIntelligenceV2 | null>
  >({ en: null, ko: null });
  const [evidenceHttpByLanguage, setEvidenceHttpByLanguage] = useState<
    Record<V2Language, V2EvidenceHttpObservation | null>
  >({ en: null, ko: null });
  const [evidenceLoadingLanguage, setEvidenceLoadingLanguage] =
    useState<V2Language | null>(null);
  const evidencePending = useRef(false);
  // dashboard_generated is recorded once per page: a retry, a re-render or a
  // double click never records it again.
  const dashboardRecorded = useRef(false);
  // Per-topic results of the last search, so "search again" re-requests only
  // the topics that are missing or failed and merges them into what exists.
  const topicRun = useRef<{
    key: string;
    request: V2EvidenceRequest;
    groups: string[][];
    lives: (ExternalIntelligenceV2 | undefined)[];
  } | null>(null);
  const languagePinned = useRef(params.has("lang"));
  const simOpened = useRef(false);
  const restorePrintTitle = useRef<(() => void) | null>(null);
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [topicStates, setTopicStates] = useState<{ areas: string[]; state: "running" | "done" | "empty" }[]>([]);
  const [trackingObservation, setTrackingObservation] = useState<JourneyTrackingObservation | null>(null);
  const t = (key: V2CopyKey) => v2t(language, key);
  const caseFifwm = v2CaseFifwmSet(state.caseType);
  const topicLabels = topicStates.map(topic => ({
    label: topic.areas.map(area => v2t(language, area as V2CopyKey)).join("·"),
    state: topic.state,
  }));
  const caseRanking = useMemo(
    () => inferV2CaseRanking(state),
    [state.decision, state.optionA, state.optionB]
  );
  // Until the customer picks a type, it follows what they wrote in all three sentences.
  // The decision sentence is derived from the two fields the customer writes.
  const withDecision = (next: V2State): V2State => ({
    ...next,
    decision: next.optionA.trim() || next.optionB.trim()
      ? language === "ko"
        ? `현재: ${next.optionA.trim()} → 고민: ${next.optionB.trim()}`
        : `Current: ${next.optionA.trim()} → Considering: ${next.optionB.trim()}`
      : "",
  });
  const pinKoreanFromText = (value: string) => {
    if (!languagePinned.current && /[가-힣]/.test(value)) setLanguage("ko");
  };
  const withInferredCase = (next: V2State): V2State => {
    if (casePinned) return next;
    const caseType = inferV2CaseType(next);
    return caseType === next.caseType ? next : v2WithCaseType(next, caseType);
  };
  const selfCards = useMemo(
    () => selfCheckCards(state.caseType, language),
    [state.caseType, language]
  );
  const completedSelfChecks = selfCards.filter(card =>
    selfCheckComplete(card, selfChecks, state.bandSelections)
  ).length;
  const update = (patch: Partial<V2State>) =>
    setState(s => ({ ...s, ...patch }));
  const setBand = <K extends keyof V2State["bands"]>(
    key: K,
    value: V2State["bands"][K]
  ) =>
    setState(s => ({
      ...s,
      bands: { ...s.bands, [key]: value },
      bandSelections: { ...s.bandSelections, [key]: true },
    }));
  const toggle = (
    key: keyof Pick<
      V2State,
      | "whyNow"
      | "protects"
      | "opens"
      | "exposes"
      | "externalAreas"
      | "missingAssets"
      | "supportSources"
      | "constraints"
    >,
    value: V2CopyKey,
    limit = 99
  ) =>
    setState(s => {
      const old = s[key],
        next = old.includes(value)
          ? old.filter(x => x !== value)
          : old.length < limit
            ? [...old, value]
            : old;
      return { ...s, [key]: next };
    });
  const track = (
    eventType: JourneyEventType,
    patch: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {},
    newSubmission = false,
    eventLanguage: V2Language = language
  ) => {
    if (demoMode || !state.serviceConsent) return;
    void trackV2Journey({
      eventType,
      language: eventLanguage,
      serviceStorageConsent: true,
      newSubmission,
      metadata: projectInteractiveMetadata({ ...v2Identity, ...metadata }),
      patch: projectInteractivePatch({
        ...patch,
        language: eventLanguage,
        caseType: state.caseType,
        serviceStorageConsent: true,
        researchUseConsent: state.researchConsent,
        structuralOutputJson: {
          ...v2Identity,
          ...((patch.structuralOutputJson as object) || {}),
        },
      }),
    }, observation => {
      // Retain the last attempted request; a skipped follow-up must not hide
      // the backend failure that prevented creating its journey.
      if (observation.outcome !== "skipped") setTrackingObservation(observation);
    });
  };
  useEffect(() => {
    if (demoMode) {
      const fixture = v2DemoFixture(kind, language);
      setState(fixture.state);
    } else setState(s => ({ ...s, language }));
  }, [language, kind, demoMode]);
  useEffect(() => {
    setSelfChecks(initialSelfChecks());
    setEvidenceComparisons({});
    setFifwmAssessment(initialCanonicalFifwmAssessment());
    // Topic picks from another case family would make the search request invalid.
    setState(s => {
      const externalAreas = v2AreasForCase(s.externalAreas, s.caseType);
      return externalAreas.length === s.externalAreas.length ? s : { ...s, externalAreas };
    });
  }, [state.caseType]);
  useEffect(() => {
    if (phase !== "report") {
      restorePrintTitle.current?.();
      restorePrintTitle.current = null;
    }
  }, [phase]);
  useEffect(() => () => restorePrintTitle.current?.(), []);
  // Real elapsed time of the in-flight request; no simulated progress.
  useEffect(() => {
    if (phase !== "processing" || evidenceLoadingLanguage === null) return;
    const started = Date.now();
    setProcessingSeconds(0);
    const timer = window.setInterval(
      () => setProcessingSeconds(Math.round((Date.now() - started) / 1000)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [phase, evidenceLoadingLanguage]);
  const intelligence = useMemo(
    () =>
      demoMode
        ? v2DemoFixture(kind, language).intelligence
        : (v2PickEvidence(evidenceByLanguage, language, researchLanguage) ??
          unavailableIntelligence(state.caseType, language)),
    [demoMode, kind, language, researchLanguage, state.caseType, evidenceByLanguage]
  );
  // Language the evidence wording is actually in (translation when available).
  const pickedEvidence = v2PickEvidence(evidenceByLanguage, language, researchLanguage);
  const evidenceTextLanguage: V2Language =
    demoMode || (pickedEvidence !== null && pickedEvidence === evidenceByLanguage[language]) ? language : researchLanguage;
  const evidencePhase = demoMode
    ? "demo"
    : evidenceLoadingLanguage !== null && evidenceByLanguage[researchLanguage]?.status !== "live"
      ? "loading"
      : (evidenceByLanguage[researchLanguage]?.status ?? "not_checked");
  // While any topic is still searching, a printout would be incomplete.
  const evidenceCollecting = topicStates.some(topic => topic.state === "running");
  // The search finished with some topics found and others failed: the failed
  // ones can be searched again alone (the resume path in checkCurrentEvidence).
  const canRetryFailedTopics =
    !demoMode &&
    evidenceLoadingLanguage === null &&
    evidencePhase === "live" &&
    topicStates.some(topic => topic.state === "empty") &&
    topicStates.some(topic => topic.state === "done");
  const input = useMemo(
    () => buildV2Input(state, intelligence, fifwmAssessment),
    [state, intelligence, fifwmAssessment]
  );
  const core = useMemo(() => buildProductApplicationV3(input), [input]);
  const analysisVisible = phase === "dashboard" || phase === "report";
  const sensitivity = useMemo(
    () => (analysisVisible ? buildV2Sensitivity(input, core) : []),
    [analysisVisible, input, core]
  );
  const visibleVariables = useMemo(
    () => selectV2SimulatorVariables(sensitivity, baselineBands(input)),
    [sensitivity, input]
  );
  const candidates = useMemo(
    () => v2SwitchCandidates(state, intelligence),
    [state, intelligence]
  );
  const chipGroup = (
    label: V2CopyKey,
    field: Parameters<typeof toggle>[0],
    choices: readonly V2CopyKey[],
    limit = 99
  ) => (
    <fieldset className="v2-field">
      <legend>{t(label)}</legend>
      {field in v2SurveyGroups ? (
        // Grouped, specific wording; the keys and what the engine reads are unchanged.
        <div className="v2-chip-groups">
          {v2SurveyGroupsFor(field as V2SurveyField, choices, language, t).map(group => (
            <div className="v2-chip-group" key={group.title}>
              <span className="v2-chip-group-title">{group.title}</span>
              <div className="v2-chips">
                {group.items.map(item => (
                  <button
                    type="button"
                    key={item.key}
                    aria-pressed={state[field].includes(item.key)}
                    onClick={() => toggle(field, item.key, limit)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="v2-chips">
          {choices.map(choice => (
            <button
              type="button"
              key={choice}
              aria-pressed={state[field].includes(choice)}
              onClick={() => toggle(field, choice, limit)}
            >
              {t(choice)}
            </button>
          ))}
        </div>
      )}
      {limit < 99 && <small className="v2-chip-limit">{language === "ko" ? `최대 ${limit}개` : `Up to ${limit}`}</small>}
    </fieldset>
  );
  const bandGroup = (
    label: V2CopyKey,
    field: keyof V2State["bands"],
    choices: readonly string[]
  ) => (
    <fieldset
      className={`v2-field${showBandError && !state.bandSelections[field] ? " v2-band-error" : ""}`}
      aria-invalid={showBandError && !state.bandSelections[field]}
    >
      <legend>{t(label)}</legend>
      <div className="v2-band-choices">
        {choices.map(choice => (
          <button
            type="button"
            key={choice}
            aria-pressed={
              state.bandSelections[field] && state.bands[field] === choice
            }
            onClick={() => setBand(field, choice as never)}
          >
            {t(choice as V2CopyKey)}
            {v2BandAnchor(field, choice, language === "ko") && (
              <small className="v2-band-choice-note">{v2BandAnchor(field, choice, language === "ko")}</small>
            )}
          </button>
        ))}
      </div>
      {showBandError && !state.bandSelections[field] && (
        <p className="v2-band-error-text">{t("chooseCurrentState")}</p>
      )}
    </fieldset>
  );
  const radioGroup = (
    label: V2CopyKey,
    field: "waitEffect" | "timingEffect",
    choices: readonly V2CopyKey[]
  ) => (
    <fieldset className="v2-field">
      <legend>{t(label)}</legend>
      <div className="v2-band-choices">
        {choices.map(choice => (
          <button
            type="button"
            key={choice}
            aria-pressed={state[field] === choice}
            onClick={() => update({ [field]: choice })}
          >
            {t(choice)}
          </button>
        ))}
      </div>
    </fieldset>
  );
  const switchGroup = (side: "B" | "A") => (
    <div className="v2-switch-column">
      <h3>{t(side === "B" ? "supportsB" : "supportsA")}</h3>
      {candidates
        .filter(c => c.side === side)
        .map(c => (
          <button
            type="button"
            key={c.id}
            aria-pressed={state.switchIds.includes(c.id)}
            onClick={() =>
              setState(s => ({
                ...s,
                switchIds: s.switchIds.includes(c.id)
                  ? s.switchIds.filter(x => x !== c.id)
                  : s.switchIds.length < 3
                    ? [...s.switchIds, c.id]
                    : s.switchIds,
              }))
            }
          >
            {c.text}
          </button>
        ))}
    </div>
  );
  const selfCheckCard = (id: SelfCheckId, controls: ReactNode) => {
    const card = selfCards.find(item => item.id === id)!;
    const answer = selfChecks[id];
    const incomplete = showSelfCheckError && !selfCheckComplete(card, selfChecks, state.bandSelections);
    const statusLabels: Record<SelfCheckStatus, string> = language === "ko"
      ? { notChecked: "아직 확인하지 않음", unsure: "잘 모르겠음", checked: "직접 확인한 것이 있음" }
      : { notChecked: "Not checked yet", unsure: "Not sure", checked: "I have checked something" };
    return (
      <section className={`v2-self-card${incomplete ? " v2-band-error" : ""}`} key={id} aria-label={card.title}>
        <div className="v2-self-card-head"><span>{selfCards.indexOf(card) + 1} / {selfCards.length}</span><h3>{card.title}</h3></div>
        <p>{card.question}</p>
        <p className="v2-self-example">{card.example}</p>
        {controls}
        <fieldset className="v2-field">
          <legend>{language === "ko" ? "이 내용을 직접 확인해 봤나요?" : "Have you checked this yourself?"}</legend>
          <div className="v2-band-choices">
            {(["notChecked", "unsure", "checked"] as const).map(status => (
              <button type="button" key={status} aria-pressed={answer.status === status}
                onClick={() => setSelfChecks(previous => ({...previous, [id]: {...previous[id], status}}))}>
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </fieldset>
        {answer.status === "checked" && (
          <label className="v2-optional">
            {language === "ko" ? "무엇을 확인했는지 짧게 적어 주세요" : "Briefly note what you checked"}
            <textarea maxLength={180} value={answer.detail} onChange={event =>
              setSelfChecks(previous => ({...previous, [id]: {...previous[id], detail: event.target.value}}))
            } />
          </label>
        )}
        {incomplete && <p className="v2-band-error-text">{language === "ko" ? "확인 여부와 각 항목을 골라 주세요. 확인한 것이 있다면 짧게 적어 주세요." : "Choose whether you checked it and answer each item. If you checked something, note it briefly."}</p>}
        <small>{language === "ko" ? "본인 응답입니다. 외부에서 확인한 결과는 아닙니다." : "This is your own answer. It has not been checked externally."}</small>
      </section>
    );
  };
  const moduleBody = () => {
    switch (step) {
      case 0:
        return (
          <>
            {chipGroup("whyNow", "whyNow", v2Choices.whyNow, 2)}
            <section className="v2-key-facts" aria-label={language === "ko" ? "내 상황을 조금 더 알려 주세요" : "Tell us a bit more about your situation"}>
              <h3>{language === "ko" ? "내 상황을 조금 더 알려 주세요" : "Tell us a bit more about your situation"}</h3>
              <p className="v2-guidance">{language === "ko"
                ? "답에 맞춰 찾아볼 제도와 비용을 좁히고, 내 상황에서 확인할 것을 분석에 넣습니다. 점수에는 반영하지 않습니다. 모르는 질문은 넘어가도 됩니다."
                : "Your answers narrow which rules and costs we look up, and add checks that fit your situation. They do not affect any score. Skip any question you are unsure about."}</p>
              {v2KeyFactQuestions(state.caseType).map(question => (
                <fieldset className="v2-field" key={question.id}>
                  <legend>{question.question[language === "ko" ? 0 : 1]}</legend>
                  <div className="v2-band-choices">
                    {question.options.map(option => {
                      const on = (state.keyFacts ?? {})[question.id] === option.id;
                      return (
                        <button type="button" key={option.id} aria-pressed={on}
                          onClick={() => setState(s => {
                            const keyFacts = { ...(s.keyFacts ?? {}) };
                            if (on) delete keyFacts[question.id];
                            else keyFacts[question.id] = option.id;
                            return { ...s, keyFacts };
                          })}>
                          {option.label[language === "ko" ? 0 : 1]}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </section>
            {radioGroup("wait", "waitEffect", [
              "improves",
              "little",
              "harder",
              "unsure",
            ])}
            <label className="v2-optional">
              {t("optional")} / {t("addContext")}
              <input
                value={state.optionalNote}
                maxLength={180}
                onChange={e => update({ optionalNote: e.target.value })}
              />
            </label>
          </>
        );
      case 1:
        return (
          <>
            <div className="v2-options-recap">
              <div>
                <span>{t("optionA")}</span>
                <strong>{v2RoleFields(language, state).current.text}</strong>
              </div>
              <div>
                <span>{t("optionB")}</span>
                <strong>{v2RoleFields(language, state).target.text}</strong>
              </div>
            </div>
            {chipGroup("protect", "protects", v2Choices.protects)}
            {chipGroup("open", "opens", v2Choices.opens)}
            {chipGroup("expose", "exposes", v2Choices.exposes)}
          </>
        );
      case 2:
        return (
          <>
            {selfCheckCard("public", <>
            {chipGroup(
              "validateArea",
              "externalAreas",
              v2ExternalOptions(state.caseType)
            )}
            <label className="v2-optional">
              {language === "ko"
                ? state.caseType === "Entrepreneurship"
                  ? "검색할 대상: 어떤 고객에게 무엇을 팔지"
                  : state.caseType === "Industry Transition"
                    ? "검색할 대상: 옮겨 갈 산업과 직무"
                    : state.caseType === "MBA / EMBA / PhD Decision"
                      ? "검색할 대상: 학교 이름과 과정 이름"
                    : state.caseType === "Overseas Relocation"
                      ? "검색할 대상: 현지에서 할 일과 머물 방법, 예: 취업비자·영주권"
                      : "검색할 대상: 구체적인 직무·기관·과정"
                : state.caseType === "Entrepreneurship"
                  ? "What to search for: who you would sell to, and what"
                  : state.caseType === "Industry Transition"
                    ? "What to search for: the industry and role you are moving to"
                    : state.caseType === "MBA / EMBA / PhD Decision"
                      ? "What to search for: the school and program name"
                    : state.caseType === "Overseas Relocation"
                      ? "What to search for: the work you would do there and how you would stay, e.g. work visa or permanent residence"
                      : "What to search for: a specific role, organization or program"}
              <input
                value={v2PublicSearchTarget(state)}
                maxLength={120}
                placeholder={language === "ko"
                  ? state.caseType === "Entrepreneurship" ? "예: 서울 소형 식당을 위한 재고관리 서비스" : state.caseType === "Industry Transition" ? "예: 반도체 제조업의 공정 엔지니어" : state.caseType === "MBA / EMBA / PhD Decision" ? "예: ○○대학교 경영전문대학원 EMBA 주말 과정" : "구체적인 직무나 기관 이름을 적어 주세요"
                  : state.caseType === "Entrepreneurship" ? "e.g. inventory service for small restaurants" : state.caseType === "Industry Transition" ? "e.g. semiconductor process engineer" : state.caseType === "MBA / EMBA / PhD Decision" ? "e.g. [University] Executive MBA, weekend format" : "Enter a specific role or organization"}
                onChange={e => update({ publicSearchTarget: e.target.value })}
              />
            </label>
            <label className="v2-optional">
              {t("targetGeography")} {language === "ko" ? "(검색에 필요)" : "(needed for the search)"}
              <input
                value={state.targetGeography}
                maxLength={80}
                onChange={e => update({ targetGeography: e.target.value })}
              />
            </label>
            <p className="v2-guidance">
              {language === "ko"
                ? "위에서 고른 주제를 먼저 찾고, 이 결정 유형에서 기본으로 보는 주제도 함께 찾습니다. 예를 들어 해외 이주라면 비자, 채용 수요, 급여, 생활비를 봅니다. 검색 대상과 지역은 처음에 적은 ‘고민하는 커리어’로 미리 채워 두었습니다. 마지막 단계에서 이 내용으로 공개 자료를 찾습니다. 다르면 고쳐 주시고, 회사 기밀이나 개인정보가 있으면 지워 주세요. 점검 메모와 재정 정보는 검색에 쓰지 않습니다."
                : "We look up the topics you picked first, plus the standard topics for this kind of decision. For a move abroad, that means visas, hiring demand, pay and living costs. The search target and place were filled in from the career you are considering. The final step searches public sources with them. Edit them if needed, and remove any confidential or personal details. Your check notes and financial answers are never used in the search."}
            </p>
            </>)}
          </>
        );
      case 3:
        return (
          <>
            {selfCheckCard("readiness", <>
            {bandGroup("readinessBand", "internalReadiness", bandStrength)}
            {chipGroup(
              "missingAssets",
              "missingAssets",
              v2Choices.missingAssets
            )}
            </>)}
            {v2CanAskCanonicalFifwm(state.caseType) && (
              <section className="v2-self-card v2-canonical-fifwm" aria-label={language === "ko" ? "목표 회사와 직무 살펴보기" : "Your target company and role"}>
                <div className="v2-self-card-head"><h3>{language === "ko" ? "목표 회사와 직무 살펴보기" : "Your target company and role"}</h3></div>
                <p>{language === "ko"
                  ? "옮겨 갈 회사·부서와 직무·팀이 구체적일 때만 답해 주세요. 창업 계획이나 학위 과정은 여기서 평가하지 않습니다. 답하지 않은 항목은 평가하지 않습니다."
                  : "Answer only if you have a specific target company or team and role. Business plans and degree programs are not assessed here. Questions you skip are not assessed."}</p>
                <fieldset className="v2-field">
                  <legend>{language === "ko" ? "옮겨 갈 회사와 직무가 정해져 있나요?" : "Do you have a specific company and role in mind?"}</legend>
                  <div className="v2-band-choices">
                    {(["known", "not_applicable", "unsure"] as const).map(status => (
                      <button key={status} type="button" aria-pressed={fifwmAssessment.targetRoleStatus === status}
                        onClick={() => setFifwmAssessment(previous => status === "known"
                          ? { ...previous, targetRoleStatus: status }
                          : { ...initialCanonicalFifwmAssessment(), targetRoleStatus: status })}>
                        {status === "known"
                          ? (language === "ko" ? "있음" : "Yes")
                          : status === "not_applicable"
                            ? (language === "ko" ? "해당 없음" : "Not applicable")
                            : (language === "ko" ? "아직 모름" : "Not sure yet")}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {fifwmAssessment.targetRoleStatus === "known" && canonicalFifwmFields.map(field => (
                  <fieldset className="v2-field" key={field.field}>
                    <legend>{canonicalFifwmQuestion(field.number, language)}</legend>
                    <div className="v2-band-choices">
                      {Object.keys(field.choices).map(choice => (
                        <button type="button" key={choice} aria-pressed={fifwmAssessment.answers[field.field] === choice}
                          onClick={() => setFifwmAssessment(previous => ({ ...previous,
                            answers: { ...previous.answers, [field.field]: choice },
                          }))}>
                          {canonicalFifwmChoiceLabel(choice, language)}
                        </button>
                      ))}
                      {(["__unknown__", "__na__"] as const).map(choice => (
                        <button type="button" key={choice} aria-pressed={fifwmAssessment.answers[field.field] === choice}
                          onClick={() => setFifwmAssessment(previous => ({ ...previous,
                            answers: { ...previous.answers, [field.field]: choice },
                          }))}>
                          {choice === "__unknown__"
                            ? (language === "ko" ? "아직 모름" : "Not sure yet")
                            : (language === "ko" ? "해당 없음" : "Not applicable")}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <small>{language === "ko" ? "본인 응답입니다. 공개 자료로 개인의 경험을 확인한 것은 아닙니다." : "These are your own answers. Public sources do not check your personal experience."}</small>
              </section>
            )}
            {caseFifwm && (
              <section className="v2-self-card v2-canonical-fifwm v2-case-fifwm" aria-label={language === "ko" ? "사례 맞춤 구조 평가" : "Case-adapted structure assessment"}>
                <div className="v2-self-card-head"><h3>{language === "ko" ? "사례 맞춤 구조 평가" : "Case-adapted structure assessment"}</h3></div>
                <p>{language === "ko"
                  ? "기회의 조건, 연결 가능성, 구조 적합성, 실행 현실성, 버틸 수 있는가. 이 다섯 가지를 이 결정에 맞춰 묻습니다. 대상이 구체적일 때만 답해 주세요. 답하지 않은 항목은 평가하지 않습니다."
                  : "We ask about the same five areas, adapted to this kind of decision: opportunity conditions, connection, structural fit, execution reality and staying power. Answer only if your target is specific. Questions you skip are not assessed."}</p>
                <fieldset className="v2-field">
                  <legend>{caseFifwm.target[language === "ko" ? 1 : 0]}</legend>
                  <div className="v2-band-choices">
                    {(["known", "not_applicable", "unsure"] as const).map(status => (
                      <button key={status} type="button" aria-pressed={fifwmAssessment.targetRoleStatus === status}
                        onClick={() => setFifwmAssessment(previous => status === "known"
                          ? { ...previous, targetRoleStatus: status }
                          : { ...initialCanonicalFifwmAssessment(), targetRoleStatus: status })}>
                        {status === "known"
                          ? (language === "ko" ? "있음" : "Yes")
                          : status === "not_applicable"
                            ? (language === "ko" ? "해당 없음" : "Not applicable")
                            : (language === "ko" ? "아직 모름" : "Not sure yet")}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {fifwmAssessment.targetRoleStatus === "known" && caseFifwm.questions.map(question => (
                  <fieldset className="v2-field" key={question.field}>
                    <legend>{question.question[language === "ko" ? 1 : 0]}</legend>
                    <div className="v2-band-choices">
                      {question.choices.map((choice, score) => (
                        <button type="button" key={score} aria-pressed={fifwmAssessment.answers[question.field] === String(score)}
                          onClick={() => setFifwmAssessment(previous => ({ ...previous,
                            answers: { ...previous.answers, [question.field]: String(score) },
                          }))}>
                          {choice[language === "ko" ? 1 : 0]}
                        </button>
                      ))}
                      {(["__unknown__", "__na__"] as const).map(choice => (
                        <button type="button" key={choice} aria-pressed={fifwmAssessment.answers[question.field] === choice}
                          onClick={() => setFifwmAssessment(previous => ({ ...previous,
                            answers: { ...previous.answers, [question.field]: choice },
                          }))}>
                          {choice === "__unknown__"
                            ? (language === "ko" ? "아직 모름" : "Not sure yet")
                            : (language === "ko" ? "해당 없음" : "Not applicable")}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <small>{language === "ko" ? "본인 응답입니다. 공개 자료로 확인한 것은 아닙니다." : "These are your own answers, not checked against public sources."}</small>
              </section>
            )}
          </>
        );
      case 4:
        return (
          <>
            {selfCheckCard("financial", <>
            {bandGroup("financial", "financialRoom", bandStrength)}
            {bandGroup("downside", "downsideExposure", bandRisk)}
            </>)}
            {selfCheckCard("recovery", <>
            {bandGroup("reversibility", "reversibility", bandStrength)}
            <button
              type="button"
              className="v2-link-button"
              onClick={() => setShowContext(!showContext)}
            >
              {t("addContext")}
            </button>
            {showContext && (
              <label className="v2-optional">
                {t("optional")}
                <input
                  value={state.optionalNote}
                  maxLength={180}
                  onChange={e => update({ optionalNote: e.target.value })}
                />
              </label>
            )}
            </>)}
          </>
        );
      case 5:
        return (
          <>
            {selfCheckCard("capacity", <>
            {bandGroup("supportBand", "optionBSupport", bandStrength)}
            {chipGroup(
              "supportSource",
              "supportSources",
              v2Choices.supportSources
            )}
            {bandGroup("constraint", "constraintLoad", bandLoad)}
            {chipGroup("constraintSources", "constraints", v2Choices.constraints)}
            </>)}
          </>
        );
      case 6:
        return (
          <>
            {radioGroup("timingEffect", "timingEffect", [
              "waitReduces",
              "waitLittle",
              "waitIncreases",
              "mixed",
            ])}
          </>
        );
      default:
        return (
          <>
            <p className="v2-guidance">{t("chooseSwitch")}</p>
            <div className="v2-switch-grid">
              {switchGroup("B")}
              {switchGroup("A")}
            </div>
            <label className="v2-optional">
              {t("customCondition")}
              <input
                value={state.customCondition}
                maxLength={180}
                onChange={e => update({ customCondition: e.target.value })}
              />
            </label>
          </>
        );
    }
  };
  const structuralSummary = (
    summaryInput: typeof input,
    summaryCore: typeof core,
    externalEvidenceStatus: ExternalIntelligenceV2["status"]
  ) => ({
    ...v2Identity,
    completedIntakeQuestionCount: 8,
    baselineBands: baselineBands(summaryInput),
    currentStructuralPosture: { label: summaryCore.currentStructuralPosture.label },
    safetyMargin: { band: summaryCore.safetyMargin.band },
    changingPlays: summaryCore.changingPlays.map(p => ({ family: p.family })),
    decisionSwitchCount: summaryCore.decisionSwitches.length,
    externalEvidenceStatus,
  });
  // dashboard_generated is recorded only after every topic search has settled
  // (with the final evidence), or on an explicit structural-draft choice. The
  // results may open earlier, at the first usable topic, without recording it.
  const recordDashboard = (
    summaryInput: typeof input,
    summaryCore: typeof core,
    externalEvidenceStatus: ExternalIntelligenceV2["status"]
  ) => {
    if (dashboardRecorded.current) return;
    dashboardRecorded.current = true;
    track(
      "dashboard_generated",
      {
        currentStage: "dashboard_generated",
        reportGeneratedAt: new Date().toISOString(),
        structuralOutputJson: structuralSummary(summaryInput, summaryCore, externalEvidenceStatus),
        externalEvidenceMode: externalEvidenceStatus === "live" ? "live" : "fallback",
      },
      {
        selectedVariables: selectV2SimulatorVariables(
          buildV2Sensitivity(summaryInput, summaryCore),
          baselineBands(summaryInput)
        ),
      }
    );
  };
  const showDashboard = () => {
    setPhase("dashboard");
    window.scrollTo(0, 0);
  };
  const openDashboard = (
    summaryInput: typeof input,
    summaryCore: typeof core,
    externalEvidenceStatus: ExternalIntelligenceV2["status"]
  ) => {
    recordDashboard(summaryInput, summaryCore, externalEvidenceStatus);
    showDashboard();
  };
  const runEvidenceAnalysis = async () => {
    setPhase("processing");
    window.scrollTo(0, 0);
    let opened = false;
    const outcome = await checkCurrentEvidence(() => {
      opened = true;
      showDashboard();
    });
    if (outcome?.result.status === "live") {
      recordDashboard(outcome.input, outcome.core, "live");
      if (!opened) showDashboard();
    }
  };
  const finish = (withEvidence = true) => {
    if (!v2AllBandsAnswered(state)) {
      const firstIncomplete = [3, 4, 5, 6].find(
        i => v2UnansweredBands(state, i).length
      );
      setStep(firstIncomplete ?? 3);
      setShowBandError(true);
      return;
    }
    const firstIncompleteCard = selfCards.find(card => !selfCheckComplete(card, selfChecks, state.bandSelections));
    if (firstIncompleteCard) {
      setStep(firstIncompleteCard.step);
      setShowSelfCheckError(true);
      return;
    }
    track("full_intake_completed", {
      currentStage: "full_intake_completed",
      fullIntakeCompletedAt: new Date().toISOString(),
      structuralOutputJson: structuralSummary(input, core, intelligence.status),
      externalEvidenceMode: "fallback",
    });
    if (withEvidence && buildV2EvidenceRequest({ ...state, language })) void runEvidenceAnalysis();
    else openDashboard(input, core, intelligence.status);
  };
  const switchLanguage = (next: V2Language) => {
    languagePinned.current = true;
    if (next === language) return;
    track("language_changed", {}, { from: language, to: next }, false, next);
    restorePrintTitle.current?.();
    restorePrintTitle.current = null;
    setLanguage(next);
  };
  type EvidenceOutcome = { result: ExternalIntelligenceV2; input: typeof input; core: typeof core };
  // Each topic is its own request (its own serverless time budget). Results
  // fill in as topics arrive; results open after the first usable topic.
  const checkCurrentEvidence = async (onFirstLive?: () => void): Promise<EvidenceOutcome | null> => {
    if (demoMode || evidencePending.current) return null;
    const fresh = buildV2EvidenceRequest({ ...state, language });
    if (!fresh) {
      setStep(2);
      setPhase("modules");
      window.scrollTo(0, 0);
      return null;
    }
    // Same search inputs (interface language aside) continue the last run:
    // only topics that are missing or failed are searched again (audit M8).
    const runKey = (r: V2EvidenceRequest) => JSON.stringify({ ...r, language: undefined });
    const previousRun = topicRun.current?.key === runKey(fresh) ? topicRun.current : null;
    const missing = previousRun ? v2MissingGroups(previousRun.lives) : [];
    const resume = !!previousRun && missing.length > 0 && previousRun.lives.some(Boolean);
    const existing = evidenceByLanguage[language];
    if (existing?.status === "live" && !resume)
      return { result: existing, input, core };
    const request = resume ? previousRun!.request : fresh;
    const groups = resume ? previousRun!.groups : v2EvidenceGroups(request);
    const lives: (ExternalIntelligenceV2 | undefined)[] = resume ? [...previousRun!.lives] : groups.map(() => undefined);
    const toRun = resume ? missing : groups.map((_, i) => i);
    topicRun.current = { key: runKey(request), request, groups, lives };
    evidencePending.current = true;
    setResearchLanguage(request.language);
    setEvidenceLoadingLanguage(language);
    setTopicStates(groups.map((areas, i) => ({ areas, state: toRun.includes(i) ? "running" : "done" })));
    // A new run never shows an older snapshot or translation (audit H3).
    // Comparisons are keyed by source and area (language-independent), so a
    // new search that may bring different claims starts without them.
    if (!resume) {
      setEvidenceByLanguage({ en: null, ko: null });
      setEvidenceComparisons({});
    }
    track(
      "external_evidence_requested",
      {},
      { externalEvidenceMode: "checking" }
    );
    const other: V2Language = request.language === "ko" ? "en" : "ko";
    const running = new Set(toRun);
    let lastResult: ExternalIntelligenceV2 | null = null;
    const merged = () => mergeV2Evidence(lives.filter((l): l is ExternalIntelligenceV2 => !!l), request);
    // Topics still in flight are marked pending so they never read as "no evidence" (audit M5).
    const publish = () => setEvidenceByLanguage(previous =>
      v2StoreEvidence(previous, request.language, merged(), Array.from(running).flatMap(i => groups[i])));
    const outcomeFor = (result: ExternalIntelligenceV2): EvidenceOutcome => {
      const updatedInput = buildV2Input({ ...state, language: request.language }, result, fifwmAssessment);
      return { result, input: updatedInput, core: buildProductApplicationV3(updatedInput) };
    };
    let first = true;
    if (resume) {
      publish();
      first = false;
      onFirstLive?.();
    }
    await Promise.all(toRun.map(async (index, order) => {
      const areas = groups[index];
      // Stagger starts so parallel topics do not hit the provider at once.
      if (order) await new Promise(resolve => setTimeout(resolve, order * 700));
      const ask = async (topicAreas: string[]) => {
        const seen: { observation: V2EvidenceHttpObservation | null } = { observation: null };
        const result = await requestV2Evidence({ ...request, externalAreas: topicAreas }, fetch, observation => {
          seen.observation = observation;
          setEvidenceHttpByLanguage(previous => ({ ...previous, [request.language]: observation }));
        });
        // pendingAreas is client-only; never take it from a response.
        return { result: v2WithoutPending(result), observation: seen.observation };
      };
      const firstTry = await ask(areas);
      let result = firstTry.result;
      // A topic with no usable evidence is retried once, narrower: each item
      // on its own (issue B1). Permanent failures are not retried (audit L4).
      if (v2ShouldRetryTopic(firstTry.observation, result)) {
        const retries = await Promise.all((areas.length > 1 ? areas.map(area => [area]) : [areas]).map(ask));
        const found = retries.map(retry => retry.result).filter(retry => retry.status === "live");
        if (found.length) result = mergeV2Evidence(found, { ...request, externalAreas: areas });
      }
      lastResult = result;
      running.delete(index);
      if (result.status === "live") lives[index] = result;
      setTopicStates(previous => previous.map((topic, i) => i === index
        ? { ...topic, state: result.status === "live" ? "done" : "empty" }
        : topic));
      // One search may return both languages; store each so the toggle
      // switches wording without searching again.
      if (lives.some(Boolean)) publish();
      if (result.status === "live" && first) {
        first = false;
        onFirstLive?.();
      }
    }));
    const final = lives.some(Boolean)
      ? merged()
      : (lastResult ?? unavailableIntelligence(request.caseType, request.language));
    if (lives.some(Boolean)) publish();
    else setEvidenceByLanguage(previous => ({ ...previous, [request.language]: final, [other]: null }));
    const outcome = outcomeFor(final);
    track(
      final.status === "live"
        ? "external_evidence_live"
        : "external_evidence_fallback",
      {
        externalEvidenceMode: final.status === "live" ? "live" : "fallback",
        structuralOutputJson: structuralSummary(outcome.input, outcome.core, final.status),
      },
      { externalEvidenceMode: final.status === "live" ? "live" : "unverified" }
    );
    evidencePending.current = false;
    setEvidenceLoadingLanguage(null);
    return outcome;
  };
  const switchDemo = (next: V2DemoKind) => {
    if (next === kind) return;
    setScenarioOverrides({});
    setPhase("dashboard");
    simOpened.current = false;
    setKind(next);
  };
  return (
    <div className="v2-app" lang={language} data-testid="v2-app"
      data-ops-outcome={trackingObservation?.outcome}
      data-ops-reason={trackingObservation?.reasonCode}
      data-ops-http-status={trackingObservation?.httpStatus ?? undefined}
      data-ops-event={trackingObservation?.eventType}
      data-ops-storage-failure={trackingObservation?.storageFailure}
      data-evidence-language={!demoMode && evidenceByLanguage[researchLanguage] ? researchLanguage : undefined}
      data-evidence-http-status={evidenceHttpByLanguage[researchLanguage]?.status}
      data-evidence-reason-header={evidenceHttpByLanguage[researchLanguage]?.reason ?? undefined}
      data-evidence-stage={evidenceHttpByLanguage[researchLanguage]?.stage}
      data-evidence-diagnostic={evidenceHttpByLanguage[researchLanguage]?.diagnostic}
      data-evidence-field={evidenceHttpByLanguage[researchLanguage]?.field}
      data-evidence-source-check={evidenceHttpByLanguage[researchLanguage]?.sourceFailure}
      data-evidence-upstream-status={evidenceHttpByLanguage[researchLanguage]?.upstreamStatus}>
      <header className="v2-site-header">
        <div className="v2-masthead">
          <a className="v2-wordmark" href="/amc-interactive-v2">
            allofmycareer
          </a>
          <span className="v2-masthead-tag">Career Decision Research</span>
        </div>
        <div className="v2-header-right">
          {demoMode && <span className="v2-demo-label">{t("demoBadge")}</span>}
          <div className="v2-language" role="group" aria-label={language === "ko" ? "화면 언어" : "Interface language"}>
            <button
              type="button"
              aria-pressed={language === "en"}
              onClick={() => switchLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              aria-pressed={language === "ko"}
              onClick={() => switchLanguage("ko")}
            >
              KO
            </button>
          </div>
        </div>
      </header>
      {demoMode && phase !== "report" && (
        <nav className="v2-demo-nav" aria-label={t("selectDemo")}>
          <span>{t("selectDemo")}</span>
          <button
            aria-pressed={kind === "entrepreneurship"}
            onClick={() => switchDemo("entrepreneurship")}
          >
            {t("demoEntrepreneurship")}
          </button>
          <button
            aria-pressed={kind === "industry"}
            onClick={() => switchDemo("industry")}
          >
            {t("demoIndustry")}
          </button>
          <a href="/amc-interactive-v2">{t("startOwn")}</a>
        </nav>
      )}
      {phase === "setup" && (
        <main className="v2-intake">
          <div className="v2-intake-intro">
            <p className="v2-kicker">{t("eyebrow")}</p>
            <h1>{t("startTitle")}</h1>
            <p>{t("startIntro")}</p>
            <ul className="v2-method-points" aria-label={language === "ko" ? "분석 방법" : "How the analysis works"}>
              {([
                [Compass, language === "ko" ? "구조부터 보는 커리어 결정 분석" : "Structure First", "정답을 대신 고르지 않습니다. 무엇을 지키고 무엇을 얻는지, 위험이 어디에 있는지 보여 줍니다.", "We do not choose for you. We show what the choice keeps, what it opens and where the risk sits."],
                [Layers, language === "ko" ? "다섯 가지 관점" : "Five lenses", "기회의 조건 · 연결 가능성 · 구조 적합성 · 실행 현실성 · 버틸 수 있는가", "Opportunity conditions · connection · structural fit · execution reality · staying power"],
                [FileSearch, language === "ko" ? "확인할 수 있는 공개 자료" : "Public sources you can check", "인용한 페이지가 실제로 열리는 공개 자료만 근거로 씁니다.", "We only use public sources whose cited pages actually open."],
                [Lock, language === "ko" ? "답변 원문은 저장하지 않음" : "Your words stay private", "작성한 답변 원문은 저장하지 않습니다. 검색에는 검색 대상만 씁니다.", "Your written answers are not stored. Only the search target is used to search."],
              ] as const).map(([Icon, title, ko, en]) => (
                <li key={en}>
                  <Icon aria-hidden size={18} />
                  <div>
                    <strong>{title}</strong>
                    <span>{language === "ko" ? ko : en}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="v2-intake-steps">{language === "ko" ? "고민 적기 → 8단계 질문 → 공개 자료 검색 → 분석·보고서" : "Your decision → 8 steps of questions → public evidence → analysis and report"}</p>
          </div>
          <section className="v2-intake-panel">
            <p className="v2-kicker">{t("decisionSetup")}</p>
            <h2>{t("decisionSetup")}</h2>
            <p>{t("inputHint")}</p>
            <div className="v2-setup-fields">
              <label>
                {t("optionA")}
                <input
                  required
                  autoComplete="off"
                  value={state.optionA}
                  placeholder={t("optionAPlaceholder")}
                  maxLength={120}
                  onChange={e => { pinKoreanFromText(e.target.value); setState(s => withInferredCase(withDecision({ ...s, optionA: e.target.value }))); }}
                />
              </label>
              <label>
                {t("optionB")}
                <input
                  required
                  autoComplete="off"
                  value={state.optionB}
                  placeholder={t("optionBPlaceholder")}
                  maxLength={120}
                  onChange={e => { pinKoreanFromText(e.target.value); setState(s => withInferredCase(withDecision({ ...s, optionB: e.target.value }))); }}
                />
              </label>
            </div>
            <section className="v2-case-picker" aria-label={language === "ko" ? "결정 유형" : "Decision type"}>
              <p className="v2-case-picker-label">
                {language === "ko" ? "적어 주신 내용으로 본 결정 유형" : "The decision type that fits what you wrote"}
              </p>
              <div className="v2-case-recommended" data-case={state.caseType}>
                <strong>{v2CaseLabel(language, state.caseType)}</strong>
                <span>{v2CaseDescription(language, state.caseType)}</span>
                {inferV2Geography(state, language) && (
                  <span className="v2-case-geo">
                    {language === "ko" ? "찾은 지역: " : "Place found: "}<b>{inferV2Geography(state, language)}</b>
                    {language === "ko" ? " · 공개 자료 검색에 씁니다" : " · used for the public search"}
                  </span>
                )}
                {caseRanking[0]?.caseType === state.caseType && caseRanking[0].matched.length > 0 && (
                  <small>{language === "ko" ? "이 단어를 보고 골랐습니다: " : "Picked from: "}{caseRanking[0].matched.map(word => `‘${word}’`).join(" · ")}</small>
                )}
              </div>
              <p className="v2-case-picker-hint">
                {language === "ko" ? "다르다면 가장 가까운 유형을 고르세요." : "If this is not right, choose the closest type."}
              </p>
              <div className="v2-case-options" role="radiogroup" aria-label={language === "ko" ? "결정 유형 선택" : "Choose decision type"}>
                {(showAllCases
                  ? caseTypes
                  : Array.from(new Set([state.caseType, ...caseRanking.filter(r => r.score > 0).map(r => r.caseType), "General Career Reconfiguration" as V2CaseType])).slice(0, 3)
                ).map(c => (
                  <button key={c} type="button" role="radio" aria-checked={state.caseType === c}
                    onClick={() => { setState(s => v2WithCaseType(s, c)); setCasePinned(true); }}>
                    <b>{v2CaseLabel(language, c)}</b>
                    <span>{v2CaseDescription(language, c)}</span>
                  </button>
                ))}
              </div>
              {!showAllCases && (
                <button type="button" className="v2-link-button" onClick={() => setShowAllCases(true)}>
                  {language === "ko" ? "모든 유형 보기 (9개)" : "Show all types (9)"}
                </button>
              )}
            </section>
            <p className="v2-privacy">{t("privacy")}</p>
            <label className="v2-consent">
              <input
                type="checkbox"
                checked={state.serviceConsent}
                onChange={e => update({ serviceConsent: e.target.checked })}
              />
              {t("consent")}
            </label>
            <label className="v2-consent">
              <input
                type="checkbox"
                checked={state.researchConsent}
                onChange={e => update({ researchConsent: e.target.checked })}
              />
              {t("research")}
            </label>
            <button
              className="v2-primary"
              type="button"
              disabled={
                !state.optionA.trim() ||
                !state.optionB.trim() ||
                !state.serviceConsent
              }
              onClick={() => {
                setCasePinned(true);
                // Prefill the public search from the path being explored; the
                // customer reviews and can edit it before any search runs.
                setState(s => ({
                  ...s,
                  publicSearchTarget: s.publicSearchTarget?.trim() ? s.publicSearchTarget : inferV2SearchTarget(s),
                  // No place named: a Korean entry defaults to Korea (editable in step 3) so the search can run.
                  targetGeography: s.targetGeography.trim() ? s.targetGeography : inferV2Geography(s, language) || (language === "ko" ? "한국" : ""),
                }));
                track(
                  "preview_started",
                  {
                    currentStage: "preview_started",
                    previewStartedAt: new Date().toISOString(),
                  },
                  {},
                  true
                );
                track("full_intake_started", {
                  currentStage: "full_intake_started",
                  fullIntakeStartedAt: new Date().toISOString(),
                });
                setPhase("modules");
                window.scrollTo(0, 0);
              }}
            >
              {t("begin")} ↗
            </button>
          </section>
        </main>
      )}
      {phase === "modules" && (
        <main className="v2-module">
          <div className="v2-module-sidebar">
            <p className="v2-kicker">{t("decisionSetup")}</p>
            <h1>
              {t("step")} {step + 1} {t("of")} 8
            </h1>
            <div className="v2-progress">
              <i style={{ width: `${(step + 1) * 12.5}%` }} />
            </div>
            <p className="v2-self-progress" aria-live="polite">
              {language === "ko" ? `점검 질문 ${selfCards.length}개 중 ${completedSelfChecks}개 답함` : `${completedSelfChecks} of ${selfCards.length} check questions answered`}
            </p>
            <ol>
              {v2ModuleKeys.map((key, i) => (
                <li
                  key={key}
                  className={step === i ? "active" : step > i ? "done" : ""}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {t(key)}
                </li>
              ))}
            </ol>
            <p className="v2-guidance">{t("privacy")}</p>
          </div>
          <section className="v2-module-main">
            <div className="v2-module-top">
              <span>
                {t("step")} {step + 1} {t("of")} 8
              </span>
              <span>
                {v2UnansweredBands(state, step).length > 0
                  ? v2UnansweredBands(state, step).length === 1
                      ? t("oneSelectionNeeded")
                      : `${v2UnansweredBands(state, step).length}${language === "ko" ? "" : " "}${t("selectionsNeeded")}`
                  : selfCards.some(card => card.step === step && !selfCheckComplete(card, selfChecks, state.bandSelections))
                    ? language === "ko" ? "점검 질문에 답해 주세요" : "A check question needs an answer"
                    : v2RequiredBandsByStep[step] ? t("complete") : t("optional")}
              </span>
            </div>
            <h2>{t(v2ModuleKeys[step])}</h2>
            <div className="v2-module-fields">{moduleBody()}</div>
            {step === 7 && (
              <div className="v2-search-review">
                <strong>
                  {language === "ko"
                    ? "마지막 분석에서 검색할 내용"
                    : "What the final analysis will search for"}
                </strong>
                <p>
                  {v2PublicSearchTarget(state) || (language === "ko" ? "검색 대상을 아직 적지 않음" : "No search target yet")}
                  {state.targetGeography && ` / ${state.targetGeography}`}
                </p>
                <p>
                  {(v2SituationalAreas(state) as V2CopyKey[]).map(t).join(" · ")}
                </p>
                <small>
                  {buildV2EvidenceRequest(state)
                    ? language === "ko"
                      ? "아래 버튼을 누르면 위 대상과 지역으로 공개 자료를 검색합니다."
                      : "The button below searches public sources for the target and place above."
                    : language === "ko"
                      ? "공개 자료를 검색하려면 3단계에서 검색 대상과 지역을 적어 주세요. 검색 없이 본 초안은 지금 바로 볼 수 있습니다."
                      : "To search, enter a target and place in step 3. You can see a draft without public search now."}
                </small>
                {!buildV2EvidenceRequest(state) && (
                  <button type="button" className="v2-primary v2-jump-step" onClick={() => { setStep(2); window.scrollTo(0, 0); }}>
                    {language === "ko" ? "3단계로 가서 검색 대상과 지역 적기 ↩" : "Go to step 3 to enter the target and place ↩"}
                  </button>
                )}
                <button
                  type="button"
                  className="v2-link-button"
                  onClick={() => finish(false)}
                >
                  {language === "ko"
                    ? "검색 없이 본 초안 먼저 보기"
                    : "See a draft without public search first"}
                </button>
              </div>
            )}
            <div className="v2-module-nav">
              <button
                type="button"
                onClick={() => {
                  setShowBandError(false);
                  setShowSelfCheckError(false);
                  if (step === 0) setPhase("setup");
                  else setStep(step - 1);
                  window.scrollTo(0, 0);
                }}
              >
                {t("back")}
              </button>
              <button
                type="button"
                className="v2-primary"
                disabled={step === 7 && !buildV2EvidenceRequest(state)}
                onClick={() => {
                  if (v2UnansweredBands(state, step).length) {
                    setShowBandError(true);
                    return;
                  }
                  if (selfCards.some(card => card.step === step && !selfCheckComplete(card, selfChecks, state.bandSelections))) {
                    setShowSelfCheckError(true);
                    return;
                  }
                  setShowBandError(false);
                  setShowSelfCheckError(false);
                  if (step === 7) finish();
                  else {
                    setStep(step + 1);
                    window.scrollTo(0, 0);
                  }
                }}
              >
                {step === 7
                  ? language === "ko"
                    ? "공개 자료를 찾아 분석하기"
                    : "Search public sources and analyze"
                  : t("next")}{" "}
                ↗
              </button>
            </div>
          </section>
        </main>
      )}
      {phase === "processing" && (
        <V2Processing
          language={language}
          running={evidenceLoadingLanguage !== null}
          seconds={processingSeconds}
          target={v2PublicSearchTarget(state)}
          geography={state.targetGeography}
          areas={(v2SituationalAreas(state) as V2CopyKey[]).map(t)}
          observation={evidenceHttpByLanguage[researchLanguage]}
          onRetry={() => void runEvidenceAnalysis()}
          onEditTarget={() => {
            setStep(2);
            setPhase("modules");
            window.scrollTo(0, 0);
          }}
          onDraft={() => openDashboard(input, core, intelligence.status)}
          topics={topicLabels}
        />
      )}
      {phase === "dashboard" && topicLabels.some(topic => topic.state === "running") && (
        <div className="v2-collecting" role="status" aria-live="polite">
          <strong>{language === "ko" ? "근거 추가 수집 중" : "Still collecting evidence"}</strong>
          <span>
            {topicLabels.map(topic => `${topic.label} ${topic.state === "running" ? (language === "ko" ? "· 수집 중" : "· collecting") : topic.state === "done" ? "✓" : (language === "ko" ? "· 근거 없음" : "· none")}`).join(" / ")}
          </span>
          <small>{language === "ko" ? "도착하는 근거는 이 화면과 보고서에 자동으로 반영됩니다. 검색을 다시 실행하지 않습니다." : "Arriving evidence is added to this view and the report automatically, without a new search."}</small>
        </div>
      )}
      {phase === "dashboard" && (
        // Results view switch: the existing dashboard or the read-only decision trace.
        <div className="v2-view-tabs" role="tablist" aria-label={language === "ko" ? "결과 보기 방식" : "Result view"}>
          {(["dashboard", "trace"] as const).map(view => (
            <button key={view} type="button" role="tab" aria-selected={resultView === view} onClick={() => setResultView(view)}>
              {view === "dashboard"
                ? (language === "ko" ? "결과 요약" : "Summary")
                : (language === "ko" ? "결론 추적" : "Decision trace")}
            </button>
          ))}
        </div>
      )}
      {phase === "dashboard" && resultView === "trace" && (
        <V2DecisionTracePanel
          state={state}
          input={input}
          core={core}
          intelligence={intelligence}
          sensitivity={sensitivity}
          selfChecks={selfChecks}
          comparisons={evidenceComparisons}
          evidencePhase={evidencePhase}
          evidenceLanguage={evidenceTextLanguage}
          recordId={activeAmcSubmissionId("interactive-v2")}
          printBlocked={evidenceCollecting}
        />
      )}
      {phase === "dashboard" && resultView === "dashboard" && (
        <>
          <V2Dashboard
            state={state}
            selfChecks={selfChecks}
            comparisons={evidenceComparisons}
            onComparisonChange={(key, answer) => setEvidenceComparisons(current => ({ ...current, [key]: answer }))}
            core={core}
            intelligence={intelligence}
            evidenceLanguage={evidenceTextLanguage}
            evidencePhase={evidencePhase}
            onCheckEvidence={() => void checkCurrentEvidence()}
            onRetryFailedTopics={canRetryFailedTopics ? () => void checkCurrentEvidence() : undefined}
            input={input}
            onReport={() => {
              track("detailed_report_opened", {
                currentStage: "detailed_report_opened",
              });
              setPhase("report");
              window.scrollTo(0, 0);
            }}
          />
          <V2Simulator
            state={state}
            selfChecks={selfChecks}
            comparisons={evidenceComparisons}
            input={input}
            baseline={core}
            sensitivity={sensitivity}
            visibleVariables={visibleVariables}
            overrides={scenarioOverrides}
            intelligence={intelligence}
            evidenceLanguage={evidenceTextLanguage}
            evidencePhase={evidencePhase}
            onScenarioChange={setScenarioOverrides}
            onEvent={(event, metadata) => {
              if (!simOpened.current) {
                simOpened.current = true;
                track("simulator_opened", {}, metadata);
              }
              track(event, {}, metadata);
            }}
          />
        </>
      )}
      {phase === "dashboard" && !demoMode && (
        // Launch-test feedback: opens the tester's own email to the product inbox.
        // Nothing is stored or sent by the app; only the record ID is pre-filled.
        <section className="v2-feedback" aria-label={language === "ko" ? "테스트 의견 보내기" : "Send test feedback"}>
          <div>
            <strong>{language === "ko" ? "써 보신 의견을 들려주세요" : "Tell us how it worked for you"}</strong>
            <p>{language === "ko"
              ? "도움이 된 부분, 이해하기 어려웠던 부분, 빠졌다고 느낀 근거를 알려 주세요. 메일 앱이 열리며, 보내기 전까지 아무것도 전송되지 않습니다."
              : "What helped, what was hard to follow, and which evidence felt missing. Your email app opens; nothing is sent until you send it."}</p>
          </div>
          <a className="v2-primary v2-feedback-link" href={v2FeedbackMailto(language, activeAmcSubmissionId("interactive-v2"))}>
            {language === "ko" ? "의견 보내기 ↗" : "Send feedback ↗"}
          </a>
        </section>
      )}
      {phase !== "report" && (
        <footer className="v2-site-footer">
          <div>
            <strong>allofmycareer</strong>
            <span>{language === "ko" ? "구조부터 보는 커리어 결정 분석" : "Structure First career decision research"}</span>
          </div>
          <p>
            {language === "ko"
              ? "allofmycareer는 결정을 대신하거나 특정 진로를 권하지 않습니다. 결과는 입력한 조건과 확인된 공개 자료에 따른 구조적 해석이며, 법률·세무·의료·이민·재무 자문이 아닙니다."
              : "allofmycareer does not decide for you or recommend a path. Results are a structural reading of your inputs and verified public evidence, not legal, tax, medical, immigration or financial advice."}
          </p>
        </footer>
      )}
      {phase === "report" && (
        <V2Report
          state={state}
          selfChecks={selfChecks}
          comparisons={evidenceComparisons}
          input={input}
          core={core}
          sensitivity={sensitivity}
          visibleVariables={visibleVariables}
          scenarioOverrides={scenarioOverrides}
          intelligence={intelligence}
          evidenceLanguage={evidenceTextLanguage}
          evidencePhase={evidencePhase}
          onClose={() => {
            restorePrintTitle.current?.();
            restorePrintTitle.current = null;
            setPhase("dashboard");
            window.scrollTo(0, 0);
          }}
          printBlocked={evidenceCollecting}
          onPrint={() => {
            if (evidenceCollecting) return;
            track("print_save_clicked", {
              currentStage: "print_save_clicked",
              printSaveClickedAt: new Date().toISOString(),
            });
            restorePrintTitle.current?.();
            restorePrintTitle.current = prepareV2PrintTitle(
              v2ReportFileName(state.decision, state.caseType, language)
            );
            try {
              window.print();
            } catch (error) {
              restorePrintTitle.current?.();
              restorePrintTitle.current = null;
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}
