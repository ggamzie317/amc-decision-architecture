import { useEffect, useMemo, useRef, useState } from "react";
import { buildProductApplicationV3 } from "../data/amcProductApplicationV3";
import { baselineBands, type ScenarioOverrides } from "../data/amcScenario";
import { selectV2SimulatorVariables } from "../data/amcV2SensitivityView";
import {
  caseTypes,
  projectInteractiveMetadata,
  projectInteractivePatch,
  v2Identity,
} from "../../../shared/interactivePrivacy";
import { trackV2Journey, type JourneyEventType } from "../data/amcFounderOps";
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
import {
  v2t,
  v2CaseLabel,
  type V2CopyKey,
  type V2Language,
} from "../data/v2Language";
import V2Dashboard from "../components/V2Dashboard";
import V2Simulator from "../components/V2Simulator";
import V2Report from "../components/V2Report";
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
  const initialLanguage: V2Language = params.get("lang") === "ko" ? "ko" : "en";
  const [language, setLanguage] = useState<V2Language>(initialLanguage);
  const [kind, setKind] = useState<V2DemoKind>(initialKind);
  const [state, setState] = useState<V2State>(() =>
    demoMode
      ? v2DemoFixture(initialKind, initialLanguage).state
      : initialV2State(initialLanguage)
  );
  const [phase, setPhase] = useState<Phase>(demoMode ? "dashboard" : "setup");
  const [step, setStep] = useState(0);
  const [casePinned, setCasePinned] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showBandError, setShowBandError] = useState(false);
  const [scenarioOverrides, setScenarioOverrides] = useState<ScenarioOverrides>(
    {}
  );
  const [evidenceByLanguage, setEvidenceByLanguage] = useState<
    Record<V2Language, ExternalIntelligenceV2 | null>
  >({ en: null, ko: null });
  const [evidenceLoadingLanguage, setEvidenceLoadingLanguage] =
    useState<V2Language | null>(null);
  const evidencePending = useRef(false);
  const simOpened = useRef(false);
  const t = (key: V2CopyKey) => v2t(language, key);
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
    newSubmission = false
  ) => {
    if (demoMode || !state.serviceConsent) return;
    void trackV2Journey({
      eventType,
      language,
      serviceStorageConsent: true,
      newSubmission,
      metadata: projectInteractiveMetadata({ ...v2Identity, ...metadata }),
      patch: projectInteractivePatch({
        ...patch,
        language,
        caseType: state.caseType,
        serviceStorageConsent: true,
        researchUseConsent: state.researchConsent,
        structuralOutputJson: {
          ...v2Identity,
          ...((patch.structuralOutputJson as object) || {}),
        },
      }),
    });
  };
  useEffect(() => {
    if (demoMode) {
      const fixture = v2DemoFixture(kind, language);
      setState(fixture.state);
      setPhase("dashboard");
      simOpened.current = false;
      setScenarioOverrides({});
    } else setState(s => ({ ...s, language }));
  }, [language, kind, demoMode]);
  const intelligence = useMemo(
    () =>
      demoMode
        ? v2DemoFixture(kind, language).intelligence
        : (evidenceByLanguage[language] ??
          unavailableIntelligence(state.caseType, language)),
    [demoMode, kind, language, state.caseType, evidenceByLanguage]
  );
  const evidencePhase = demoMode
    ? "demo"
    : evidenceLoadingLanguage === language
      ? "loading"
      : (evidenceByLanguage[language]?.status ?? "not_checked");
  const input = useMemo(() => buildV2Input(state), [state]);
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
            {chipGroup(
              "validateArea",
              "externalAreas",
              v2ExternalOptions(state.caseType)
            )}
            <label className="v2-optional">
              {t("targetGeography")}
              <input
                value={state.targetGeography}
                maxLength={80}
                onChange={e => update({ targetGeography: e.target.value })}
              />
            </label>
            <p className="v2-guidance">{t("evidenceOptionalLater")}</p>
          </>
        );
      case 3:
        return (
          <>
            {bandGroup("readinessBand", "internalReadiness", bandStrength)}
            {chipGroup(
              "missingAssets",
              "missingAssets",
              v2Choices.missingAssets
            )}
          </>
        );
      case 4:
        return (
          <>
            {bandGroup("financial", "financialRoom", bandStrength)}
            {bandGroup("reversibility", "reversibility", bandStrength)}
            {bandGroup("downside", "downsideExposure", bandRisk)}
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
          </>
        );
      case 5:
        return (
          <>
            {bandGroup("supportBand", "optionBSupport", bandStrength)}
            {chipGroup(
              "supportSource",
              "supportSources",
              v2Choices.supportSources
            )}
          </>
        );
      case 6:
        return (
          <>
            {bandGroup("constraint", "constraintLoad", bandLoad)}
            {chipGroup(
              "constraintSources",
              "constraints",
              v2Choices.constraints
            )}
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
  const finish = () => {
    if (!v2AllBandsAnswered(state)) {
      const firstIncomplete = [3, 4, 5, 6].find(
        i => v2UnansweredBands(state, i).length
      );
      setStep(firstIncomplete ?? 3);
      setShowBandError(true);
      return;
    }
    const now = new Date().toISOString();
    const structuralOutputJson = {
      ...v2Identity,
      completedIntakeQuestionCount: 8,
      baselineBands: { ...state.bands, externalValidation: "unknown" },
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
  };
  const switchLanguage = (next: V2Language) => {
    if (next === language) return;
    track("language_changed", {}, { from: language, to: next });
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
      setEvidenceByLanguage(previous => ({
        ...previous,
        [language]: unavailableIntelligence(state.caseType, language),
      }));
      return;
    }
    evidencePending.current = true;
    setEvidenceLoadingLanguage(language);
    track(
      "external_evidence_requested",
      {},
      { externalEvidenceMode: "checking" }
    );
    const result = await requestV2Evidence(request);
    setEvidenceByLanguage(previous => ({
      ...previous,
      [request.language]: result,
    }));
    track(
      result.status === "live"
        ? "external_evidence_live"
        : "external_evidence_fallback",
      { externalEvidenceMode: result.status === "live" ? "live" : "fallback" },
      { externalEvidenceMode: result.status === "live" ? "live" : "unverified" }
    );
    evidencePending.current = false;
    setEvidenceLoadingLanguage(null);
  };
  const switchDemo = (next: V2DemoKind) => {
    if (next === kind) return;
    setScenarioOverrides({});
    setKind(next);
  };
  return (
    <div className="v2-app" lang={language} data-testid="v2-app">
      <header className="v2-site-header">
        <a className="v2-wordmark" href="/amc-interactive-v2">
          allofmycareer<span> / V2</span>
        </a>
        <div className="v2-header-right">
          {demoMode && <span className="v2-demo-label">{t("demoBadge")}</span>}
          <div className="v2-language">
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
                  onChange={e =>
                    setState(s => ({
                      ...s,
                      decision: e.target.value,
                      caseType: casePinned
                        ? s.caseType
                        : suggestV2CaseType(e.target.value),
                    }))
                  }
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
              <button type="button" onClick={() => setCaseOpen(!caseOpen)}>
                {t("change")}
              </button>
            </div>
            {caseOpen && (
              <select
                aria-label={t("caseConfirm")}
                value={state.caseType}
                onChange={e => {
                  update({ caseType: e.target.value as V2CaseType });
                  setCasePinned(true);
                  setCaseOpen(false);
                }}
              >
                {caseTypes.map(c => (
                  <option key={c} value={c}>
                    {v2CaseLabel(language, c)}
                  </option>
                ))}
              </select>
            )}
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
                {v2RequiredBandsByStep[step]
                  ? v2UnansweredBands(state, step).length === 0
                    ? t("complete")
                    : v2UnansweredBands(state, step).length === 1
                      ? t("oneSelectionNeeded")
                      : `${v2UnansweredBands(state, step).length}${language === "ko" ? "" : " "}${t("selectionsNeeded")}`
                  : t("optional")}
              </span>
            </div>
            <h2>{t(v2ModuleKeys[step])}</h2>
            <div className="v2-module-fields">{moduleBody()}</div>
            <div className="v2-module-nav">
              <button
                type="button"
                onClick={() => {
                  setShowBandError(false);
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
                onClick={() => {
                  if (v2UnansweredBands(state, step).length) {
                    setShowBandError(true);
                    return;
                  }
                  setShowBandError(false);
                  if (step === 7) finish();
                  else {
                    setStep(step + 1);
                    window.scrollTo(0, 0);
                  }
                }}
              >
                {step === 7 ? t("finish") : t("next")} ↗
              </button>
            </div>
          </section>
        </main>
      )}
      {phase === "dashboard" && (
        <>
          <V2Dashboard
            state={state}
            core={core}
            intelligence={intelligence}
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
            input={input}
            baseline={core}
            sensitivity={sensitivity}
            visibleVariables={visibleVariables}
            overrides={scenarioOverrides}
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
          input={input}
          core={core}
          sensitivity={sensitivity}
          visibleVariables={visibleVariables}
          scenarioOverrides={scenarioOverrides}
          intelligence={intelligence}
          evidencePhase={evidencePhase}
          onClose={() => {
            setPhase("dashboard");
            window.scrollTo(0, 0);
          }}
          onPrint={() => {
            track("print_save_clicked", {
              currentStage: "print_save_clicked",
              printSaveClickedAt: new Date().toISOString(),
            });
            window.print();
          }}
        />
      )}
    </div>
  );
}
