const fitFor = [
  "Experienced professionals at meaningful crossroads",
  "Decisions with non-obvious trade-offs",
  "People who want structure before action",
] as const;

const fitNotFor = [
  "Instant-answer expectations",
  "Open-ended coaching expectations",
  "Generic motivational support requests",
] as const;

const reportOutline = [
  "Current Structural Posture",
  "Why This Posture",
  "Decision Structure / FIFWM",
  "What You May Be Missing",
  "Changing Plays",
  "Safety Margin — Room to Be Wrong",
  "Decision Switches",
  "Next-Step Experiment",
] as const;

const howItWorks = [
  {
    title: "Submit Your Case",
    body: "You provide your decision context and constraints.",
  },
  {
    title: "Structural Reading",
    body: "AMC reads burden, fit, risk, and defensibility.",
  },
  {
    title: "Receive Your Report",
    body: "You get a structured written output.",
  },
  {
    title: "Run the Next Experiment",
    body: "Test the evidence that would change the current structural posture before deeper commitment.",
  },
] as const;

const faqs = [
  {
    q: "Is AMC coaching?",
    a: "No. AMC is a report-led career architecture service. It is designed to clarify structural conditions before commitment.",
  },
  {
    q: "Will AMC tell me what to do?",
    a: "AMC establishes a clear, non-prescriptive Current Structural Posture and shows what evidence would justify changing it.",
  },
  {
    q: "What do I receive?",
    a: "You receive a structured written report centered on structural exposure, value logic, mobility logic, temperament, and commitment conditions.",
  },
  {
    q: "Is AMC a generic AI chat tool?",
    a: "No. AMC applies a consistent structural decision framework and delivers one Full Structural Report.",
  },
  {
    q: "Do I need an account before I begin?",
    a: "No account is required to begin. Your case is handled as a private submission for report generation and related follow-up only.",
  },
] as const;

const differences = [
  "See the structure",
  "Find what you may be missing",
  "Change what can be changed",
  "Protect room to try again",
  "Know what would change the posture",
  "Test before deeper commitment",
] as const;

const reportCoverage = [
  {
    title: "Risk",
    body: "External and internal structural exposure",
  },
  {
    title: "Fit",
    body: "Path alignment and operating posture",
  },
  {
    title: "Burden",
    body: "Transition load and execution pressure",
  },
  {
    title: "Trade-offs",
    body: "Value logic across competing priorities",
  },
  {
    title: "Mobility",
    body: "Portability, timing, and conversion friction",
  },
  {
    title: "Decision Switches",
    body: "Observable evidence that would change the posture",
  },
] as const;

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        <section className="py-16 lg:py-24 border-b border-border" id="top">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-start">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-muted-foreground mb-4">All of My Career</p>
              <h1 className="text-4xl sm:text-5xl tracking-tight font-semibold leading-tight mb-6">
                A private career architecture service for serious career crossroads.
              </h1>
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-3">
                You receive a structured written report.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                We do not look at decisions first. We look at structure first. AMC sees structure.
              </p>
              <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground mb-8">Tip in. Decide. Value up.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/amc-web-mvp"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  Start Your AMC Case
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
                >
                  How AMC Works
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                No account required. Your case is handled as a private submission for report delivery and related follow-up.
              </p>
            </div>
            <div className="border border-border rounded-lg bg-card p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">Delivery</p>
              <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                AMC is delivered as a structured report.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                One Full Structural Report combines the dashboard, deeper written interpretation, and validation plan.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="report-preview">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">What You Receive</h2>
          <p className="text-base text-foreground/90 mb-2">AMC delivers a structured report as the core product.</p>
          <p className="text-sm text-muted-foreground mb-8">
            We help you see the structure behind today’s decision — including what you may be missing — so you can make a better-supported decision and preserve the capacity to change again.
          </p>
          <div className="border border-border rounded-lg bg-card p-7 sm:p-8 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium tracking-wide">AMC Report Outline</p>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Structured Deliverable</p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {reportOutline.map((item) => (
                <li key={item} className="text-sm text-foreground/90 leading-relaxed flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="how-it-works">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">How AMC Works</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-0">
            {howItWorks.map((step, idx) => (
              <div
                key={step.title}
                className={`lg:px-5 ${idx < howItWorks.length - 1 ? "lg:border-r lg:border-border" : ""}`}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-3">{String(idx + 1).padStart(2, "0")}</p>
                <p className="text-sm font-medium mb-2">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="report-covers">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">What the Report Covers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportCoverage.map((item) => (
              <div key={item.title} className="border border-border rounded-lg p-5 bg-card">
                <p className="text-sm font-medium mb-2">{item.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="formats">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">One Full Structural Report</h2>
          <p className="text-sm text-muted-foreground mb-8">
            AMC uses one report format so the dashboard and detailed written interpretation represent the same intelligence.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-3">AMC Full Structural Report</p>
            <p className="text-lg font-medium mb-2">Full Dashboard + Detailed PDF Report</p>
            <p className="text-sm text-muted-foreground">Full Structural Dashboard + Detailed Report, built from the same FIFWM intelligence.</p>
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="fit">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">Who AMC Is For / Not For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-6 bg-card">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">For</p>
              <ul className="space-y-3">
                {fitFor.map((item) => (
                  <li key={item} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border rounded-lg p-6 bg-card">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-4">Not For</p>
              <ul className="space-y-3">
                {fitNotFor.map((item) => (
                  <li key={item} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="difference">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">What Makes AMC Different</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {differences.map((item) => (
              <div key={item} className="border border-border rounded-lg p-5 bg-card">
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border" id="faq">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">FAQ</h2>

          <div className="hidden md:block border border-border rounded-lg overflow-hidden">
            {faqs.map((item, idx) => (
              <div
                key={item.q}
                className={`px-6 py-5 bg-card ${idx < faqs.length - 1 ? "border-b border-border" : ""}`}
              >
                <p className="text-sm font-medium mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="md:hidden border border-border rounded-lg overflow-hidden bg-card">
            {faqs.map((item, idx) => (
              <details key={item.q} className={idx < faqs.length - 1 ? "border-b border-border" : ""}>
                <summary className="list-none cursor-pointer px-5 py-4 text-sm font-medium">
                  {item.q}
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="py-16 lg:py-20" id="start">
          <div className="border border-border rounded-lg bg-card p-8 sm:p-10 text-center">
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">
              If the decision is meaningful, read the structure first.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="/amc-web-mvp"
                className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
              >
                Start Your AMC Case
              </a>
              <a
                href="#formats"
                className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
              >
                See the Full Structural Report
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
