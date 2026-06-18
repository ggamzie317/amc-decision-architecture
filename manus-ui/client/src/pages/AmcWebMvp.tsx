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
    title: "Detailed PDF Report",
    reveals: "Deeper written interpretation and richer analysis for later review.",
  },
  {
    title: "Executive Report Q&A",
    reveals: "Ask report-based questions for 7 days.",
  },
] as const;

const detailedPdfSections = [
  "Executive Summary",
  "Situation and Decision Context",
  "Option A / Option B Detailed Reading",
  "External Comparative Analysis",
  "Internal Readiness Analysis",
  "Safety Margin and Reversibility",
  "Structural Risk Diagnosis",
  "Decision Conditions",
  "30 / 60 / 90-day Validation Plan",
  "Reflection Questions",
] as const;

const intakeGroups = [
  {
    title: "Current Situation",
    questions: [
      {
        id: 1,
        text: "What career decision are you facing now?",
        sample: "Whether to remain in corporate strategy or prepare for a PhD and research-oriented advisory path.",
      },
      {
        id: 2,
        text: "Why has this decision become important at this point?",
        sample: "The current role remains stable, but the gap between daily work and long-term identity is widening.",
      },
      {
        id: 3,
        text: "What pressure, trigger, or opportunity is making the decision more urgent?",
        sample: "A possible research collaboration and the next admissions cycle create a time-sensitive validation window.",
      },
      {
        id: 4,
        text: "What would happen if you delayed this decision for 6 to 12 months?",
        sample: "Income stability would remain, but the research transition window could become narrower.",
      },
    ],
  },
  {
    title: "Option A / Option B",
    questions: [
      { id: 5, text: "What is Option A?", sample: "Remain in the current corporate strategy path." },
      {
        id: 6,
        text: "What does Option A protect?",
        sample: "Income continuity, professional credibility, and near-term family stability.",
      },
      {
        id: 7,
        text: "What does Option A limit or strain?",
        sample: "Research identity, intellectual depth, and longer-term platform renewal.",
      },
      { id: 8, text: "What is Option B?", sample: "Prepare for a PhD and research-oriented advisory path." },
      {
        id: 9,
        text: "What does Option B open up?",
        sample: "A stronger research identity, deeper expertise, and a possible second professional platform.",
      },
      {
        id: 10,
        text: "What does Option B put at risk?",
        sample: "Income stability, execution capacity, and credibility if external validation remains weak.",
      },
    ],
  },
  {
    title: "External Pressure",
    questions: [
      {
        id: 11,
        text: "What external market, industry, policy, or company changes are affecting this decision?",
        sample: "Corporate strategy roles are becoming more execution-heavy while research-led advisory demand is selective.",
      },
      {
        id: 12,
        text: "Which option is more aligned with where the external environment seems to be moving?",
        sample: "Option B may align with demand for specialized research, but Option A remains more immediately validated.",
      },
      {
        id: 13,
        text: "What evidence supports that external reading?",
        sample: "Early conversations show interest in the research topic, but no funded commitment exists yet.",
      },
      {
        id: 14,
        text: "What external validation is still missing?",
        sample: "Admissions fit, funding visibility, supervisor support, and paid advisory demand.",
      },
    ],
  },
  {
    title: "Internal Readiness",
    questions: [
      {
        id: 15,
        text: "Which option feels more aligned with your long-term identity?",
        sample: "Option B feels more aligned with the desired long-term research and advisory identity.",
      },
      {
        id: 16,
        text: "Which option requires more personal reconfiguration?",
        sample: "Option B requires a larger shift in routine, identity, learning discipline, and professional positioning.",
      },
      {
        id: 17,
        text: "What skills, credentials, or proof points are still missing?",
        sample: "Published research, stronger academic references, and evidence of market demand for advisory work.",
      },
      {
        id: 18,
        text: "What emotional or cognitive load would each option create?",
        sample: "Option A creates stagnation pressure; Option B creates uncertainty and sustained execution load.",
      },
    ],
  },
  {
    title: "Safety Margin",
    questions: [
      {
        id: 19,
        text: "How much financial runway or income stability do you have?",
        sample: "The current role provides strong stability, while a transition would require a protected 12-month runway.",
      },
      {
        id: 20,
        text: "Which option gives you more reversibility if things do not work out?",
        sample: "Option A is currently more reversible because exploration can continue while income is protected.",
      },
      {
        id: 21,
        text: "What downside exposure would be hardest to absorb?",
        sample: "A transition that weakens income without producing academic or advisory validation.",
      },
    ],
  },
  {
    title: "Support System",
    questions: [
      {
        id: 22,
        text: "Who would support you in Option A?",
        sample: "Current colleagues, family, and the existing professional network.",
      },
      {
        id: 23,
        text: "Who would support you in Option B?",
        sample: "Potential supervisors, research collaborators, and a small group of advisory contacts.",
      },
      {
        id: 24,
        text: "What network, mentor, family, or institutional support is still missing?",
        sample: "A committed academic sponsor, clearer family operating support, and stronger institutional backing.",
      },
    ],
  },
  {
    title: "Timing and Constraints",
    questions: [
      {
        id: 25,
        text: "What deadlines, age, visa, family, company, or market timing constraints matter?",
        sample: "The admissions calendar, family obligations, and corporate workload shape the next 12 months.",
      },
      {
        id: 26,
        text: "Which option becomes harder if you wait?",
        sample: "Option B becomes harder if research proof and academic relationships are delayed.",
      },
      {
        id: 27,
        text: "Which option becomes safer if you wait?",
        sample: "Option B becomes safer if external validation and financial runway improve before commitment.",
      },
    ],
  },
  {
    title: "Decision Conditions",
    questions: [
      {
        id: 28,
        text: "What condition would make deeper commitment to Option B more defensible?",
        sample: "Credible supervisor support, funding visibility, and a tested advisory demand signal.",
      },
      {
        id: 29,
        text: "What condition would make staying with Option A more defensible?",
        sample: "A reshaped role that protects learning, exploration time, and a clear longer-term platform strategy.",
      },
    ],
  },
] as const;

const totalFullIntakeQuestions = intakeGroups.reduce((total, group) => total + group.questions.length, 0);

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

const reportExecutiveSummary = [
  "The decision is best understood as a staged reconfiguration rather than an immediate binary choice.",
  "The central tension sits between stronger long-term identity alignment and stronger near-term safety margin.",
  "Premature commitment is the primary risk while external evidence remains incomplete.",
  "A deeper transition becomes more defensible when validation, runway, and reversibility improve together.",
] as const;

const externalPressureSignals = [
  {
    label: "Market / Industry Signal",
    value: "Selective opportunity",
    reading: "Specialized research and advisory demand appears credible but uneven.",
  },
  {
    label: "Institutional / Company Signal",
    value: "Current path validated",
    reading: "The existing role retains market credibility but offers slower identity renewal.",
  },
  {
    label: "Evidence Quality",
    value: "Developing",
    reading: "Early conversations support exploration, not yet full commitment.",
  },
  {
    label: "Missing Validation",
    value: "Material",
    reading: "Funding, sponsor support, and paid advisory demand remain unresolved.",
  },
] as const;

const reportRiskItems = [
  {
    label: "Primary Risk",
    name: "Premature Commitment",
    meaning: "Moving before the transition has enough external support.",
    why: "Identity alignment may be mistaken for structural readiness.",
    reduction: "Test demand, sponsorship, and runway before irreversible movement.",
  },
  {
    label: "Secondary Risk",
    name: "Corporate Stagnation",
    meaning: "Remaining stable without building a second platform.",
    why: "Near-term safety can gradually narrow future mobility.",
    reduction: "Protect research, network, and proof-building time inside Option A.",
  },
  {
    label: "Distortion Risk",
    name: "Fatigue Misread as Readiness",
    meaning: "Current-role fatigue may intensify the appeal of change.",
    why: "Urgency can look like evidence when capacity is already strained.",
    reduction: "Separate recovery needs from transition validation.",
  },
] as const;

const validationPlan = [
  {
    period: "30 days",
    title: "Clarify evidence",
    body: "Define the strongest claims behind each option and identify the evidence still missing.",
  },
  {
    period: "60 days",
    title: "Test external validation",
    body: "Pressure-test supervisor, market, funding, and advisory signals with real counterparties.",
  },
  {
    period: "90 days",
    title: "Decide commitment conditions",
    body: "Review whether evidence, safety margin, support, and timing now justify deeper commitment.",
  },
] as const;

const reflectionQuestions = [
  "What evidence would materially change the decision?",
  "Which risk is currently being underestimated?",
  "What support must be secured before deeper commitment?",
  "What should be tested before any irreversible move?",
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

function reportOptionLabel(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized.length >= 3 ? normalized : fallback;
}

export default function AmcWebMvp() {
  const [previewStarted, setPreviewStarted] = useState(false);
  const [previewGenerated, setPreviewGenerated] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [dashboardGenerated, setDashboardGenerated] = useState(false);
  const [showPdfReportView, setShowPdfReportView] = useState(false);
  const [answers, setAnswers] = useState<PreviewAnswers>(initialPreviewAnswers);
  const [fullIntakeAnswers, setFullIntakeAnswers] = useState<Record<number, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([intakeGroups[0].title]);

  const optionALabel = reportOptionLabel(answers.optionA, "Option A");
  const optionBLabel = reportOptionLabel(answers.optionB, "Option B");
  const decisionContext =
    answers.decision.trim() ||
    fullIntakeAnswers[1]?.trim() ||
    "A comparative career decision requiring staged validation.";
  const reportDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  );
  const requiredPreviewReady = Boolean(answers.decision.trim() && answers.optionA.trim() && answers.optionB.trim());
  const answeredQuestionCount = useMemo(
    () => Object.values(fullIntakeAnswers).filter((value) => value.trim()).length,
    [fullIntakeAnswers],
  );
  const progress = Math.round((answeredQuestionCount / totalFullIntakeQuestions) * 100);
  const fullIntakeComplete = answeredQuestionCount === totalFullIntakeQuestions;
  const expandedGroupSet = useMemo(() => new Set(expandedGroups), [expandedGroups]);

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

  const updateFullIntakeAnswer = (questionId: number, value: string) => {
    setFullIntakeAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  };

  const fillSampleAnswers = () => {
    const sampleAnswers = Object.fromEntries(
      intakeGroups.flatMap((group) => group.questions.map((question) => [question.id, question.sample])),
    ) as Record<number, string>;
    setFullIntakeAnswers(sampleAnswers);
    setExpandedGroups(intakeGroups.map((group) => group.title));
  };

  const generateDashboard = () => {
    setDashboardGenerated(true);
    requestAnimationFrame(() => {
      document.getElementById("full-dashboard")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const generateDetailedReport = () => {
    setShowPdfReportView(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showPdfReportView) {
    const snapshotItems = [
      { label: "Decision Type", value: "Staged Reconfiguration" },
      { label: "Core Tension", value: "Identity Pull vs Safety Margin" },
      { label: "Primary Risk", value: "Premature Commitment" },
      { label: "Safety Margin", value: `Stronger in ${optionALabel}` },
      { label: "Commitment Condition", value: "Validation, runway, and reversibility" },
    ];

    return (
      <div className="pdf-report-shell min-h-screen bg-[#e9e9e7] text-[#202326]">
        <div className="pdf-report-controls sticky top-0 z-20 border-b border-black/10 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[960px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setShowPdfReportView(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-black/15 bg-white px-4 text-sm font-medium"
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#202326] px-4 text-sm font-medium text-white"
            >
              Print / Save Report as PDF
            </button>
          </div>
        </div>

        <article className="pdf-report-view mx-auto my-8 max-w-[960px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
          <section className="pdf-cover relative flex min-h-[760px] flex-col justify-between overflow-hidden border-b border-black/15 p-10 sm:p-16">
            <div className="absolute right-0 top-0 h-full w-[34%] bg-[#202326]" aria-hidden="true" />
            <div className="relative z-10 max-w-[62%]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55">AMC - All of My Career</p>
              <div className="mt-16 h-px w-16 bg-black" />
              <h1 className="mt-8 text-4xl font-semibold leading-[1.04] tracking-[-0.035em] sm:text-6xl">
                Strategic Career Decision Report
              </h1>
              <p className="mt-7 text-lg font-medium tracking-[0.08em] text-black/60">Tip in. Decide. Value up.</p>
            </div>
            <div className="relative z-10 max-w-[62%] border-t border-black/20 pt-7">
              <p className="text-sm font-medium">Private structural interpretation report</p>
              <dl className="mt-7 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Date</dt>
                  <dd className="mt-2 font-medium">{reportDate}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
                    Decision type
                  </dt>
                  <dd className="mt-2 font-medium">Staged Reconfiguration</dd>
                </div>
              </dl>
            </div>
          </section>

          <div className="pdf-report-body">
            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">01 / Executive Summary</p>
              <div className="mt-4 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="pdf-section-heading">The decision is a validation problem before it is a commitment problem.</h2>
                  <p className="mt-5 text-sm leading-7 text-black/60">{decisionContext}</p>
                </div>
                <div className="border-t-2 border-black">
                  {reportExecutiveSummary.map((item, index) => (
                    <div key={item} className="pdf-keep-together grid grid-cols-[32px_1fr] gap-3 border-b border-black/15 py-4">
                      <span className="text-xs font-semibold text-black/40">{String(index + 1).padStart(2, "0")}</span>
                      <p className="text-sm font-medium leading-6">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">02 / Decision Snapshot</p>
              <h2 className="pdf-section-heading mt-3">Five signals define the current decision architecture.</h2>
              <div className="mt-7 grid grid-cols-1 border-l border-t border-black/15 sm:grid-cols-2 lg:grid-cols-5">
                {snapshotItems.map((item, index) => (
                  <div key={item.label} className="pdf-keep-together border-b border-r border-black/15 p-4">
                    <p className="text-[10px] font-semibold text-black/35">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/50">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold leading-5">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">03 / Option A - Option B Comparative Read</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="pdf-section-heading max-w-xl">The options optimize for different forms of career value.</h2>
                <p className="text-xs font-medium text-black/50">Structural reading, not recommendation</p>
              </div>
              <div className="mt-7 overflow-hidden border border-black/15">
                <table className="pdf-comparison-table w-full border-collapse">
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>{optionALabel}</th>
                      <th>{optionBLabel}</th>
                      <th>Structural reading</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((row) => (
                      <tr key={row.dimension}>
                        <td>{row.dimension}</td>
                        <td><strong>{row.optionA}</strong></td>
                        <td><strong>{row.optionB}</strong></td>
                        <td>{row.reading}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Structural Reading</td>
                      <td><strong>Protects continuity</strong></td>
                      <td><strong>Expands identity fit</strong></td>
                      <td>Staging preserves optionality while evidence develops.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">04 / External Pressure Map</p>
              <h2 className="pdf-section-heading mt-3">External signals support exploration more strongly than immediate conversion.</h2>
              <div className="mt-7 grid grid-cols-1 gap-px bg-black/15 sm:grid-cols-2">
                {externalPressureSignals.map((signal) => (
                  <div key={signal.label} className="pdf-keep-together bg-[#f6f6f4] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/45">{signal.label}</p>
                    <p className="mt-3 text-lg font-semibold">{signal.value}</p>
                    <p className="mt-3 text-sm leading-6 text-black/60">{signal.reading}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">05 / Internal Readiness Map</p>
              <h2 className="pdf-section-heading mt-3">Readiness is mixed: the strategic pull is clear, but the operating base is incomplete.</h2>
              <div className="mt-8 space-y-4">
                {internalSignals.map((signal) => (
                  <div key={signal.label} className="pdf-keep-together grid grid-cols-[1fr_1.4fr] items-center gap-5 border-b border-black/15 pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">{signal.label}</p>
                      <p className="mt-1 text-sm font-semibold">{signal.status}</p>
                    </div>
                    <div className="h-2 bg-black/8">
                      <div className="h-2 bg-[#202326]" style={{ width: signal.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">06 / Safety Margin &amp; Reversibility</p>
              <h2 className="pdf-section-heading mt-3">The safer path protects time; the growth path requires proof.</h2>
              <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {[
                  {
                    label: "What the safer path protects",
                    text: `${optionALabel} protects income continuity, existing credibility, and the capacity to validate a second platform without immediate conversion pressure.`,
                  },
                  {
                    label: "What the growth path requires",
                    text: `${optionBLabel} requires stronger external sponsorship, a protected runway, repeatable execution capacity, and evidence that identity alignment can become durable field value.`,
                  },
                  {
                    label: "What must be validated",
                    text: "Demand, institutional support, financial resilience, and a reversible sequence must become clearer before deeper commitment is structurally defensible.",
                  },
                ].map((item) => (
                  <div key={item.label} className="pdf-keep-together border-t-2 border-black bg-[#f6f6f4] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">{item.label}</p>
                    <p className="mt-4 text-sm leading-6 text-black/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">07 / Structural Risk Diagnosis</p>
              <h2 className="pdf-section-heading mt-3">Risk sits in both action and inaction - but through different mechanisms.</h2>
              <div className="mt-7 space-y-4">
                {reportRiskItems.map((risk, index) => (
                  <div key={risk.label} className="pdf-keep-together border border-black/15">
                    <div className="grid grid-cols-[52px_1fr] border-b border-black/15 bg-[#202326] text-white">
                      <p className="p-4 text-xs font-semibold text-white/55">{String(index + 1).padStart(2, "0")}</p>
                      <div className="border-l border-white/20 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{risk.label}</p>
                        <p className="mt-1 text-lg font-semibold">{risk.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-black/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      {[
                        ["What it means", risk.meaning],
                        ["Why it matters", risk.why],
                        ["What reduces the risk", risk.reduction],
                      ].map(([label, text]) => (
                        <div key={label} className="p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">{label}</p>
                          <p className="mt-2 text-sm leading-6 text-black/65">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">08 / Decision Conditions</p>
              <h2 className="pdf-section-heading mt-3">Commitment becomes defensible when evidence and operating conditions move together.</h2>
              <div className="mt-7 grid grid-cols-1 gap-px bg-black/20 lg:grid-cols-2">
                {[
                  [`Conditions that make ${optionBLabel} more defensible`, optionBConditions],
                  [`Conditions that make ${optionALabel} more defensible`, optionAConditions],
                ].map(([title, conditions]) => (
                  <div key={String(title)} className="pdf-keep-together bg-[#f6f6f4] p-6">
                    <h3 className="text-lg font-semibold leading-6">{String(title)}</h3>
                    <ol className="mt-5 space-y-4">
                      {(conditions as readonly string[]).map((condition, index) => (
                        <li key={condition} className="grid grid-cols-[24px_1fr] gap-3 text-sm leading-6 text-black/65">
                          <span className="font-semibold text-black">{index + 1}</span>
                          <span>{condition}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">09 / 30 - 60 - 90 Day Validation Plan</p>
              <h2 className="pdf-section-heading mt-3">Sequence evidence before increasing commitment.</h2>
              <div className="mt-9 grid grid-cols-1 gap-0 lg:grid-cols-3">
                {validationPlan.map((item, index) => (
                  <div key={item.period} className="pdf-keep-together relative border-l border-black/25 pb-8 pl-6 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-7">
                    <span className="absolute -left-[5px] top-0 h-[9px] w-[9px] rounded-full bg-black lg:-top-[5px] lg:left-0" />
                    <div className={index < validationPlan.length - 1 ? "lg:pr-7" : ""}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{item.period}</p>
                      <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-black/60">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">10 / Closing Reflection</p>
              <div className="mt-4 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="pdf-section-heading">The next move is to improve the quality of the decision conditions.</h2>
                  <p className="mt-5 text-sm leading-7 text-black/60">
                    These questions are designed to expose weak evidence, hidden exposure, and missing support before
                    the decision becomes harder to reverse.
                  </p>
                </div>
                <ol className="border-t-2 border-black">
                  {reflectionQuestions.map((question, index) => (
                    <li key={question} className="pdf-keep-together grid grid-cols-[36px_1fr] gap-3 border-b border-black/15 py-4">
                      <span className="text-xs font-semibold text-black/40">{String(index + 1).padStart(2, "0")}</span>
                      <p className="text-sm font-semibold leading-6">{question}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-14 flex items-end justify-between border-t border-black/20 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                <span>AMC - All of My Career</span>
                <span>Private structural interpretation</span>
              </div>
            </section>
          </div>
        </article>
      </div>
    );
  }

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
              title="The paid experience begins with a detailed 29-question intake."
              body="No account is required. A private email link can be used later for report access and Executive Q&A."
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Essential</p>
                <h3 className="mt-3 text-2xl font-semibold">Dashboard and detailed report</h3>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Full Web Dashboard
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Detailed PDF Report
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
                <h3 className="mt-3 text-2xl font-semibold">Dashboard, detailed report, and Q&A</h3>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Full Web Dashboard
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Detailed PDF Report
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
              eyebrow="Full intake"
              title="A deeper evidence base for the full dashboard."
              body="The full intake expands the quick preview into a deeper evidence base for the dashboard."
            />
            <div className="mb-5 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Full intake progress
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {answeredQuestionCount} / {totalFullIntakeQuestions} questions answered
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">Progress: {progress}%</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-foreground/75" style={{ width: `${progress}%` }} />
              </div>
              <button
                type="button"
                onClick={fillSampleAnswers}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground"
              >
                Fill sample answers
              </button>
            </div>

            <div className="space-y-4">
              {intakeGroups.map((group, index) => {
                const expanded = expandedGroupSet.has(group.title);
                const answeredInGroup = group.questions.filter((question) =>
                  String(fullIntakeAnswers[question.id] || "").trim(),
                ).length;
                const complete = answeredInGroup === group.questions.length;

                return (
                  <div key={group.title} className="overflow-hidden rounded-lg border border-border bg-card">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-5 p-5 text-left"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <Marker>{String(index + 1)}</Marker>
                        <div>
                          <h3 className="text-base font-semibold">{group.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {answeredInGroup} / {group.questions.length} complete
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Tag>{complete ? "Complete" : "In progress"}</Tag>
                        <span className="text-sm font-medium text-muted-foreground">{expanded ? "Close" : "Open"}</span>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="border-t border-border bg-background/50 p-5">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {group.questions.map((question) => (
                            <label key={question.id} className="rounded-md border border-border bg-background p-4">
                              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                Question {question.id}
                              </span>
                              <span className="mt-2 block min-h-10 text-sm font-medium leading-snug">
                                {question.text}
                              </span>
                              <textarea
                                value={fullIntakeAnswers[question.id] || ""}
                                onChange={(event) => updateFullIntakeAnswer(question.id, event.target.value)}
                                placeholder="Add your structural evidence..."
                                className="mt-3 h-24 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
            {!fullIntakeComplete ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Complete all intake questions to generate the full dashboard.
              </p>
            ) : null}
          </section>
        ) : null}

        {dashboardGenerated ? (
          <>
            <section id="full-dashboard" className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="Full Web Dashboard"
                title="A compact structural map of the decision."
                body="The dashboard keeps the core tension, trade-offs, risks, and conditions visual and scannable."
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

            <section className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="Detailed PDF Report"
                title="A richer written report for deeper review."
                body="A detailed report based on your full intake, designed for offline review and later reference."
              />
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="max-w-3xl text-sm leading-relaxed text-foreground">
                  The dashboard gives the structural map. The PDF report expands the reasoning behind it.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {detailedPdfSections.map((section, index) => (
                    <div key={section} className="rounded-md border border-border bg-background p-4">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-snug">{section}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    Open a dedicated report-only view with richer written interpretation, comparative analysis, and a
                    structured validation plan.
                  </p>
                  <button
                    type="button"
                    onClick={generateDetailedReport}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                  >
                    Open Detailed PDF Report
                  </button>
                </div>
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
                    : "Essential includes the dashboard and Detailed PDF Report. Executive adds report-based Q&A."
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
