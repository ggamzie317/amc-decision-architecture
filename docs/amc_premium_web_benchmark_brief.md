# AMC Premium Web Benchmark Brief

## Purpose

This brief defines the premium web benchmark and structure direction for AMC's web-first launch.

AMC is pivoting from a PDF-first report product to a web-based career decision structure dashboard. The customer experience should feel like a premium, private, structural interpretation experience, not a generic AI report service.

This is a documentation and product-structure brief only. Do not implement code from this document. Do not modify runtime logic, intake, scoring, payment, email, chatbot, PDF generation, payload mapping, or report generation files as part of this task.

## Product Pivot

### From

PDF-first premium report delivered by email.

### To

Web-first structural interpretation dashboard.

### Core Product Definition

AMC is a web-based career decision structure dashboard.

Users enter their situation, see a free structural preview, unlock the full web report, download a PDF, and optionally use a report-based chatbot in the Executive tier.

### PDF Role

PDF is a secondary downloadable output, not the primary product.

Initial implementation should prefer web print / save as PDF before complex PDF generation. PDF should preserve the web report's structural hierarchy rather than define the product experience.

### Email Role

Email is for receipt, report link, and backup delivery only.

Email should not be treated as the primary report surface. It supports access, confirmation, and backup delivery.

### Chatbot Role

The chatbot is an Executive-only add-on, not MVP core.

The chatbot should be report-based Q&A only. It should not become open-ended coaching, general career advice, or a recommendation engine.

## Benchmark References

Use these references as strategic inspiration, not as products to copy.

### BetterUp

Benchmark lesson: BetterUp creates trust through a strong hero message, platform framing, AI + human + intelligence positioning, proof-oriented language, and enterprise-grade credibility.

AMC should learn:

- strong hero headline
- premium platform feel
- trust-building structure
- outcome/proof language
- clear separation of product layers

AMC should avoid:

- becoming enterprise HR software
- looking like a corporate coaching platform
- overclaiming measurable outcomes

### 80,000 Hours

Benchmark lesson: 80,000 Hours treats career decisions as serious, long-term, structured decisions. It uses guide-like content, deep framing, and clear intellectual credibility.

AMC should learn:

- serious career-decision tone
- guide-like trust building
- long-term decision framing
- clear problem statement before CTA

AMC should avoid:

- becoming a free content library
- becoming too academic
- overloading the landing page with long essays

### Gallup CliftonStrengths

Benchmark lesson: CliftonStrengths uses a clear assessment-to-results-to-application flow.

AMC should learn:

- assessment first
- personalized results second
- application or next step third
- sample report or result preview to build purchase confidence

AMC should avoid:

- becoming a personality test
- using generic strengths language
- giving motivational or self-help outputs

### Previous Manus AMC Report

Benchmark lesson: the previous Manus report is the internal visual reference for premium report cards, section rhythm, calm styling, and structured dashboard feel.

AMC should learn:

- card-based report sections
- premium spacing
- restrained visual hierarchy
- structured interpretation blocks
- scored vs non-scored layer separation where useful

AMC should avoid:

- old internal terms
- visible `FIFWM` or raw scoring language
- overcomplicated 8-section report at MVP stage
- document-like PDF layout

## AMC Premium Web Principles

- Web dashboard first, PDF second.
- Show structure, do not recommend.
- Preview before payment.
- Full intake after payment.
- Full dashboard after detailed intake.
- Executive chatbot only after full report.
- Keep tooling minimal.
- Launch English-first for a global audience.
- Treat Korean as later localization, not the primary design baseline.

Tone should be:

- premium
- calm
- private
- analytical
- structural
- restrained
- trust-building

Tone should not be:

- motivational
- coaching-heavy
- SaaS-generic
- corporate HR-platform-like
- academic
- over-explanatory
- manipulative

## Proposed Web Funnel

### 1. Landing Page

Purpose: introduce AMC, brand, philosophy, and value.

Core message: AMC sees structure.

Primary CTA: Start a free structural preview.

Landing page should establish:

- AMC as a premium structural interpretation experience
- the problem of high-stakes career decisions
- the difference between structure and recommendation
- the free preview path
- the paid full dashboard path
- the Executive report-Q&A add-on as optional

Avoid:

- generic AI report positioning
- coaching-program framing
- long academic essays above the CTA
- enterprise HR software cues
- aggressive conversion pressure

### 2. 7-Question Free Preview Intake

Purpose: reduce entry friction and let users quickly experience AMC value.

Preview questions should capture:

- current decision
- Option A
- Option B
- pull toward change
- constraint or hesitation
- main risk or fear
- condition that would make commitment more defensible

The preview intake should feel fast, private, and serious. It should not feel like a personality quiz, lead magnet, or coaching worksheet.

### 3. Preview Dashboard

Purpose: give a credible free value signal before purchase.

Show:

- Core Decision Type
- Primary Structural Tension
- Option A / Option B quick comparison
- Initial Risk Signal
- Locked Full Report Sections

Do not show:

- full analysis
- complete structural diagnosis
- downloadable PDF
- chatbot
- invented precision
- raw score machinery

Preview dashboard should make the paid product feel concrete without pretending to be the full report.

### 4. Payment / Unlock Page

Purpose: convert from preview to full report.

Essential includes:

- Full Web Dashboard
- PDF Download

Executive includes:

- Full Web Dashboard
- PDF Download
- 1-Day Report Q&A

Use wording:

- `Unlock Full Career Structure Report`
- `Full Web Dashboard`
- `PDF Download`
- `1-Day Report Q&A`

Avoid:

- fake scarcity
- aggressive blur or mosaic gimmicks
- manipulative upgrade language
- recommendation promises
- coaching promises

### 5. 29-Question Full Intake

Purpose: collect deeper data after payment for the full dashboard.

Explain clearly: A detailed intake creates a more useful structural report.

The full intake should deepen:

- decision context
- path definitions
- external pressure
- internal constraints
- value trade-offs
- mobility and translation risk
- support/readiness conditions

Avoid:

- making the intake feel like a clinical assessment
- adding unnecessary complexity before the user understands why it matters
- turning the flow into a coaching questionnaire

### 6. Full Web Dashboard

Purpose: deliver the paid product.

MVP sections:

- Structural Overview
- External Comparative Snapshot
- Internal Structural Snapshot
- Structural Risk Diagnosis
- Decision Conditions

Dashboard should emphasize:

- card-based structure
- clear section rhythm
- message-first headings
- restrained visuals
- PDF-friendly layout
- separation between scored and non-scored layers where useful

Dashboard should avoid:

- generic SaaS analytics layout
- KPI-heavy scorecard treatment
- gamified scores
- visible internal terms
- raw scoring machinery
- recommendation framing

### 7. PDF Download

Purpose: allow the user to save or share the result.

Initial implementation direction: use web print / save as PDF first. Do not build complex PDF generation in MVP.

PDF should be treated as a portable capture of the web dashboard, not the primary product surface.

### 8. Executive Chatbot

Purpose: report-based Q&A for Executive users only.

Executive chatbot should:

- answer from the report
- clarify structural readings
- explain terms and conditions
- help the user interpret trade-offs already shown in the dashboard

Executive chatbot should not:

- recommend a path
- decide for the client
- become general coaching
- create new analysis outside the report
- replace the full dashboard

This can be deferred from MVP if needed.

## Free Preview vs Paid Full Report

### Free Preview

Free preview includes:

- quick structural reading
- initial tension
- simple Option A / Option B comparison
- one initial risk signal
- locked cards showing what the full report contains

Free preview should create trust by showing enough structure to prove the product's value.

Free preview should not:

- reveal the full diagnosis
- pretend to be comprehensive
- include PDF download
- include chatbot access
- create fake urgency
- use bait-and-switch tone

### Paid Full Report

Paid full report includes:

- full 29-question analysis
- complete web dashboard
- full section details
- PDF download
- optional Executive Q&A

Use wording:

- `Locked Full Report Sections`
- `Unlock Full Career Structure Report`

Avoid:

- bait-and-switch tone
- fake scarcity
- aggressive blur or mosaic gimmicks
- manipulative language
- overstated certainty
- implied recommendation promises

## MVP Scope

MVP should include:

- Landing page
- 7-question preview intake
- Preview dashboard
- Locked full report cards
- Payment placeholder
- Full dashboard sample
- Print / Save as PDF button

MVP should defer:

- login
- real payment integration
- real chatbot
- complex PDF generation
- multilingual localization
- automated email delivery
- Vertex or complex backend
- full 8-section report

MVP success means the user can understand the product, experience credible structural preview value, unlock a clearly differentiated full dashboard, and save the result as a PDF.

## Implementation Direction

Preferred implementation direction:

- Next.js / Vercel
- card-based layout
- restrained typography
- structured dashboard sections
- static prototype first
- print-to-PDF first
- API/chatbot later

Use the previous Manus React report as visual/code reference only. Do not copy it blindly. Do not preserve obsolete customer-facing terminology.

Do not implement this direction in this documentation task. This brief is intended to guide a later prototype or implementation task.

## Product Guardrails

AMC must not be launched as:

- a generic AI report service
- a personality test
- a coaching workbook
- a motivational career product
- an enterprise HR platform
- a SaaS analytics dashboard
- a PDF attachment business with a web wrapper

AMC should launch as:

- a premium private career-decision structure dashboard
- a web-first interpretation experience
- an agency-preserving decision clarification product
- a product that helps users see trade-offs, risk concentration, and commitment conditions

## Runtime Boundary

This task is documentation only.

Do not modify:

- runtime code
- intake logic
- scoring logic
- payment files
- email files
- chatbot files
- PDF generation files
- payload mapping
- report generation logic
- customer-facing UI code

Future implementation should use this brief to guide product structure, visual hierarchy, and funnel sequencing. It should not treat this document as approval to change backend behavior or launch-surface logic without a separate implementation task.
