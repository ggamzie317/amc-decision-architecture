# AMC Web Funnel MVP Spec

## Purpose

This document defines the MVP funnel specification for AMC's web-first launch.

AMC has pivoted from a PDF-first premium report product to a web-first structural interpretation dashboard. The strategic benchmark context is defined in [amc_premium_web_benchmark_brief.md](amc_premium_web_benchmark_brief.md); this MVP spec translates that direction into a practical launch funnel.

This task is documentation only. Do not implement code from this document. Do not modify runtime logic, intake, scoring, payment, email, chatbot, PDF generation, payload, DOCX, or report-generation files.

## Product Definition

AMC is a web-based career decision structure dashboard.

AMC helps users see the structure behind a career decision:

- not as advice
- not as recommendation
- not as coaching
- but as a structured mirror of decision tension, risk, trade-offs, and commitment conditions

Core line:

`AMC sees structure.`

The MVP should preserve this distinction across every screen. It should clarify structure without implying that AMC chooses, recommends, or decides for the user.

## MVP User Flow

The MVP funnel runs in this order:

1. Landing Page
2. 7-question Free Preview Intake
3. Preview Dashboard
4. Payment / Unlock Page
5. 29-question Full Intake
6. Full Web Dashboard
7. PDF Download
8. Executive Report Q&A

The first MVP may use placeholders for payment and chatbot behavior. Placeholder states should still feel controlled and premium, not unfinished or temporary.

## 1. Landing Page

Purpose: introduce AMC, build trust, explain the product, and move users into the free preview.

Required content blocks:

- Hero headline
- Short sub-headline
- AMC philosophy
- Who this is for
- What the user gets
- Essential vs Executive preview
- Sample dashboard teaser
- CTA: `Start Free Structural Preview`

Hero message:

`AMC sees structure.`

Tone:

- premium
- calm
- private
- analytical
- structural

The landing page should make AMC feel like a private structural interpretation product, not a generic AI tool or motivational career service.

Avoid:

- generic AI tool language
- coaching-heavy claims
- motivational slogans
- `find your dream career` style copy
- enterprise HR software framing
- aggressive conversion pressure

## 2. 7-Question Free Preview Intake

Purpose: reduce friction and give the user a quick structural preview.

The preview intake should be short enough to complete quickly while still capturing the minimum viable decision structure.

Define these 7 questions:

1. What career decision are you facing now?
2. What is Option A?
3. What is Option B?
4. What is pulling you toward change?
5. What is holding you back?
6. What is your biggest risk, fear, or uncertainty?
7. What condition would make deeper commitment more defensible?

Clarification:

The 7-question preview is not the full analysis. It is designed to generate a credible first structural signal and show users how AMC frames decision tension.

The preview intake should not:

- feel like a personality test
- feel like a coaching worksheet
- imply that the full report can be generated from the preview alone
- ask for unnecessary detail before trust is established

## 3. Preview Dashboard

Purpose: show enough value to build trust and purchase intent without delivering the full report.

Free preview should show:

- Core Decision Type
- Primary Structural Tension
- Option A / Option B quick comparison
- Initial Risk Signal
- Locked Full Report Sections

Locked sections should include:

- External Comparative Snapshot
- Internal Structural Snapshot
- Structural Risk Diagnosis
- Decision Conditions
- PDF Download
- Executive Report Q&A

Use wording:

- `Locked Full Report Sections`
- `Unlock Full Career Structure Report`

The preview dashboard should feel useful and credible, but it should clearly remain a preview.

Avoid:

- manipulative blur or mosaic gimmicks
- fake scarcity
- bait-and-switch tone
- implying that the full report is already generated before payment
- showing complete diagnosis
- exposing raw score machinery

## 4. Payment / Unlock Page

Purpose: convert users from free preview to paid full report.

Define two tiers.

### Essential

- Full Web Dashboard
- PDF Download

### Executive

- Full Web Dashboard
- PDF Download
- 1-Day Report Q&A

Clarification:

Payment integration can be a placeholder in MVP. Do not implement real payment in this task.

The page should explain:

`The full report requires a detailed 29-question intake. More detailed answers create a more useful structural report.`

The unlock page should clarify that payment unlocks the deeper intake and full web dashboard, not a pre-generated hidden report.

Avoid:

- real payment implementation in this documentation task
- high-pressure upgrade language
- implying Executive changes the report logic
- promising recommendation or coaching outcomes

## 5. 29-Question Full Intake

Purpose: collect deeper data after payment for full dashboard generation.

AMC already has a 29-question full intake asset. This MVP spec should not rewrite all 29 questions unless they already exist in the repo.

Role of the 29-question intake:

- richer context
- better structural diagnosis
- better comparison between options
- better risk reading
- better decision conditions

The full intake should support:

- personal background
- current situation
- options being compared
- external pressure
- internal readiness
- safety margin
- support system
- constraints
- timing
- decision conditions

Relationship to the preview:

- The 7-question preview captures the first structural signal.
- The 29-question intake deepens the evidence base.
- The full dashboard should be generated from the deeper intake, not from the preview alone.

Avoid:

- rewriting the 29-question intake in this spec
- modifying intake schema or runtime intake logic
- turning the intake into coaching prompts
- adding complexity that does not improve structural interpretation

## 6. Full Web Dashboard

Purpose: deliver the paid AMC product.

MVP dashboard sections:

1. Structural Overview
2. External Comparative Snapshot
3. Internal Structural Snapshot
4. Structural Risk Diagnosis
5. Decision Conditions

The dashboard should be web-first, card-based, structured, and PDF-friendly. It should not feel like a plain document converted into a web page.

### Structural Overview

Purpose: orient the user to the overall decision structure.

What the user sees:

- core decision type
- primary tension
- structural reading
- key condition preview

What it should not do:

- declare a verdict
- recommend a path
- imply one option is the obvious answer

Visual treatment:

- prominent message-first header
- restrained summary cards
- clear hierarchy between headline, reading, and implication

### External Comparative Snapshot

Purpose: compare Option A and Option B using external and contextual signals.

What the user sees:

- restrained matrix or table
- Option A / Option B comparison
- external pressure or market signal
- comparative reading

What it should not do:

- rank options as winner and loser
- use best-choice language
- create fake precision

Visual treatment:

- table-first layout
- compact rows
- restrained contrast
- short reading beneath the table

### Internal Structural Snapshot

Purpose: show the user's internal readiness and support conditions.

What the user sees:

- readiness signal
- safety margin
- support system
- strain
- execution load

What it should not do:

- turn into self-help language
- treat readiness as moral strength or weakness
- over-personalize beyond the evidence provided

Visual treatment:

- structured cards or grouped chips
- clear separation between support and strain
- calm, analytical labels

### Structural Risk Diagnosis

Purpose: show where risk concentrates and how it may distort the decision.

What the user sees:

- primary risk
- secondary risk
- distortion risk
- risk reading
- implication

What it should not do:

- expose internal acronyms
- show raw score machinery
- use alarmist design
- imply certainty

Visual treatment:

- risk architecture card
- clear primary/secondary hierarchy
- restrained signal markers
- implication block beneath the diagnosis

### Decision Conditions

Purpose: show what conditions make deeper commitment more structurally defensible.

What the user sees:

- validation condition
- readiness condition
- support condition
- commitment condition
- reassessment trigger

What it should not do:

- use `Decision Gate`
- use Go / No-Go framing
- tell the user what to do
- create a pass/fail decision stamp

Visual treatment:

- condition panel
- numbered or grouped conditions
- direct relationship between evidence and commitment support

### Full Dashboard Forbidden Language

Do not use:

- recommendation language
- Go / No-Go
- `Decision Verdict`
- `Decision Gate`
- best choice
- you should

## 7. PDF Download

Purpose: allow the user to save the web report.

MVP implementation direction:

Use print/save as PDF first.

Do not require:

- DOCX generation
- complex PDF templates
- advanced PDF renderer
- email attachment workflow

PDF is secondary. The web dashboard is the primary product.

The PDF should preserve the dashboard's structure and readability, but it should not drive the MVP architecture.

## 8. Executive Report Q&A

Purpose: provide report-based Q&A for Executive users.

Clarification:

This is not required for the first static prototype. It may be represented as a locked or placeholder module.

When implemented later, it should:

- answer based on the user's report
- explain structural readings
- clarify risks and decision conditions
- avoid giving direct recommendations

It should not:

- act as a general career coach
- tell the user what to do
- make guarantees
- answer outside the report scope without warning
- create new diagnosis that is not grounded in the report

## MVP Scope

MVP should include:

- Landing page
- 7-question preview intake
- Preview dashboard
- Locked full report cards
- Payment placeholder
- Full dashboard sample
- Print / Save as PDF button
- Executive Q&A placeholder

MVP should defer:

- real payment integration
- login/account system
- real chatbot
- complex PDF generation
- multilingual localization
- automated email delivery
- Vertex or complex backend
- full 8-section report
- production security/auth

MVP success means a user can understand AMC, complete the preview, see credible structural value, understand the paid unlock, complete or view the full-intake path, see a full dashboard sample, and save the report as a PDF.

## Implementation Boundary

This task only creates the spec document.

Do not modify:

- runtime code
- app routes
- API handlers
- intake schema
- scoring logic
- report generation logic
- DOCX/PDF generation
- payment logic
- chatbot logic
- email logic

No runtime code changes are required or authorized by this spec. Implementation should happen in a separate task with explicit scope, branch, acceptance checks, and review.
