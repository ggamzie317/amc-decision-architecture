import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  createJevSession,
  createServerJevProvider,
  makeJevInput,
  type AdvisoryLevel,
  type JevResult,
} from "../data/amcJevAdvisory";
import type { ProductApplicationBuildInput, ProductApplicationV3 } from "../data/amcProductApplicationV3";
import type { ScenarioOverrides } from "../data/amcScenario";
import type { V2Language } from "../data/v2Language";

// One session per page: cached per scenario, no retries, no background calls.
const session = createJevSession(createServerJevProvider("interactive-v2"));

const levelLabel: Record<AdvisoryLevel, [string, string]> = {
  low: ["Low", "낮음"],
  medium: ["Medium", "보통"],
  high: ["High", "높음"],
};

/**
 * JEV advisory beside the simulator: a qualitative second reading of a
 * scenario's Safety Margin and switching sensitivity. It never changes the
 * AMC result and is hidden when the service is unavailable or turned off.
 */
export default function V2JevAdvisory({
  language,
  input,
  scenarioInput,
  baseline,
  scenario,
  overrides,
}: {
  language: V2Language;
  input: ProductApplicationBuildInput;
  scenarioInput: ProductApplicationBuildInput;
  baseline: ProductApplicationV3;
  scenario: ProductApplicationV3;
  overrides: ScenarioOverrides;
}) {
  const ko = language === "ko";
  const say = (k: string, e: string) => (ko ? k : e);
  const jevInput = useMemo(
    () => makeJevInput(input, scenarioInput, baseline, scenario, overrides),
    [input, scenarioInput, baseline, scenario, overrides]
  );
  const changed = jevInput.changedVariables.length > 0;
  const [result, setResult] = useState<JevResult | null>(null);
  useEffect(() => {
    if (!changed) { setResult(null); return; }
    let live = true;
    // Wait until the customer stops adjusting before asking once.
    const timer = window.setTimeout(() => {
      void session.assess(jevInput).then(r => { if (live) setResult(r); });
    }, 700);
    return () => { live = false; window.clearTimeout(timer); };
  }, [changed, jevInput]);
  if (!changed || result?.status !== "available") return null;
  const a = result.advisory;
  const fits = (text: string) => (ko ? /[가-힣]/.test(text) : !/[가-힣]/.test(text));
  const rows: [string, string, AdvisoryLevel][] = [
    ["Effect on Safety Margin", "안전 여유에 주는 영향", a.safetyMarginContribution],
    ["How easily the reading switches", "판단이 바뀌기 쉬운 정도", a.scenarioSensitivity],
    ["How workable the path adjustment is", "경로 조정의 현실성", a.changingFeasibility],
    ["How realistic the scenario is", "이 가정이 현실적인 정도", a.scenarioPlausibility],
    ["Evidence support", "근거의 뒷받침", a.evidenceSupport],
  ];
  return (
    <aside className="v2-jev" aria-label={say("JEV 보조 판단", "JEV advisory")} data-testid="v2-jev-advisory">
      <p className="v2-jev-head"><Sparkles aria-hidden size={15} />{say("JEV 보조 판단 · 참고용", "JEV advisory · for reference")}</p>
      <ul>
        {rows.map(([en, k, value]) => (
          <li key={en} data-level={value}>
            <span>{ko ? k : en}</span>
            <i className="v2-jev-meter" aria-hidden>
              {(["low", "medium", "high"] as const).map(step => (
                <em key={step} data-on={["low", "medium", "high"].indexOf(step) <= ["low", "medium", "high"].indexOf(value)} />
              ))}
            </i>
            <b>{levelLabel[value][ko ? 1 : 0]}</b>
          </li>
        ))}
      </ul>
      {/* Free text is shown only when it is in the interface language. */}
      {fits(a.conditionalReading) && <p>{a.conditionalReading}</p>}
      {a.uncertainties.filter(fits).length > 0 && <small>{say("아직 불확실한 점: ", "Still uncertain: ")}{a.uncertainties.filter(fits).join(" · ")}</small>}
      <small className="v2-jev-note">
        {say("JEV는 바꾼 조건을 말로 풀어 본 참고 의견입니다. allofmycareer의 판단과 점수는 바뀌지 않습니다.",
          "JEV gives a descriptive second opinion on the changed conditions, for reference only. It does not change the allofmycareer reading or scores.")}
      </small>
    </aside>
  );
}
