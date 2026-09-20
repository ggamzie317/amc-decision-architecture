# AMC landing CTA verification

## Change and rationale

Tester feedback: the starting action was difficult to find. The home page used “Start Your AMC Case”, while the product landing used a disabled, faded “Start Free Preview” button above a less obvious consent checkbox.

Both entry pages now use a prominent blue “Start Free Preview” action, a directional arrow, a “Start here” label, and short seven-question / no-account helper copy. The secondary action is an underlined text link. The landing copy explains the self-guided decision tool and that live coaching or mentoring is not included.

The home CTA links directly to `/amc-web-mvp?start=preview`. Starting opens and focuses the existing storage-consent step. Its wording and opt-in requirement are preserved; questions and the existing `preview_started` event begin only after consent and “Continue to questions”. Reusing the hero CTA returns to the current preview instead of starting another journey. Research consent remains optional in the full intake.

## Verification

- `pnpm check`: passed.
- `pnpm build`: passed; Vite retains its warning about a JavaScript chunk over 500 kB.
- `pnpm exec vitest run --root .. manus-ui/tests`: 8 suites, 60 tests passed. Covers structural signals, product dashboard/report interpretation, customer language, Founder Ops lifecycle/JSONB, external evidence, and built-bundle privacy.
- `pnpm test:founder-ops-esm`: passed.
- `git diff --check`: passed.

Manually inspected browser screenshots at 1440 × 900 and 390 × 844:

- Home and product landing: primary CTA visible above the fold; secondary links reach the correct explanatory sections.
- Mobile primary target: 350 × 58 px, including Korean. Home CTA begins around y=331; product CTA around y=280 (English) / y=287 (Korean).
- Desktop primary target: 256 × 58 px. White text on #2448a0; visible keyboard focus and hover/active styling.
- Keyboard Enter opens the consent step and moves focus to it. The direct home entry link also focuses the step. Consent is unchecked initially; unchecking disables continuation; agreeing opens and focuses the seven-question preview.
- Production browser network capture: no AMC API requests before consent; continuing after consent sends `/api/amc/ops/track` (HTTP 200).
- Walked through preview generation → full intake → 29 answered questions and six existing selectors → dashboard → detailed report → back to dashboard. Optional research consent remained unchecked.
- No horizontal overflow in the checked home, landing, consent, intake, dashboard, or report views: document width equals viewport width.
- Founder admin still opens at its password gate. No new browser runtime errors on production entry/admin pages.

The browser walkthrough used synthetic answers. The full dashboard/report walkthrough ran on the dev server without its API, confirming the existing unavailable-evidence fallback. Production entry/consent checks ran against the local built server with database and external-provider credentials disabled. Live provider calls and production database persistence were not exercised; their existing automated regression tests passed.

## Existing report-pipeline failures

The separate Node report-pipeline suite ran 78 tests: 74 passed and 4 failed. All four failures reproduce against untouched `origin/main` (4ce58aa), in:

- `buildDecisionConditions`: weak/missing-signal fallback wording.
- `buildInternalStructuralSnapshot`: expected English heading versus Korean heading.
- `buildStrategicTemperament`: expected English heading versus Korean heading; fallback wording.

These files and their implementation dependencies are unchanged by this PR.

## Follow-up

Repeat a first-click usability check with a few new testers: ask them to start without instructions, then describe what they expect to receive. Use that feedback to assess discoverability and positioning before adding more interface elements.
