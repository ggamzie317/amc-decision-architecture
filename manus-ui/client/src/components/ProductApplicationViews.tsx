import type { ProductApplicationV3, StructuralRisk, StructuralStrength } from "../data/amcProductApplicationV3";

type Translate = (en: string, ko: string) => string;
type ProductViewProps = {
  intelligence: ProductApplicationV3;
  translate: Translate;
  externalEvidenceUsed: boolean;
};

function strengthLabel(band: StructuralStrength, translate: Translate) {
  if (band === "strong") return translate("Strong", "Strong");
  if (band === "developing") return translate("Developing", "Developing");
  if (band === "weak") return translate("Constrained", "제약됨");
  return translate("Not Yet Established", "아직 확인되지 않음");
}

function downsideLabel(band: StructuralRisk, translate: Translate) {
  if (band === "low") return translate("Contained", "통제됨");
  if (band === "moderate") return translate("Moderate", "보통");
  if (band === "high") return translate("Elevated", "높음");
  return translate("Not Yet Established", "아직 확인되지 않음");
}

function QualitativeIndicator({ label, value, filled }: { label: string; value: string; filled: number }) {
  return (
    <div className="grid gap-2 border-t border-current/15 py-3 sm:grid-cols-[1fr_auto_112px] sm:items-center">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] opacity-65">{value}</p>
      <div className="grid grid-cols-4 gap-1" role="img" aria-label={`${label}: ${value}`}>
        {[0, 1, 2, 3].map(segment => (
          <span key={segment} className={`h-1.5 rounded-full ${segment < filled ? "bg-current opacity-75" : "bg-current opacity-15"}`} />
        ))}
      </div>
    </div>
  );
}

function SafetyIndicators({ intelligence, translate }: Pick<ProductViewProps, "intelligence" | "translate">) {
  const financial = intelligence.safetyMargin.inputs.financialRoom.band;
  const recovery = intelligence.safetyMargin.inputs.reversibility.band;
  const downside = intelligence.safetyMargin.inputs.downsideExposure.band;
  const strengthFill: Record<StructuralStrength, number> = {
    strong: 4,
    developing: 3,
    weak: 1,
    unknown: 0,
  };
  const downsideFill: Record<StructuralRisk, number> = {
    low: 1,
    moderate: 2,
    high: 4,
    unknown: 0,
  };
  return (
    <div>
      <QualitativeIndicator label={translate("Financial Room", "재정 / 소득 여유")} value={strengthLabel(financial, translate)} filled={strengthFill[financial]} />
      <QualitativeIndicator label={translate("Recovery / Re-entry", "회복 / 재진입")} value={strengthLabel(recovery, translate)} filled={strengthFill[recovery]} />
      <QualitativeIndicator label={translate("Downside Exposure", "하방 노출")} value={downsideLabel(downside, translate)} filled={downsideFill[downside]} />
    </div>
  );
}

function ExecutiveDecisionMap({ intelligence, translate }: Pick<ProductViewProps, "intelligence" | "translate">) {
  const items = [
    [translate("Current Posture", "현재 자세"), intelligence.presentation.postureKeyword],
    [translate("What You May Be Missing", "놓치고 있을 수 있는 지점"), intelligence.presentation.missingPointKeyword],
    [translate("Safety Margin", "Safety Margin"), intelligence.presentation.safetyMarginKeyword],
    [translate("Core Trade-off", "핵심 트레이드오프"), intelligence.presentation.coreTradeoffKeyword],
    [translate("Next Test", "다음 검증"), intelligence.presentation.nextTestKeyword],
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-foreground/20 bg-card" data-executive-decision-map>
      <div className="border-b border-foreground/15 px-5 py-4 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{translate("Executive Decision Map", "Executive Decision Map")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(([label, value], index) => (
          <div key={label} className={`min-w-0 p-5 sm:p-6 ${index ? "border-t border-foreground/10 sm:border-l lg:border-t-0" : ""}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
            <p className="mt-3 text-lg font-semibold leading-tight tracking-tight">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductApplicationDashboard({ intelligence, translate, externalEvidenceUsed }: ProductViewProps) {
  const view = intelligence.presentation;
  return (
    <div className="space-y-5" data-product-application="dashboard">
      <ExecutiveDecisionMap intelligence={intelligence} translate={translate} />

      <p className="border-l-2 border-foreground pl-4 text-sm font-medium leading-6">{intelligence.currentStructuralPosture.sentence}</p>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7" data-decision-structure-visual>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Decision Structure</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <div className="rounded-lg border border-border bg-background p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Option A · {translate("Protects", "보호")}</p>
            <h3 className="mt-3 text-sm font-semibold leading-5">{view.decisionStructure.optionA}</h3>
            <p className="mt-4 text-lg font-semibold">{view.decisionStructure.optionAProtects}</p>
          </div>
          <div className="flex items-center justify-center px-2 py-3 text-center md:w-36 md:flex-col">
            <span className="h-px flex-1 bg-foreground/20 md:h-8 md:w-px md:flex-none" aria-hidden="true" />
            <div className="px-3 md:px-0 md:py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Core Tension</p>
              <p className="mt-2 text-xs font-semibold leading-5">{view.decisionStructure.coreTension}</p>
            </div>
            <span className="h-px flex-1 bg-foreground/20 md:h-8 md:w-px md:flex-none" aria-hidden="true" />
          </div>
          <div className="rounded-lg border border-foreground/25 bg-foreground p-5 text-background">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-background/55">Option B · {translate("Opens", "확장")}</p>
            <h3 className="mt-3 text-sm font-semibold leading-5">{view.decisionStructure.optionB}</h3>
            <p className="mt-4 text-lg font-semibold">{view.decisionStructure.optionBOpens}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="border-l-2 border-foreground/35 px-4 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{translate("Key Constraint", "핵심 제약")}</p>
            <p className="mt-1 text-sm font-semibold">{view.decisionStructure.keyConstraint}</p>
          </div>
          <div className="border-l-2 border-foreground/35 px-4 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{translate("External Evidence", "외부 근거")}</p>
            <p className="mt-1 text-sm font-semibold">{externalEvidenceUsed ? view.decisionStructure.externalEvidence : translate("Evidence not yet verified", "외부 근거 미확인")}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-foreground/25 bg-foreground px-5 py-7 text-background sm:px-7" data-missing-point>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-background/55">04 / What You May Be Missing</p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{view.missingPointKeyword}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-background/72">{view.missingPointSummary}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7" data-safety-margin-visual>
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">06 / Safety Margin</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{view.safetyMarginKeyword}</p>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{translate("Room to Be Wrong", "틀릴 수 있는 여지")}</p>
            <p className="mt-2 text-sm font-semibold leading-6">{intelligence.safetyMargin.roomToBeWrong}</p>
          </div>
          <SafetyIndicators intelligence={intelligence} translate={translate} />
        </div>
        <div className="mt-3 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <p className="text-xs leading-5">
            <strong>{translate("Protect", "보호")}</strong>
            <br />
            {intelligence.safetyMargin.protectedCapacity}
          </p>
          <p className="text-xs leading-5">
            <strong>{translate("Exposure Boundary", "노출 경계")}</strong>
            <br />
            {intelligence.safetyMargin.exposureBoundary}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7" data-changing-dashboard>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">05 / Changing</p>
            <h2 className="mt-2 text-xl font-semibold">{translate("Can the structure change?", "현재 구조를 바꿀 수 있나요?")}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{intelligence.changingPlays.length} / 3</p>
        </div>
        {intelligence.changingPlays.length === 0 ? (
          <p className="mt-5 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">{translate("No additional configuration is justified by the current structure. The priority is to strengthen or act on the evidence already visible.", "현재 구조에서는 추가 구성이 정당화되지 않습니다. 이미 확인된 근거를 강화하거나 그 근거에 따라 움직이는 것이 우선입니다.")}</p>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {intelligence.changingPlays.map((play, index) => (
              <article key={play.family} className="rounded-lg border border-border bg-background p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Play {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-lg font-semibold">{play.title}</h3>
                <dl className="mt-4 space-y-3 text-xs leading-5">
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">{translate("Changes", "바꾸는 구조")}</dt>
                    <dd className="mt-1">{play.changes}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">{translate("Protects", "보호")}</dt>
                    <dd className="mt-1">{play.protects}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">{translate("Needs", "필요 근거")}</dt>
                    <dd className="mt-1">{play.needs}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">{translate("Exposure", "노출")}</dt>
                    <dd className="mt-1">{play.exposure}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7" data-decision-switches-visual>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">07 / Decision Switches</p>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {intelligence.decisionSwitches.map(item => (
            <article key={item.signal} className="grid grid-cols-[42px_1fr] gap-3 rounded-lg border border-border bg-background p-4 lg:grid-cols-1">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">If</span>
              </div>
              <p className="text-sm font-semibold leading-5">{item.signal}</p>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Then</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{item.direction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7" data-experiment-timeline>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">08 / Next-Step Experiment</p>
        <div className="relative mt-6 grid gap-3 lg:grid-cols-3">
          {intelligence.nextStepExperiment.stages.slice(0, 3).map((stage, index) => (
            <article key={stage.period} className="relative rounded-lg border border-border bg-background p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{stage.period}</p>
              <h3 className="mt-2 text-lg font-semibold uppercase tracking-tight">{stage.title}</h3>
              <p className="mt-3 text-sm leading-6">{stage.action}</p>
              <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">{stage.output}</p>
              {index < 2 ? <span className="absolute -bottom-3 left-1/2 hidden text-muted-foreground lg:-right-3 lg:bottom-auto lg:left-auto lg:top-1/2 lg:block">→</span> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ProductApplicationReport({ intelligence, translate, externalEvidenceUsed }: ProductViewProps) {
  const card = "pdf-keep-together border-t-2 border-black bg-[#f6f6f4] p-5";
  return (
    <div data-product-application="report">
      <section className="pdf-report-section pdf-page-break space-y-7 p-8 sm:p-12" data-report-executive-summary>
        <p className="pdf-kicker">Executive Visual Summary</p>
        <ExecutiveDecisionMap intelligence={intelligence} translate={translate} />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">Decision Structure</p>
            <p className="mt-3 text-lg font-semibold">{intelligence.presentation.decisionStructure.coreTension}</p>
            <p className="mt-2 text-sm opacity-65">{intelligence.presentation.decisionStructure.keyConstraint}</p>
          </div>
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">Safety Margin</p>
            <p className="mt-3 text-lg font-semibold">{intelligence.presentation.safetyMarginKeyword}</p>
            <SafetyIndicators intelligence={intelligence} translate={translate} />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">Changing Plays</p>
            <ul className="mt-3 space-y-2 text-sm">
              {intelligence.changingPlays.map(play => (
                <li key={play.family}>— {play.title}</li>
              ))}
            </ul>
          </div>
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">Decision Switches + Next Experiment</p>
            <p className="mt-3 text-sm font-semibold">{intelligence.decisionSwitches[0]?.signal}</p>
            <p className="mt-2 text-sm opacity-65">{intelligence.presentation.nextTestKeyword}</p>
          </div>
        </div>
      </section>

      <div className="pdf-report-section pdf-page-break space-y-7 p-8 sm:p-12" data-report-detail>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">01 / Current Structural Posture</p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] opacity-60">{intelligence.currentStructuralPosture.label}</p>
          <p className="mt-2 text-xs leading-relaxed opacity-60">
            {externalEvidenceUsed
              ? translate("This view uses your current case, Safety Margin, and available external evidence.", "이 분석은 현재 사례, Safety Margin, 확인 가능한 외부 근거를 활용합니다.")
              : translate("This view uses your current case and Safety Margin; current external evidence was not used.", "이 분석은 현재 사례와 Safety Margin을 활용하며 현재 외부 근거는 사용하지 않았습니다.")}
          </p>
          <h2 className="mt-3 text-xl font-semibold leading-relaxed sm:text-2xl">{intelligence.currentStructuralPosture.sentence}</h2>
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">02 / Why This Posture</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">{translate("Top Drivers", "핵심 동인")}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed opacity-70">
                {intelligence.why.topDrivers.map(driver => (
                  <li key={driver}>— {driver}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{translate("Biggest Risk", "가장 큰 리스크")}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-70">{intelligence.why.biggestRisk}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{translate("Strongest Counterargument", "가장 강한 반론")}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-70">{intelligence.why.strongestCounterargument}</p>
            </div>
          </div>
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">03 / Decision Structure</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              [translate("Your Situation", "현재 상황"), intelligence.decisionStructure.insideReality],
              [translate("External Evidence", "외부 근거"), intelligence.decisionStructure.outsideEvidence],
              [translate("Key Constraints", "핵심 제약"), intelligence.decisionStructure.constraints],
              [translate("Trade-offs", "트레이드오프"), intelligence.decisionStructure.tradeOffs],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-current/20 pt-3">
                <h3 className="text-sm font-semibold">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-70">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">04 / What You May Be Missing</p>
          <h2 className="mt-4 text-xl font-semibold">{intelligence.presentation.missingPointKeyword}</h2>
          <p className="mt-3 text-sm leading-7 opacity-75">{intelligence.missingPoint}</p>
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">05 / Changing</p>
          {intelligence.changingPlays.length ? (
            <div className="mt-5 space-y-5">
              {intelligence.changingPlays.map((play, index) => (
                <article key={play.family} className="border-t border-current/20 pt-4">
                  <p className="text-xs opacity-55">Play {String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-lg font-semibold">{play.title}</h3>
                  <p className="mt-2 text-sm leading-7 opacity-75">{play.move}</p>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold">{translate("What it changes", "바꾸는 구조")}</dt>
                      <dd className="opacity-70">{play.changes}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">{translate("Evidence to create", "만들 근거")}</dt>
                      <dd className="opacity-70">{play.evidence}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">{translate("What it protects", "보호하는 것")}</dt>
                      <dd className="opacity-70">{play.protects}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">{translate("Time / exposure", "시간 / 노출")}</dt>
                      <dd className="opacity-70">{play.timeExposure}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm opacity-70">{translate("No additional configuration is justified by the current structure. The priority is to strengthen or act on the evidence already visible.", "현재 구조에서는 추가 구성이 정당화되지 않습니다. 이미 확인된 근거를 강화하거나 그 근거에 따라 움직이는 것이 우선입니다.")}</p>
          )}
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">06 / Safety Margin · Room to Be Wrong</p>
          <p className="mt-4 text-lg font-semibold leading-relaxed">{intelligence.safetyMargin.reading}</p>
          <SafetyIndicators intelligence={intelligence} translate={translate} />
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
            {[
              [translate("Financial Room", "재정 / 소득 여유"), intelligence.safetyMargin.financialRoomReading],
              [translate("Recovery / Re-entry", "회복 / 재진입"), intelligence.safetyMargin.recoveryReentryReading],
              [translate("Downside Exposure", "하방 노출"), intelligence.safetyMargin.downsideExposureReading],
              [translate("Room to Be Wrong", "틀릴 수 있는 여지"), intelligence.safetyMargin.roomToBeWrong],
              [translate("Strongest Protection", "가장 강한 보호"), intelligence.safetyMargin.strongestProtection],
              [translate("Weakest Margin", "가장 약한 여지"), intelligence.safetyMargin.weakestMargin],
              [translate("What Must Be Protected", "보호해야 할 역량"), intelligence.safetyMargin.protectedCapacity],
              [translate("Exposure Not to Increase Yet", "아직 늘리지 않을 노출"), intelligence.safetyMargin.exposureBoundary],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 opacity-70">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">07 / Decision Switches</p>
          <div className="mt-4 space-y-4">
            {intelligence.decisionSwitches.map(item => (
              <article key={item.signal} className="border-t border-current/20 pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">If</p>
                <p className="mt-1 text-sm font-semibold">{item.signal}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] opacity-55">Then</p>
                <p className="mt-1 text-sm leading-6 opacity-70">{item.direction}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-55">08 / Next-Step Experiment</p>
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
            {[
              [translate("What to test", "검증할 것"), intelligence.nextStepExperiment.whatToTest],
              [translate("Build / learn", "만들거나 배울 것"), intelligence.nextStepExperiment.buildOrLearn],
              [translate("Evidence to collect", "수집할 근거"), intelligence.nextStepExperiment.evidenceToCollect],
              [translate("Exposure boundary", "노출 경계"), intelligence.nextStepExperiment.exposureBoundary],
              [translate("Continue if", "계속할 조건"), intelligence.nextStepExperiment.continueCondition],
              [translate("Pause / redesign if", "중단 / 재설계 조건"), intelligence.nextStepExperiment.pauseCondition],
              [translate("Reassess", "재평가 시점"), intelligence.nextStepExperiment.reassessAt],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 opacity-70">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {intelligence.nextStepExperiment.stages.map(stage => (
              <div key={stage.period} className="border-t border-current/20 pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-55">{stage.period}</p>
                <h3 className="mt-2 text-sm font-semibold">{stage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-70">{stage.action}</p>
                <p className="mt-2 text-xs leading-relaxed opacity-60">{stage.output}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
