import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildProductApplicationV3 } from "../data/amcProductApplicationV3";
import { baselineBands, type ScenarioOverrides } from "../data/amcScenario";
import { selectV2SimulatorVariables } from "../data/amcV2SensitivityView";
import {
  caseTypes,
  projectInteractiveMetadata,
  projectInteractivePatch,
  v2Identity,
} from "../../../shared/interactivePrivacy";
import { trackV2Journey, type JourneyEventType, type JourneyTrackingObservation } from "../data/amcFounderOps";
import {
  initialV2State,
  suggestV2CaseType,
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
import "../styles/v2.css";

type Phase = "setup" | "modules" | "dashboard" | "report";
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
  const [casePinned, setCasePinned] = useState(false);
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
  const languagePinned = useRef(params.has("lang"));
  const simOpened = useRef(false);
  const restorePrintTitle = useRef<(() => void) | null>(null);
  const [trackingObservation, setTrackingObservation] = useState<JourneyTrackingObservation | null>(null);
  const t = (key: V2CopyKey) => v2t(language, key);
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
  }, [state.caseType]);
  useEffect(() => {
    if (phase !== "report") {
      restorePrintTitle.current?.();
      restorePrintTitle.current = null;
    }
  }, [phase]);
  useEffect(() => () => restorePrintTitle.current?.(), []);
  const intelligence = useMemo(
    () =>
      demoMode
        ? v2DemoFixture(kind, language).intelligence
        : (evidenceByLanguage[researchLanguage] ??
          unavailableIntelligence(state.caseType, language)),
    [demoMode, kind, language, researchLanguage, state.caseType, evidenceByLanguage]
  );
  const evidencePhase = demoMode
    ? "demo"
    : evidenceLoadingLanguage !== null
      ? "loading"
      : (evidenceByLanguage[researchLanguage]?.status ?? "not_checked");
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
      ? { notChecked: "아직 확인하지 않음", unsure: "잘 모르겠음", checked: "직접 확인한 내용 있음" }
      : { notChecked: "Not checked yet", unsure: "Not sure", checked: "I checked something" };
    return (
      <section className={`v2-self-card${incomplete ? " v2-band-error" : ""}`} key={id} aria-label={card.title}>
        <div className="v2-self-card-head"><span>{selfCards.indexOf(card) + 1} / {selfCards.length}</span><h3>{card.title}</h3></div>
        <p>{card.question}</p>
        <p className="v2-self-example">{card.example}</p>
        {controls}
        <fieldset className="v2-field">
          <legend>{language === "ko" ? "확인 근거의 현재 상태" : "Current basis for your answer"}</legend>
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
            {language === "ko" ? "직접 확인한 내용을 간단히 적어 주세요 (자기보고)" : "Briefly note what you checked (self-reported)"}
            <textarea maxLength={180} value={answer.detail} onChange={event =>
              setSelfChecks(previous => ({...previous, [id]: {...previous[id], detail: event.target.value}}))
            } />
          </label>
        )}
        {incomplete && <p className="v2-band-error-text">{language === "ko" ? "현재 상태와 각 조건을 선택해 주세요. 확인한 내용이 있다면 간단히 적어 주세요." : "Select a basis and each condition. If checked, briefly describe what you checked."}</p>}
        <small>{language === "ko" ? "이 답변은 자기보고이며 외부 검증 완료를 뜻하지 않습니다." : "This is self-reported and does not mean external verification is complete."}</small>
      </section>
    );
  };
  const moduleBody = () => {
    switch (step) {
      case 0:
        return (
          <>
            {chipGroup("whyNow", "whyNow", v2Choices.whyNow, 2)}
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
                <strong>{state.optionA}</strong>
              </div>
              <div>
                <span>{t("optionB")}</span>
                <strong>{state.optionB}</strong>
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
                  ? "공개 검색 대상: 고객군과 제안할 제품·서비스"
                  : state.caseType === "Industry Transition"
                    ? "공개 검색 대상: 전환할 산업과 직무"
                    : "공개 검색 대상: 직무·기관·과정 등 구체적인 목표"
                : state.caseType === "Entrepreneurship"
                  ? "Public search target: customer group and offer"
                  : state.caseType === "Industry Transition"
                    ? "Public search target: target industry and role"
                    : "Public search target: specific role, institution or program"}
              <input
                value={v2PublicSearchTarget(state)}
                maxLength={120}
                placeholder={language === "ko"
                  ? state.caseType === "Entrepreneurship" ? "예: 서울 소형 식당을 위한 재고관리 서비스" : state.caseType === "Industry Transition" ? "예: 반도체 제조업의 공정 엔지니어" : "구체적인 공개 검색 대상을 입력하세요"
                  : state.caseType === "Entrepreneurship" ? "e.g. inventory service for small restaurants" : state.caseType === "Industry Transition" ? "e.g. semiconductor process engineer" : "Enter a specific public research target"}
                onChange={e => update({ publicSearchTarget: e.target.value })}
              />
            </label>
            <label className="v2-optional">
              {t("targetGeography")}
              <input
                value={state.targetGeography}
                maxLength={80}
                onChange={e => update({ targetGeography: e.target.value })}
              />
            </label>
            <p className="v2-guidance">
              {language === "ko"
                ? "외부 근거를 검색하려면 구체적인 공개 검색 대상과 지역을 직접 입력하세요. 입력하지 않아도 구조 분석은 진행되지만 검색은 실행되지 않습니다. 선택지의 자유서술·자가진단 메모·재정 정보는 검색에 복사하지 않습니다."
                : "Enter a specific public target and geography to search for external evidence. Structural analysis still works without them, but no search runs. Option prose, self-check notes and financial information are never copied into the search."}
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
              <section className="v2-self-card v2-canonical-fifwm" aria-label={language === "ko" ? "목표 조직·직무의 기존 평가" : "Existing target organization and role assessment"}>
                <div className="v2-self-card-head"><h3>{language === "ko" ? "목표 조직·직무의 기존 평가" : "Existing target organization and role assessment"}</h3></div>
                <p>{language === "ko"
                  ? "구체적인 목표 회사·사업부와 직무·팀이 있을 때만 답하세요. 창업 계획이나 학위 과정으로 바꿔 평가하지 않습니다. 답하지 못한 항목은 미평가로 남습니다."
                  : "Answer only if you have a specific target company or unit and role or team. Unanswered items remain unassessed."}</p>
                <fieldset className="v2-field">
                  <legend>{language === "ko" ? "구체적인 목표 조직과 직무가 있나요?" : "Do you have a specific target organization and role?"}</legend>
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
                <small>{language === "ko" ? "선택한 내용은 자기보고입니다. 공개 자료로 개인의 조직 경험을 검증한 것은 아닙니다." : "These answers are self-reported. Public sources do not verify your personal experience in the organization."}</small>
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
    const now = new Date().toISOString();
    const structuralOutputJson = {
      ...v2Identity,
      completedIntakeQuestionCount: 8,
      baselineBands: baselineBands(input),
      currentStructuralPosture: { label: core.currentStructuralPosture.label },
      safetyMargin: { band: core.safetyMargin.band },
      changingPlays: core.changingPlays.map(p => ({ family: p.family })),
      decisionSwitchCount: core.decisionSwitches.length,
      externalEvidenceStatus: intelligence.status,
    };
    track("full_intake_completed", {
      currentStage: "full_intake_completed",
      fullIntakeCompletedAt: now,
      structuralOutputJson,
      externalEvidenceMode: "fallback",
    });
    track(
      "dashboard_generated",
      {
        currentStage: "dashboard_generated",
        reportGeneratedAt: now,
        structuralOutputJson,
        externalEvidenceMode: "fallback",
      },
      {
        selectedVariables: selectV2SimulatorVariables(
          buildV2Sensitivity(input, core),
          baselineBands(input)
        ),
      }
    );
    setPhase("dashboard");
    window.scrollTo(0, 0);
    if (withEvidence) void checkCurrentEvidence();
  };
  const switchLanguage = (next: V2Language) => {
    languagePinned.current = true;
    if (next === language) return;
    track("language_changed", {}, { from: language, to: next }, false, next);
    restorePrintTitle.current?.();
    restorePrintTitle.current = null;
    setLanguage(next);
  };
  const checkCurrentEvidence = async () => {
    if (
      demoMode ||
      evidencePending.current ||
      evidenceByLanguage[language]?.status === "live"
    )
      return;
    const request = buildV2EvidenceRequest({ ...state, language });
    if (!request) {
      setStep(2);
      setPhase("modules");
      window.scrollTo(0, 0);
      return;
    }
    evidencePending.current = true;
    setResearchLanguage(request.language);
    setEvidenceLoadingLanguage(language);
    track(
      "external_evidence_requested",
      {},
      { externalEvidenceMode: "checking" }
    );
    const result = await requestV2Evidence(request, fetch, observation => {
      setEvidenceHttpByLanguage(previous => ({
        ...previous,
        [request.language]: observation,
      }));
    });
    setEvidenceByLanguage(previous => ({
      ...previous,
      [request.language]: result,
    }));
    const updatedInput = buildV2Input({ ...state, language: request.language }, result, fifwmAssessment);
    const updatedCore = buildProductApplicationV3(updatedInput);
    track(
      result.status === "live"
        ? "external_evidence_live"
        : "external_evidence_fallback",
      {
        externalEvidenceMode: result.status === "live" ? "live" : "fallback",
        structuralOutputJson: {
          ...v2Identity,
          completedIntakeQuestionCount: 8,
          baselineBands: baselineBands(updatedInput),
          currentStructuralPosture: { label: updatedCore.currentStructuralPosture.label },
          safetyMargin: { band: updatedCore.safetyMargin.band },
          changingPlays: updatedCore.changingPlays.map(play => ({ family: play.family })),
          decisionSwitchCount: updatedCore.decisionSwitches.length,
          externalEvidenceStatus: result.status,
        },
      },
      { externalEvidenceMode: result.status === "live" ? "live" : "unverified" }
    );
    evidencePending.current = false;
    setEvidenceLoadingLanguage(null);
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
        <a className="v2-wordmark" href="/amc-interactive-v2">
          allofmycareer
        </a>
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
            <div className="v2-intake-line">
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04–08</span>
            </div>
          </div>
          <section className="v2-intake-panel">
            <p className="v2-kicker">{t("decisionSetup")}</p>
            <h2>{t("decisionSetup")}</h2>
            <p>{t("inputHint")}</p>
            <div className="v2-setup-fields">
              <label>
                {t("decision")}
                <input
                  required
                  autoComplete="off"
                  value={state.decision}
                  placeholder={t("decisionPlaceholder")}
                  maxLength={240}
                  onChange={e => {
                    if (
                      !languagePinned.current &&
                      /[가-힣]/.test(e.target.value)
                    )
                      setLanguage("ko");
                    setState(s => {
                      const nextCase = casePinned
                        ? s.caseType
                        : suggestV2CaseType(e.target.value);
                      return {
                        ...s,
                        decision: e.target.value,
                        caseType: nextCase,
                        ...(nextCase === s.caseType ? {} : { publicSearchTarget: undefined }),
                      };
                    });
                  }}
                />
              </label>
              <label>
                {t("optionA")}
                <input
                  required
                  autoComplete="off"
                  value={state.optionA}
                  placeholder={t("optionAPlaceholder")}
                  maxLength={120}
                  onChange={e => update({ optionA: e.target.value })}
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
                  onChange={e => update({ optionB: e.target.value })}
                />
              </label>
            </div>
            <div className="v2-case-confirm">
              <span>
                {t("caseConfirm")}{" "}
                <b>{v2CaseLabel(language, state.caseType)}</b>
              </span>
            </div>
            <label className="v2-case-selector">
              <span>{language === "ko" ? "검토할 결정에 맞는 유형을 선택하세요" : "Choose the type that matches your decision"}</span>
              <select
                aria-label={t("caseConfirm")}
                value={state.caseType}
                onChange={e => {
                  update({ caseType: e.target.value as V2CaseType, publicSearchTarget: undefined });
                  setCasePinned(true);
                }}
              >
                {caseTypes.map(c => (
                  <option key={c} value={c}>
                    {v2CaseLabel(language, c)}
                  </option>
                ))}
              </select>
            </label>
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
                !state.decision.trim() ||
                !state.optionA.trim() ||
                !state.optionB.trim() ||
                !state.serviceConsent
              }
              onClick={() => {
                setCasePinned(true);
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
              {language === "ko" ? `${selfCards.length}개 중 ${completedSelfChecks}개 응답` : `${completedSelfChecks} of ${selfCards.length} check cards answered`}
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
                    ? language === "ko" ? "점검 카드 응답 필요" : "Check card needs an answer"
                    : v2RequiredBandsByStep[step] ? t("complete") : t("optional")}
              </span>
            </div>
            <h2>{t(v2ModuleKeys[step])}</h2>
            <div className="v2-module-fields">{moduleBody()}</div>
            {step === 7 && (
              <div className="v2-search-review">
                <strong>
                  {language === "ko"
                    ? "최종 분석에 사용할 공개 검색"
                    : "Public research for the final analysis"}
                </strong>
                <p>
                  {v2PublicSearchTarget(state) || (language === "ko" ? "공개 검색 대상 미입력" : "Public target not entered")}
                  {state.targetGeography && ` / ${state.targetGeography}`}
                </p>
                <p>
                  {state.externalAreas.length
                    ? state.externalAreas.map(t).join(" · ")
                    : language === "ko"
                      ? "이 사례에 필요한 기본 공개 요건"
                      : "Default public requirements for this case"}
                </p>
                <small>
                  {buildV2EvidenceRequest(state)
                    ? language === "ko"
                      ? "이 버튼을 누르면 위에 입력한 대상과 지역의 공개 근거를 검색합니다."
                      : "This action searches public evidence for the target and geography entered above."
                    : language === "ko"
                      ? "공개 근거를 검색하려면 3단계에서 검색 대상과 지역을 입력하세요. 구조 초안은 바로 볼 수 있습니다."
                      : "Enter a public target and geography in step 3 to search. You can review the structural draft now."}
                </small>
                <button
                  type="button"
                  className="v2-link-button"
                  onClick={() => finish(false)}
                >
                  {language === "ko"
                    ? "외부 검색 없이 구조 초안 먼저 보기"
                    : "Review a structural draft without public research"}
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
                    ? "공개 근거와 함께 분석"
                    : "Analyze with public evidence"
                  : t("next")}{" "}
                ↗
              </button>
            </div>
          </section>
        </main>
      )}
      {phase === "dashboard" && (
        <>
          <V2Dashboard
            state={state}
            selfChecks={selfChecks}
            comparisons={evidenceComparisons}
            onComparisonChange={(key, answer) => setEvidenceComparisons(current => ({ ...current, [key]: answer }))}
            core={core}
            intelligence={intelligence}
            evidenceLanguage={demoMode ? language : researchLanguage}
            evidencePhase={evidencePhase}
            onCheckEvidence={checkCurrentEvidence}
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
            evidenceLanguage={demoMode ? language : researchLanguage}
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
          evidenceLanguage={demoMode ? language : researchLanguage}
          evidencePhase={evidencePhase}
          onClose={() => {
            restorePrintTitle.current?.();
            restorePrintTitle.current = null;
            setPhase("dashboard");
            window.scrollTo(0, 0);
          }}
          onPrint={() => {
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
