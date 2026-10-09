import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ProductApplicationBuildInput,
  ProductApplicationV3,
} from "../data/amcProductApplicationV3";
import {
  applyScenarioOverrides,
  baselineBands,
  evaluateScenario,
  scenarioImpact,
  scenarioVariables,
  updateScenario,
  type ScenarioOverrides,
  type ScenarioVariable,
} from "../data/amcScenario";
import {
  createJevSession,
  makeJevInput,
  type JevResult,
} from "../data/amcJevAdvisory";
import type { TrackJourneyInput } from "../data/amcFounderOps";
const labels: Record<ScenarioVariable, [string, string]> = {
  financialRoom: ["Financial Room", "재정·소득 여유"],
  reversibility: ["Reversibility", "회복·재진입 가능성"],
  downsideExposure: ["Downside Exposure", "하방 노출"],
  internalReadiness: ["Internal Readiness", "실행 준비도"],
  optionBSupport: ["Option B Support", "Option B 지원"],
  constraintLoad: ["Constraint Load", "제약 부담"],
  externalValidation: ["External Validation", "외부 검증"],
};
const bands: Record<string, [string, string]> = {
  strong: ["Strong", "충분함"],
  developing: ["Developing", "형성 중"],
  weak: ["Constrained", "제약됨"],
  unknown: ["Not Yet Established", "아직 확인되지 않음"],
  low: ["Contained", "통제됨"],
  moderate: ["Moderate", "보통"],
  high: ["Elevated", "높음"],
  light: ["Light", "낮음"],
  material: ["Material", "유의미함"],
  heavy: ["Heavy", "높음"],
};
const impactLabels = {
  posture: ["Current Structural Posture", "현재 구조적 자세"],
  safety: ["Safety Margin", "Safety Margin"],
  changing: ["Changing Plays", "Changing 실행안"],
  missing: ["What You May Be Missing", "놓치고 있을 수 있는 점"],
  switches: ["Decision Switches", "결정 전환 조건"],
  tradeoff: ["Core Trade-off", "핵심 상충관계"],
  test: ["Next Test", "다음 실험"],
};
export default function InteractiveSimulator({
  input,
  baseline,
  track,
  consent,
}: {
  input: ProductApplicationBuildInput;
  baseline: ProductApplicationV3;
  track: (event: TrackJourneyInput) => Promise<unknown>;
  consent: boolean;
}) {
  const ko = input.language === "ko",
    t = (en: string, kr: string) => (ko ? kr : en);
  const [overrides, setOverrides] = useState<ScenarioOverrides>({});
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [advisory, setAdvisory] = useState<JevResult | null>(null);
  const [assessing, setAssessing] = useState(false);
  const session = useRef(createJevSession());
  const generation = useRef(0),
    opened = useRef(false);
  const emit = (
    eventType: TrackJourneyInput["eventType"],
    metadata: Record<string, unknown> = {}
  ) => {
    void track({
      eventType,
      metadata,
      language: input.language,
      serviceStorageConsent: consent,
    });
  };
  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      emit("simulator_opened");
    }
  }, []);
  const scenario = useMemo(
    () => evaluateScenario(input, overrides),
    [input, overrides]
  );
  const currentBands = baselineBands(input),
    scenarioBands = baselineBands(applyScenarioOverrides(input, overrides));
  const impact = scenarioImpact(baseline, scenario);
  const invalidate = () => {
    generation.current++;
    setAdvisory(null);
    setAssessing(false);
  };
  const evaluate = (next: ScenarioOverrides, nextMode = mode) => {
    invalidate();
    setOverrides(next);
    const result = evaluateScenario(input, next);
    emit("scenario_evaluated", {
      mode: nextMode,
      postureChanged:
        baseline.currentStructuralPosture.label !==
        result.currentStructuralPosture.label,
      safetyChanged: baseline.safetyMargin.band !== result.safetyMargin.band,
      changingChanged:
        JSON.stringify(baseline.changingPlays.map(p => p.family)) !==
        JSON.stringify(result.changingPlays.map(p => p.family)),
    });
  };
  const change = (key: ScenarioVariable, value: string) => {
    emit("scenario_variable_changed", {
      variable: key,
      baselineBand: currentBands[key],
      newBand: value,
      mode,
    });
    evaluate(updateScenario(input, overrides, key, value, mode));
  };
  const reset = () => {
    invalidate();
    setOverrides({});
    emit("scenario_reset", { mode });
  };
  const assess = async () => {
    if (assessing) return;
    const request = ++generation.current;
    setAssessing(true);
    emit("jev_assessment_requested");
    const result = await session.current.assess(
      makeJevInput(
        input,
        applyScenarioOverrides(input, overrides),
        baseline,
        scenario,
        overrides
      )
    );
    if (request !== generation.current) return;
    setAdvisory(result);
    setAssessing(false);
    emit(
      result.status === "available"
        ? "jev_assessment_completed"
        : "jev_assessment_unavailable",
      result.status === "available"
        ? {
            scenarioPlausibility: result.advisory.scenarioPlausibility,
            evidenceSupport: result.advisory.evidenceSupport,
            scenarioSensitivity: result.advisory.scenarioSensitivity,
          }
        : {}
    );
  };
  const button =
    "min-h-11 rounded-md border border-border px-3 py-2 text-sm whitespace-normal";
  const panel = (p: ProductApplicationV3, title: string) => (
    <article className="min-w-0 rounded-lg border border-border bg-card p-5">
      <h3 className="text-xs tracking-wide font-semibold">{title}</h3>
      <p className="mt-4 font-semibold">{p.currentStructuralPosture.label}</p>
      <p className="mt-2 text-sm">
        Safety Margin · {p.presentation.safetyMarginKeyword}
      </p>
      <p className="mt-2 text-sm">
        {t("Changing Plays", "Changing 실행안")} · {p.changingPlays.length}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {p.currentStructuralPosture.sentence}
      </p>
    </article>
  );
  return (
    <section
      aria-label={t("Interactive decision simulator", "결정 시뮬레이터")}
      className="my-10 space-y-6 border-t border-border pt-8 [overflow-wrap:anywhere]"
    >
      <header>
        <h2 className="text-xl font-semibold">
          {t("TEST WHAT COULD CHANGE", "무엇이 달라질 수 있는지 시험해 보세요")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "Adjust one assumption and see how your decision structure responds.",
            "한 가지 조건을 바꿔 결정 구조가 어떻게 달라지는지 확인해 보세요."
          )}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t(
            "A temporary hypothetical scenario. This is not a prediction. Your current case and report stay separate.",
            "임시 가정 시나리오이며 예측이 아닙니다. 현재 사례와 리포트는 별도로 유지됩니다."
          )}
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {panel(baseline, t("YOUR CURRENT STRUCTURE", "현재 결정 구조"))}
        {panel(scenario, t("TEST A SCENARIO", "시나리오 시험"))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["single", "multi"] as const).map(m => (
          <button
            key={m}
            type="button"
            className={`${button} ${mode === m ? "bg-foreground text-background" : "bg-background"}`}
            aria-pressed={mode === m}
            onClick={() => {
              if (m === mode) return;
              setMode(m);
              evaluate({}, m);
            }}
          >
            {m === "single"
              ? t("TEST ONE CHANGE", "한 가지 조건 시험")
              : t("BUILD A SCENARIO", "여러 조건 조합")}
          </button>
        ))}
        <button type="button" className={button} onClick={reset}>
          {t("RESET TO BASELINE", "기본 상태로 초기화")}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {scenarioVariables.map(key => (
          <fieldset
            key={key}
            className="min-w-0 rounded-md border border-border p-4"
          >
            <legend className="px-1 text-sm font-medium">
              {labels[key][ko ? 1 : 0]}
              {key === "externalValidation"
                ? ` · ${t("Advanced", "고급")}`
                : ""}
            </legend>
            {key === "externalValidation" && (
              <p className="mb-3 text-xs text-muted-foreground">
                {t(
                  "Hypothetical external assumption. Live evidence is unchanged.",
                  "외부 근거에 대한 가정입니다. 실제 외부 근거는 변경되지 않습니다."
                )}
              </p>
            )}
            <p className="mb-2 text-xs">
              {t("Current", "현재")}:{" "}
              {key === "externalValidation" && currentBands[key] === "weak"
                ? t("Weak", "약함")
                : bands[currentBands[key]][ko ? 1 : 0]}
            </p>
            <div className="flex flex-wrap gap-2">
              {(key === "downsideExposure"
                ? ["low", "moderate", "high"]
                : key === "constraintLoad"
                  ? ["light", "material", "heavy"]
                  : ["weak", "developing", "strong"]
              ).map(value => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scenarioBands[key] === value}
                  onClick={() => change(key, value)}
                  className={`${button} ${scenarioBands[key] === value ? "bg-foreground text-background" : "bg-background"}`}
                >
                  {key === "externalValidation" && value === "weak"
                    ? t("Weak", "약함")
                    : bands[value][ko ? 1 : 0]}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <section aria-live="polite" className="space-y-4">
        <h3 className="font-semibold">
          {t("SCENARIO IMPACT", "시나리오 영향")}
        </h3>
        {[true, false].map(changed => (
          <div key={String(changed)}>
            <h4 className="text-xs font-semibold">
              {changed
                ? t("WHAT CHANGED", "달라진 점")
                : t("WHAT DIDN’T CHANGE", "유지된 점")}
            </h4>
            <ul className="mt-2 space-y-3 text-sm">
              {impact
                .filter(row => row.changed === changed)
                .map(row => (
                  <li key={row.key}>
                    <strong>{impactLabels[row.key][ko ? 1 : 0]}</strong>
                    {row.key === "switches" ? (
                      <details className="mt-1 text-muted-foreground">
                        <summary className="cursor-pointer py-2">
                          {row.changed
                            ? t("View changed conditions", "변경된 조건 보기")
                            : t(
                                "View unchanged conditions",
                                "유지된 조건 보기"
                              )}
                        </summary>
                        <p>
                          {row.changed
                            ? `${row.before} → ${row.after}`
                            : row.before}
                        </p>
                      </details>
                    ) : (
                      <p className="text-muted-foreground">
                        {row.changed
                          ? `${row.before} → ${row.after}`
                          : row.before}
                      </p>
                    )}
                  </li>
                ))}
              {!impact.some(row => row.changed === changed) && (
                <li>{t("None", "없음")}</li>
              )}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="text-xs font-semibold">{t("WHY", "이유")}</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            {Object.keys(overrides).length
              ? `${Object.keys(overrides)
                  .map(k => {
                    const key = k as ScenarioVariable;
                    return `${labels[key][ko ? 1 : 0]}: ${bands[currentBands[key]][ko ? 1 : 0]} → ${bands[scenarioBands[key]][ko ? 1 : 0]}`;
                  })
                  .join(
                    " · "
                  )}. ${t("Only these assumptions changed. The same decision rules, protection checks and frozen evidence were applied; unchanged outputs have not crossed a decision boundary.", "위 가정만 변경했습니다. 같은 결정 규칙과 보호 조건, 고정된 근거를 적용했으며 유지된 결과는 결정 기준의 경계를 넘지 않았습니다.")}`
              : t(
                  "No assumptions changed. This is exactly your current structure.",
                  "변경된 가정이 없어 현재 구조와 정확히 같습니다."
                )}
          </p>
          {Object.keys(overrides).length > 0 && (
            <p className="mt-2 text-sm">
              {scenario.why.topDrivers.join(" · ")} ·{" "}
              {scenario.safetyMargin.reading}
            </p>
          )}
        </div>
      </section>
      <section className="rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold">
          {t("SCENARIO PLAUSIBILITY LENS", "시나리오 타당성 검토")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("Auxiliary assessment", "보조 평가")}
        </p>
        <p className="mt-3 text-sm">
          {t(
            "This auxiliary lens does not change the allofmycareer structural analysis.",
            "이 보조 검토는 allofmycareer의 구조 분석을 변경하지 않습니다."
          )}
        </p>
        <button
          type="button"
          className={`${button} mt-4`}
          disabled={assessing}
          onClick={assess}
        >
          {t("ASSESS THIS SCENARIO", "이 시나리오 평가")}
        </button>
        {advisory?.status === "unavailable" && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {t(
              "The auxiliary assessment is currently unavailable. Your scenario analysis remains available.",
              "현재 보조 평가를 사용할 수 없습니다. 시나리오 분석은 계속 사용할 수 있습니다."
            )}
          </p>
        )}
        {advisory?.status === "available" && (
          <div className="mt-4 space-y-2">
            {(
              [
                [
                  "Plausibility",
                  "타당성",
                  advisory.advisory.scenarioPlausibility,
                ],
                [
                  "Evidence Support",
                  "근거 수준",
                  advisory.advisory.evidenceSupport,
                ],
                [
                  "Sensitivity",
                  "민감도",
                  advisory.advisory.scenarioSensitivity,
                ],
              ] as const
            ).map(([en, kr, value]) => (
              <p key={en}>
                {t(en, kr)} ·{" "}
                {value === "low"
                  ? t("Low", "낮음")
                  : value === "medium"
                    ? t("Medium", "보통")
                    : t("High", "높음")}
              </p>
            ))}
            <h4>{t("Conditional Reading", "조건부 해석")}</h4>
            <p>{advisory.advisory.conditionalReading}</p>
          </div>
        )}
      </section>
    </section>
  );
}
