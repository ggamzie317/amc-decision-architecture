# AMC Premium Report v2 Spec

## Purpose

This document defines the English-first premium report v2 direction for AMC.

It is a design and content specification for future HTML/CSS or renderer implementation. It does not change runtime logic, payment, email, chatbot, intake, scoring, payload mapping, DOCX generation, or report computation.

## Product Role

The AMC report is a structural decision brief, not a recommendation engine.

The report should:

- clarify the decision structure
- identify where risk concentrates
- compare trade-offs across paths
- show the conditions under which commitment becomes more defensible
- preserve client agency

The report must not:

- decide for the client
- recommend a path
- imply a final answer
- use Go / No-Go framing
- use `Decision Verdict`
- use `Decision Gate`
- use coaching or motivational language

AMC does not decide. AMC does not recommend. AMC structures the decision so the client can see the pressure, risk, trade-offs, and commitment conditions more clearly.

## Language Strategy

Primary launch language is English-first global report.

The English report is the design baseline for structure, hierarchy, page rhythm, component behavior, and copy tone. Korean comes later as localization, not as the primary design baseline and not as a separate structural product.

Localization should preserve:

- message-first hierarchy
- premium strategy-consulting tone
- restrained diagnostic language
- client agency
- no recommendation posture
- no coaching or motivational posture

## Premium Design Direction

The report should feel like:

- premium strategy consulting brief
- McKinsey-simple
- message-first
- insight-driven
- clean, restrained, and PDF-ready
- visually calm but not flat
- structured enough to scan, rich enough to feel premium

The report should not feel like:

- plain memo
- academic paper
- SaaS dashboard
- coaching workbook
- motivational report
- generic AI-generated template
- decorative pitch deck

## Design Principles

- One message per page.
- The message headline dominates the section title.
- Each page follows: headline -> diagnostic visual -> reading -> implication.
- Use strong keyword hierarchy so the reader can scan the logic quickly.
- Use generous whitespace to create premium pacing.
- Use restrained contrast, not bright UI color.
- Build for PDF-ready layout from the beginning.
- Create simple but rich visual rhythm across the full report.
- Use visuals to clarify structure, not to decorate or gamify.
- Keep page density controlled: premium does not mean sparse, and diagnostic does not mean cluttered.

## Report Architecture

Premium Report v2 is an 8-page report. Each page should have a dominant message headline, one primary diagnostic visual, a concise reading, and an implication block.

### 1. Executive Diagnosis

Purpose: establish the main structural reading of the case in one page.

Message headline role: a conclusion-first structural sentence that names the central tension without deciding for the client.

Recommended visual structure: hero diagnosis block with two to four diagnostic chips underneath.

Required content blocks:

- case context line
- core structural reading
- highest-concentration risk
- main support factor
- commitment condition preview

Implication block: explain what becomes more defensible if the named conditions are validated.

Forbidden patterns:

- verdict-style label
- final answer language
- recommendation summary
- dashboard KPI cards
- large decorative hero art
- motivational opener

### 2. Decision Tension Map

Purpose: show the forces creating tension in the decision.

Message headline role: name the primary tension pattern, such as pull vs constraint, upside vs burden, or continuity vs transition.

Recommended visual structure: tension map with two or three opposing force groups connected by a central decision pressure line.

Required content blocks:

- current-path pressure
- transition-path pressure
- internal constraint
- external constraint
- tension reading

Implication block: explain which tension must be reduced, clarified, or validated before commitment becomes cleaner.

Forbidden patterns:

- pros-and-cons worksheet
- coaching reflection prompts
- motivational quadrant
- emotional scoring
- invented path labels

### 3. Comparative Decision Matrix

Purpose: compare paths without ranking them as best or worst.

Message headline role: state the most important difference between paths.

Recommended visual structure: table-first comparative matrix with rows for decision dimensions and columns for path options.

Required content blocks:

- option labels
- market or external signal row
- stability or support row
- fit or burden row
- upside/downside exposure row
- comparative reading

Implication block: explain what evidence would make one path structurally more supportable without telling the client which path to choose.

Forbidden patterns:

- winner/loser labels
- weighted ranking table
- final score totals
- bright dashboard scorecards
- best-choice language
- gamified comparison bars

### 4. Structural Risk Architecture

Purpose: identify where structural risk concentrates and how risk components interact.

Message headline role: name the risk concentration pattern and its consequence.

Recommended visual structure: risk architecture diagram with risk nodes, concentration markers, and support/constraint links.

Required content blocks:

- primary risk concentration
- secondary risk concentration
- stabilizing factor
- destabilizing factor
- risk reading

Implication block: explain what must be monitored or validated to reduce structural exposure.

Forbidden patterns:

- raw score machinery
- unexplained internal acronyms
- threat-color alarm design
- certainty language
- risk-as-fear framing

### 5. Career Value Structure

Purpose: show how each path preserves, strains, or trades off important career values.

Message headline role: state the value trade-off pattern.

Recommended visual structure: two-column value structure comparing Current Path and Transition Path.

Required content blocks:

- Current Path value preservation
- Current Path value strain
- Transition Path value preservation
- Transition Path value strain
- value reading

Implication block: explain which value trade-off needs conscious ownership for the decision to become more defensible.

Forbidden patterns:

- values worksheet
- personal mission statement style
- inspirational language
- moralized right/wrong framing
- invented values not supported by source material

### 6. Mobility & Translation Risk

Purpose: show how portable the client profile appears and where translation friction may occur.

Message headline role: state the main mobility condition or translation risk.

Recommended visual structure: translation ladder from current capability base to target path requirements, with friction points marked.

Required content blocks:

- mobility type
- portable strengths
- translation gaps
- credibility or market-readiness signals
- mobility reading

Implication block: explain what proof, positioning, or sequencing would reduce translation risk.

Forbidden patterns:

- job-search checklist
- generic career advice
- networking tips
- skill-gap course recommendations
- motivational transition framing

### 7. Validation Conditions

Purpose: define the conditions that would make commitment more structurally supportable.

Message headline role: state the commitment logic in conditional form.

Recommended visual structure: commitment condition panel with validation, readiness, support, commitment, and reassessment conditions.

Required content blocks:

- validation condition
- readiness condition
- support condition
- commitment condition
- reassessment trigger

Implication block: explain how these conditions protect agency by avoiding premature closure.

Forbidden patterns:

- Decision Gate language
- Go / No-Go language
- approval stamp design
- binary pass/fail decision graphic
- directive next-step instruction

### 8. Closing Structural Reading

Purpose: close the report by restating the structural reading and what remains to be validated.

Message headline role: concise final structural synthesis without recommendation posture.

Recommended visual structure: final structural reading block with one restrained summary panel and a short condition list.

Required content blocks:

- final structural reading
- risk concentration recap
- trade-off recap
- commitment condition recap
- agency-preserving close

Implication block: explain how the client can use the report as a decision structure, not as an outsourced answer.

Forbidden patterns:

- final recommendation
- motivational closing
- certainty claim
- best-path statement
- urgency pressure
- congratulatory coaching tone

## Reusable Visual Components

### Hero Diagnosis Block

Large first-page block that carries the main structural reading. It should combine one dominant message headline, a short context line, and a restrained diagnostic summary.

Use for: Executive Diagnosis and Closing Structural Reading.

Avoid: hero illustrations, marketing-style banners, decorative gradients, or verdict badges.

### Diagnostic Chip

Compact label-value component for restrained diagnostic signals. It should use short labels, controlled contrast, and text-first emphasis.

Use for: risk concentration, support factor, friction signal, validation status.

Avoid: gamified badges, bright status pills, trophy-like visuals, or unexplained scores.

### Tension Map

Diagram that shows opposing pressures and the central decision tension. It should make the structure legible without turning the page into a workshop canvas.

Use for: Decision Tension Map.

Avoid: brainstorming boards, sticky-note aesthetics, coaching prompts, or emotional self-assessment grids.

### Comparative Matrix

Table-first component that compares paths by dimension. It should privilege readability, alignment, and compact interpretation.

Use for: Comparative Decision Matrix and comparative versions of external context.

Avoid: rankings, total scores, winner labels, bright KPI tiles, or best-choice framing.

### Risk Architecture

Network or layered diagram that shows where risk concentrates and how risk is supported or amplified by related conditions.

Use for: Structural Risk Architecture.

Avoid: alarmist colors, threat dashboards, raw score formulas, or internal framework acronyms.

### Two-Column Value Structure

Side-by-side component for Current Path and Transition Path. It should show preservation and strain without ranking values.

Use for: Career Value Structure.

Avoid: pros-and-cons lists, moralized value hierarchy, or coaching workbook treatment.

### Translation Ladder

Stepwise component showing movement from current capability base to target path requirements, with friction and proof points marked.

Use for: Mobility & Translation Risk.

Avoid: generic career ladder visuals, motivational progress bars, or job-search checklist language.

### Commitment Condition Panel

Structured panel for validation, readiness, support, commitment, and reassessment conditions.

Use for: Validation Conditions.

Avoid: pass/fail gates, green/red decision stamps, Go / No-Go language, or directive instructions.

### Final Structural Reading Block

Closing component that restates the structural read and the conditions that matter most.

Use for: Closing Structural Reading.

Avoid: final recommendation, motivational sign-off, certainty language, or decision-for-client framing.

## Copy Style

Preferred language:

- appears
- suggests
- indicates
- reflects
- preserves
- increases
- reduces
- becomes more defensible if
- is constrained by
- is supported by

Preferred sentence posture:

- evidence-sensitive
- conditional
- diagnostic
- agency-preserving
- concise
- restrained

Example patterns:

- `The current path appears to preserve continuity, but it is constrained by limited expansion signal.`
- `The transition path becomes more defensible if proof of demand and execution capacity strengthens.`
- `The risk concentration suggests that timing and support conditions matter more than preference alone.`
- `The comparative structure indicates different burdens rather than a single obvious answer.`

Forbidden language:

- you should
- best choice
- my recommendation
- final recommendation
- decision verdict
- decision gate
- go / no-go
- guaranteed
- motivational slogans

Forbidden copy patterns:

- direct advice that tells the client what to do
- certainty claims that erase uncertainty
- motivational phrasing that substitutes encouragement for structure
- coaching prompts that turn the report into a workbook
- generic AI-style summaries that sound detached from the case
- hidden recommendation language framed as implication

## Forbidden Design Patterns

- plain memo layout with long uninterrupted text
- academic paper hierarchy
- SaaS dashboard page structure
- KPI-heavy scorecard treatment
- colorful status dashboards
- coaching workbook pages
- motivational poster composition
- generic AI-generated template aesthetics
- decorative icon systems
- heavy illustration
- gamified score visuals
- raw score machinery
- invented sections or invented scores
- binary decision stamps

## Implementation Boundary

This specification is for future HTML/CSS, Manus, or renderer implementation.

Do not implement the full renderer as part of this spec task. Do not modify runtime logic, payment, email, chatbot, intake, scoring, payload mapping, DOCX template behavior, or report generation code.

Future implementation should treat this document as the premium report design baseline and should validate output against:

- English-first global report direction
- 8-page architecture
- message-first hierarchy
- component guidance
- forbidden language
- forbidden design patterns
- AMC agency-preserving philosophy
