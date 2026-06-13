import { useMemo, useState } from "react";

type Tier = "essential" | "executive";

type PreviewAnswers = {
  decision: string;
  optionA: string;
  optionB: string;
  pull: string;
  constraint: string;
  risk: string;
  condition: string;
};

const initialPreviewAnswers: PreviewAnswers = {
  decision: "",
  optionA: "",
  optionB: "",
  pull: "",
  constraint: "",
  risk: "",
  condition: "",
};

const previewQuestions: Array<{
  field: keyof PreviewAnswers;
  question: string;
  placeholder: string;
}> = [
  {
    field: "decision",
    question: "What career decision are you facing now?",
    placeholder: "Example: stay in strategy or prepare for a research path",
  },
  { field: "optionA", question: "What is Option A?", placeholder: "Current path or lower-friction option" },
  { field: "optionB", question: "What is Option B?", placeholder: "Transition path or higher-uncertainty option" },
  { field: "pull", question: "What is pulling you toward change?", placeholder: "Identity, upside, learning, autonomy..." },
  { field: "constraint", question: "What is holding you back?", placeholder: "Safety margin, timing, support..." },
  { field: "risk", question: "What is your biggest risk, fear, or uncertainty?", placeholder: "What could distort the decision?" },
  { field: "condition", question: "What condition would make deeper commitment more defensible?", placeholder: "What must become clearer?" },
];

const howItWorks = [
  {
    step: "Tip in",
    body: "Answer a short set of questions about your current career decision.",
  },
  {
    step: "Decide",
    body: "See the structure behind the decision: tension, trade-offs, risks, and conditions.",
  },
  {
    step: "Value up",
    body: "Turn structural clarity into a stronger career move.",
  },
] as const;

const insightCards = [
  {
    marker: "D",
    eyebrow: "Decision Type",
    title: "Staged Reconfiguration",
    line: "A transition that needs evidence before deeper commitment.",
  },
  {
    marker: "T",
    eyebrow: "Core Tension",
    title: "Identity Pull vs Safety Margin",
    line: "Long-term fit is pulling against near-term stability.",
  },
  {
    marker: "R",
    eyebrow: "Primary Risk",
    title: "Premature Commitment",
    line: "The risk is moving before validation is strong enough.",
  },
  {
    marker: "Q",
    eyebrow: "Next Structural Question",
    title: "What must be validated?",
    line: "Commitment becomes cleaner when uncertainty narrows.",
  },
] as const;

const lockedModules = [
  {
    title: "External Comparative Snapshot",
    reveals: "Option-level trade-offs across stability, validation, and execution burden.",
  },
  {
    title: "Internal Structural Snapshot",
    reveals: "Readiness, safety margin, support, strain, and timing pressure.",
  },
  {
    title: "Structural Risk Diagnosis",
    reveals: "Primary, secondary, and distortion risks.",
  },
  {
    title: "Decision Conditions",
    reveals: "What makes deeper commitment more defensible.",
  },
  {
    title: "PDF Download",
    reveals: "Save the dashboard as a PDF.",
  },
  {
    title: "Executive Report Q&A",
    reveals: "Ask report-based questions for 7 days.",
  },
] as const;

const intakeGroups = [
  {
    title: "Current Situation",
    body: "Clarifies the current role, pressure, and decision context.",
  },
  {
    title: "Option A / Option B",
    body: "Defines the paths being compared and what each path protects or strains.",
  },
  {
    title: "External Pressure",
    body: "Locates market, institutional, and validation signals around each path.",
  },
  {
    title: "Internal Readiness",
    body: "Reads clarity, emotional load, and capacity for sustained execution.",
  },
  {
    title: "Safety Margin",
    body: "Checks runway, reversibility, and downside exposure.",
  },
  {
    title: "Support System",
    body: "Maps practical backing, mentors, family constraints, and operating support.",
  },
  {
    title: "Timing and Constraints",
    body: "Surfaces sequencing pressure, deadlines, and constraint collisions.",
  },
  {
    title: "Decision Conditions",
    body: "Defines what would make deeper commitment structurally defensible.",
  },
] as const;

const dashboardDeck = [
  {
    section: "Overview",
    keyword: "Staged Reconfiguration",
    reading: "A transition that should be validated before full commitment.",
  },
  {
    section: "External",
    keyword: "Validation Burden",
    reading: "Option B needs external proof before deeper commitment.",
  },
  {
    section: "Internal",
    keyword: "Safety Margin",
    reading: "Option A currently preserves more near-term stability.",
  },
  {
    section: "Risk",
    keyword: "Premature Commitment",
    reading: "The highest risk is moving before evidence is strong enough.",
  },
  {
    section: "Conditions",
    keyword: "Defensibility",
    reading: "Commitment strengthens when uncertainty is reduced.",
  },
] as const;

const matrixRows = [
  { dimension: "Income Stability", optionA: "Strong", optionB: "Developing", reading: "A preserves runway." },
  { dimension: "Identity Alignment", optionA: "Moderate", optionB: "Strong", reading: "B carries stronger pull." },
  { dimension: "External Validation", optionA: "Established", optionB: "Developing", reading: "B needs proof." },
  { dimension: "Execution Burden", optionA: "Lower", optionB: "Higher", reading: "B requires sequencing." },
  { dimension: "Reversibility", optionA: "Higher", optionB: "Moderate", reading: "Staging protects optionality." },
] as const;

const internalSignals = [
  { marker: "C", label: "Decision Clarity", status: "Partial", width: "56%" },
  { marker: "S", label: "Safety Margin", status: "Stronger in Option A", width: "76%" },
  { marker: "N", label: "Support System", status: "Emerging", width: "50%" },
  { marker: "L", label: "Execution Load", status: "Elevated", width: "70%" },
  { marker: "T", label: "Timing Pressure", status: "Moderate", width: "48%" },
] as const;

const riskItems = [
  {
    marker: "1",
    label: "Primary Risk",
    value: "Premature Commitment",
    body: "Moving before external validation can support the transition.",
  },
  {
    marker: "2",
    label: "Secondary Risk",
    value: "Corporate Stagnation",
    body: "Stability may preserve safety while slowing identity renewal.",
  },
  {
    marker: "3",
    label: "Distortion Risk",
    value: "Fatigue Misread as Readiness",
    body: "Current fatigue may make transition urgency look like proof.",
  },
] as const;

const optionBConditions = [
  "External validators confirm credible research or advisory demand.",
  "Runway protects safety margin during exploration.",
  "The move can be tested before irreversible commitment.",
] as const;

const optionAConditions = [
  "The current role can be reshaped around learning.",
  "Exploration time remains protected.",
  "Stability connects to a longer platform strategy.",
] as const;

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mb-7 max-w-3xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Marker({ children }: { children: string }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-secondary/35 text-xs font-semibold text-foreground">
      {children}
    </span>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-sm border border-border bg-secondary/35 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </span>
  );
}

export default function AmcWebMvp() {
  const [previewStarted, setPreviewStarted] = useState(false);
  const [previewGenerated, setPreviewGenerated] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [completedGroups, setCompletedGroups] = useState<string[]>([]);
  const [dashboardGenerated, setDashboardGenerated] = useState(false);
  const [answers, setAnswers] = useState<PreviewAnswers>(initialPreviewAnswers);

  const optionALabel = answers.optionA.trim() || "Corporate Strategy Path";
  const optionBLabel = answers.optionB.trim() || "PhD / Research Path";
  const requiredPreviewReady = Boolean(answers.decision.trim() && answers.optionA.trim() && answers.optionB.trim());
  const progress = Math.round((completedGroups.length / intakeGroups.length) * 100);
  const fullIntakeComplete = completedGroups.length === intakeGroups.length;

  const completedGroupSet = useMemo(() => new Set(completedGroups), [completedGroups]);

  const updateAnswer = (field: keyof PreviewAnswers, value: string) => {
    setAnswers((current) => ({ ...current, [field]: value }));
  };

  const startPreview = () => {
    setPreviewStarted(true);
    requestAnimationFrame(() => {
      document.getElementById("preview-intake")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const generatePreview = () => {
    setPreviewGenerated(true);
    requestAnimationFrame(() => {
      document.getElementById("preview-dashboard")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const simulateUnlock = (tier: Tier) => {
    setSelectedTier(tier);
    setDashboardGenerated(false);
    requestAnimationFrame(() => {
      document.getElementById("full-intake")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const toggleGroup = (title: string) => {
    setCompletedGroups((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  };

  const generateDashboard = () => {
    setDashboardGenerated(true);
    requestAnimationFrame(() => {
      document.getElementById("full-dashboard")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <section className="grid min-h-[86vh] grid-cols-1 gap-10 border-b border-border py-14 sm:py-18 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              AMC - All of My Career
            </p>
            <p className="mb-5 text-sm font-medium tracking-[0.12em] text-muted-foreground">Tip in. Decide. Value up.</p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              We do not tell you what to do. We show the structure behind your career decision.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A private web-based structural interpretation dashboard for serious career decisions.
            </p>
            <p className="mt-4 inline-flex rounded-sm border border-border bg-secondary/30 px-3 py-2 text-sm font-medium">
              No account required to start.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Your quick preview uses 7 questions. The full report requires a detailed intake after unlock.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startPreview}
                className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
              >
                Start Free Structural Preview
              </button>
              <a
                href="#how-amc-works"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground"
              >
                See how AMC works
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">What AMC shows</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {["Decision Type", "Structural Tension", "Risk Concentration", "Commitment Conditions"].map(
                (item, index) => (
                  <div key={item} className="rounded-md border border-border bg-background p-4">
                    <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-3 text-sm font-semibold">{item}</p>
                  </div>
                ),
              )}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              A structured mirror for tension, trade-offs, risk concentration, and commitment conditions.
            </p>
          </aside>
        </section>

        <section id="how-amc-works" className="border-b border-border py-12 sm:py-14">
          <SectionHeader
            eyebrow="How AMC works"
            title="A staged path from quick signal to full dashboard."
            body="AMC is not a recommendation engine. AMC does not decide for the user. AMC structures the decision."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.step}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {previewStarted ? (
          <section id="preview-intake" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Free Preview Intake"
              title="Seven compact questions. One first structural signal."
              body="Complete at least the decision and both options to generate the preview."
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {previewQuestions.map((item, index) => (
                <label key={item.field} className="rounded-lg border border-border bg-card p-4">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Q{index + 1}
                  </span>
                  <span className="block min-h-10 text-sm font-medium leading-snug text-foreground">{item.question}</span>
                  <textarea
                    className="mt-3 h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder={item.placeholder}
                    value={answers[item.field]}
                    onChange={(event) => updateAnswer(item.field, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={generatePreview}
              disabled={!requiredPreviewReady}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate My Structural Preview
            </button>
          </section>
        ) : null}

        {previewGenerated ? (
          <section id="preview-dashboard" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Preview Dashboard"
              title="The first read as an insight deck."
              body="The preview shows structure without delivering the full report."
            />

            <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {insightCards.map((card) => (
                <div
                  key={card.eyebrow}
                  className="min-w-[250px] snap-start rounded-lg border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <Marker>{card.marker}</Marker>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {card.eyebrow}
                    </p>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.line}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Option A / Option B Quick View
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                <div className="rounded-md border border-border bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Option A</p>
                  <h3 className="mt-2 text-lg font-semibold">{optionALabel}</h3>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Strength</p>
                      <p className="mt-1 text-sm font-medium">Safety margin</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Constraint</p>
                      <p className="mt-1 text-sm font-medium">Slower identity renewal</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center px-2">
                  <span className="rounded-sm border border-border bg-secondary/35 px-3 py-1 text-xs font-medium text-muted-foreground">
                    compare
                  </span>
                </div>
                <div className="rounded-md border border-border bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Option B</p>
                  <h3 className="mt-2 text-lg font-semibold">{optionBLabel}</h3>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Strength</p>
                      <p className="mt-1 text-sm font-medium">Identity alignment</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Constraint</p>
                      <p className="mt-1 text-sm font-medium">External validation burden</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 rounded-md border border-border bg-secondary/25 p-4 text-sm leading-relaxed">
                The decision is not which option is more attractive, but which conditions make deeper commitment
                defensible.
              </p>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Locked Full Report Modules
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">Unlock Full Career Structure Report</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lockedModules.map((module) => (
                  <div key={module.title} className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold leading-snug text-foreground">{module.title}</h4>
                      <Tag>Locked</Tag>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{module.reveals}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("unlock")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
              >
                Unlock Full Career Structure Report
              </button>
            </div>
          </section>
        ) : null}

        {previewGenerated ? (
          <section id="unlock" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Unlock"
              title="The full report begins with a detailed 29-question intake."
              body="No account is required. A private email link can be used later for report access and Executive Q&A."
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Essential</p>
                <h3 className="mt-3 text-2xl font-semibold">Full dashboard</h3>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Full Web Dashboard
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    PDF Download
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => simulateUnlock("essential")}
                  className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                >
                  Simulate Essential Unlock
                </button>
              </div>
              <div className="rounded-lg border border-foreground/20 bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Executive</p>
                <h3 className="mt-3 text-2xl font-semibold">Dashboard plus report Q&A</h3>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Full Web Dashboard
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    PDF Download
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    7-day Report Q&A
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => simulateUnlock("executive")}
                  className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                >
                  Simulate Executive Unlock
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {selectedTier ? (
          <section id="full-intake" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Full intake simulation"
              title="Eight groups stand in for the full 29-question intake."
              body="Mark each group complete to simulate the deeper evidence base needed for the full dashboard."
            />
            <div className="mb-5 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm font-medium">
                  {completedGroups.length} / {intakeGroups.length} groups complete
                </p>
                <p className="text-sm text-muted-foreground">Progress: {progress}%</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-foreground/75" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {intakeGroups.map((group, index) => {
                const complete = completedGroupSet.has(group.title);
                return (
                  <div key={group.title} className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                      <Tag>{complete ? "Complete" : "Open"}</Tag>
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{group.title}</h3>
                    <p className="mt-3 min-h-16 text-sm leading-relaxed text-muted-foreground">{group.body}</p>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
                    >
                      {complete ? "Mark open" : "Mark complete"}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={generateDashboard}
              disabled={!fullIntakeComplete}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate Full Dashboard
            </button>
          </section>
        ) : null}

        {dashboardGenerated ? (
          <>
            <section id="full-dashboard" className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="Full Web Dashboard"
                title="A five-card map before the detailed sections."
                body="The full report opens as a dashboard: compact signals first, deeper interpretation second."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {dashboardDeck.map((card, index) => (
                  <div key={card.section} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-3 text-sm font-semibold">{card.section}</h3>
                    <p className="mt-2 text-base font-semibold tracking-tight">{card.keyword}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{card.reading}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-6">
                <section className="rounded-lg border border-border bg-card p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    01 / Structural Overview
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Decision Type</p>
                      <p className="mt-2 text-sm font-semibold">Staged Reconfiguration</p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Core Tension</p>
                      <p className="mt-2 text-sm font-semibold">Identity alignment vs safety margin</p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Structural Reading</p>
                      <p className="mt-2 text-sm font-semibold">Validate field capital before deeper conversion.</p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    The decision is less about choosing immediately and more about validating whether field capital can be
                    converted into a second platform.
                  </p>
                </section>

                <section className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex flex-col gap-2 p-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        02 / External Comparative Snapshot
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">Option-level trade-offs</h3>
                    </div>
                    <Tag>Table-first</Tag>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                      <thead className="border-y border-border bg-secondary/35">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Dimension</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{optionALabel}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{optionBLabel}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Reading</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrixRows.map((row) => (
                          <tr key={row.dimension} className="border-b border-border last:border-b-0">
                            <td className="px-4 py-4 text-sm font-medium">{row.dimension}</td>
                            <td className="px-4 py-4 text-sm">
                              <Tag>{row.optionA}</Tag>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Tag>{row.optionB}</Tag>
                            </td>
                            <td className="px-4 py-4 text-sm leading-relaxed text-muted-foreground">{row.reading}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        03 / Internal Structural Snapshot
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">Readiness and load signals</h3>
                    </div>
                    <Tag>Infographic view</Tag>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {internalSignals.map((signal) => (
                      <div key={signal.label} className="rounded-md border border-border bg-background p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <Marker>{signal.marker}</Marker>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">signal</p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{signal.label}</p>
                        <p className="mt-2 min-h-10 text-sm font-semibold leading-snug">{signal.status}</p>
                        <div className="mt-4 h-2 rounded-full bg-secondary">
                          <div className="h-2 rounded-full bg-foreground/70" style={{ width: signal.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        04 / Structural Risk Diagnosis
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">Risk concentration</h3>
                    </div>
                    <Tag>Three-part read</Tag>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {riskItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-background p-5">
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <Marker>{item.marker}</Marker>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                        </div>
                        <p className="text-xl font-semibold tracking-tight">{item.value}</p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    05 / Decision Conditions
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-md border border-border bg-background p-5">
                      <h3 className="max-w-md text-lg font-semibold leading-snug">
                        A deeper move toward {optionBLabel} becomes more supportable if...
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {optionBConditions.map((condition) => (
                          <li key={condition} className="max-w-md text-sm leading-relaxed text-muted-foreground">
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-border bg-background p-5">
                      <h3 className="max-w-md text-lg font-semibold leading-snug">
                        Remaining in {optionALabel} becomes more supportable if...
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {optionAConditions.map((condition) => (
                          <li key={condition} className="max-w-md text-sm leading-relaxed text-muted-foreground">
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-5 rounded-md border border-border bg-secondary/25 p-4 text-sm leading-relaxed">
                    The goal is not immediate certainty. The goal is enough evidence to make deeper commitment
                    structurally defensible.
                  </p>
                </section>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 border-b border-border py-12 sm:py-14 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  PDF Download
                </p>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Save the dashboard as a PDF.</h2>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Use the browser print dialog to keep the web dashboard portable.
                </p>
                <button
                  type="button"
                  onClick={printReport}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                >
                  Download / Save as PDF
                </button>
              </div>
            </section>

            <section className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="Executive Report Q&A"
                title={
                  selectedTier === "executive"
                    ? "A report-based Q&A module for the Executive window."
                    : "Executive Report Q&A is available with Executive."
                }
                body={
                  selectedTier === "executive"
                    ? "Ask structured questions about your report for 7 days."
                    : "Essential includes the dashboard and PDF download. Executive adds report-based Q&A."
                }
              />
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">Executive Report Q&A</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Executive access can later be handled through a private email link or time-limited access code.
                    </p>
                  </div>
                  <Tag>{selectedTier === "executive" ? "Unlocked" : "Executive only"}</Tag>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    "What is my primary structural risk?",
                    "Why is external validation important here?",
                    "What conditions make deeper commitment more defensible?",
                  ].map((question) => (
                    <div
                      key={question}
                      className="rounded-md border border-border bg-background p-4 text-sm leading-relaxed"
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <section className="py-8">
          <p className="rounded-md border border-border bg-secondary/20 p-4 text-xs leading-relaxed text-muted-foreground">
            Developer note: This static MVP prototype uses local UI state only. It does not include real payment,
            backend submission, account login, chatbot, external API calls, or production report generation.
          </p>
        </section>
      </main>
    </div>
  );
}
