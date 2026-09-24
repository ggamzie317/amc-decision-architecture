# Task 057 — Korean typography and line wrapping

Base: `86cb7f44797edb4a104d2174697eb038859fccd9` (`main`, including merged PR #88).
Branch: `codex/task-057-korean-typography-polish`.
Verified: 2026-09-24. Local synthetic data only; no Production deployment.

## Findings

- Korean customer shells, headings, and report text used `overflow-wrap: anywhere`. In the 390px report, the automatic comparison-table layout squeezed the structural-reading cells to 59px including padding. Browser text ranges found 22 Korean words split across lines, including `안정성을`, `보호합니다`, and `가능성을`. The Dashboard did not reproduce this defect with the same inputs. `anywhere` and `break-word` both permit emergency breaks; their intrinsic-width behavior differs, so changing that property alone is insufficient. See the [MDN overflow-wrap reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap).
- Korean headings used a 1.25 line height, and the report executive message used 1.18. Translated labels retained English uppercase/tracking utilities, including 0.12–0.18em spacing. The shared body also applied negative tracking.
- The mobile report cover reserved 31% for decoration and limited text containers to 64%, unnecessarily narrowing Korean headings and metadata.
- Report navigation and Print/Save buttons were fixed at 40px, below the requested 44px touch target. Korean input areas used fixed heights and disabled resizing.
- A4 printing fell below the desktop grid breakpoint, stacking executive-summary cards into a nearly empty continuation page. Large detail sections were kept together as whole units, and zero page margins let continuation content approach paper edges.

## Changes and scope

All typography and responsive overrides require a Korean AMC customer shell. Founder Ops, the English type scale, and every font-size declaration remain unchanged.

- Use `keep-all`, `break-word`, and `line-break: strict`; reset Korean tracking and uppercase utilities. Headings use 1.35–1.4 line height. Supported browsers balance headings and apply pretty wrapping to prose.
- Allow grid/flex content to shrink inside its track, while preserving the language control's width. Cards retain content-driven heights.
- Keep action buttons multiline and at least 44px high. Preserve the primary CTA's existing larger target and structure. Textareas can resize vertically and grow with content where `field-sizing` is supported; other browsers retain native scrolling and manual resizing.
- Give the Korean mobile report cover its full text width. Keep desktop/print decoration.
- Fix report table column sizing. Below 768px, the Korean table has a 40rem readable width inside a named, keyboard-focusable horizontal scroll region. The document itself never scrolls horizontally. Print uses the full-width table without that screen minimum or clipping wrapper.
- Give Korean print pages repeated 12mm vertical margins, with a full-bleed first-page cover. Keep summary cards paired on A4. Let long detail sections paginate while keeping individual plays/definition pairs together; keep headings with following content and use three-line widow/orphan control. No font size was reduced.

Only `index.css` and the report table wrapper in `AmcWebMvp.tsx` change customer code. `ProductApplicationDashboard`, `ProductApplicationReport`, Executive Decision Map, Safety Margin, Changing, Decision Switches, and timeline components receive the scoped CSS without changes to their data or rendering logic.

## Browser and print evidence

Chromium on macOS; the built application was served on loopback with the real handlers, an isolated `MemoryFounderOpsStore`, and no provider key. No historical customer data, Production writes, or live provider requests were used. The normal customer journey was exercised without `?qa=1`.

The input case compares retaining a Seoul education role with validating a Busan career-education business. Both option labels are long Korean phrases; constraints include parents' medical visits, a child's school term, a spouse's workplace, household runway, and paid-demand validation. All seven Preview answers, all 29 full-intake answers, and all six structured selections were entered through the UI.

Separate visual-only stress fixtures placed longer Korean Changing titles/descriptions, Decision Switches, and Safety Margin explanations in the rendered components. These were temporary DOM text replacements for layout testing, not changes to product intelligence or stored report data.

| Check | 390 | 430 | 768 | 1024 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Korean entry, Preview, full intake | PASS | PASS | PASS | PASS | PASS |
| Dashboard map, A/tension/B, missing point, Safety Margin | PASS | PASS | PASS | PASS | PASS |
| Changing, IF/THEN, 30/60/90 timeline | PASS | PASS | PASS | PASS | PASS |
| Detailed Report, cover, chips, risks, comparison table | PASS | PASS | PASS | PASS | PASS |
| Long-text visual stress fixtures | PASS | PASS | PASS | PASS | PASS |
| English baseline comparison | PASS | PASS | PASS | PASS | PASS |

- No page-level horizontal overflow, split Korean words, or sub-44px visible Korean buttons in the tested states. The mobile report table is an intentional internal scroll region; its last column was verified accessible. Desktop timeline arrows intentionally extend into the gaps between cards and do not overflow the page.
- Visually reviewed mobile/desktop component screenshots and all rendered Korean A4 pages. Normal and stress reports each produce 15 pages, with no blank pages or glyphs outside page bounds. The normal baseline produced 17 pages. The executive summary now fits one page. Print/Save invokes print once, and Back to Dashboard returns successfully.
- English screenshots and element geometry are identical to the baseline for all 25 comparisons (five stages × five widths). Existing English mobile table clipping and 40px report controls reproduce on the baseline and were kept outside this Korean-only change.
- No browser application errors. Safari and Firefox were not separately exercised. `text-wrap` and `field-sizing` enhancements are guarded by `@supports`.

Screenshots, viewport measurements, PDFs, and local QA scripts are in `/tmp/amc-task057/`; these synthetic review artifacts are not shipped in the public bundle.

## Automated validation

- `pnpm --dir manus-ui build`: PASS (existing Vite chunk-size advisory).
- `pnpm --dir manus-ui check`: PASS.
- Customer-language firewall: 3/3; public-bundle privacy: 2/2; product application: 22/22; current-web structural signals: 7/7.
- External evidence: 5/5; Founder Ops: 11/11; JSONB: 3/3; lifecycle: 8/8; Agent API: 25/25; Launch Ops: 14/14. Total: 100/100 tests.
- Founder Ops ESM import smoke: PASS.
- `git diff --check`: PASS.

No changes to questions, decision/report intelligence, Founder Ops, Perplexity, pricing, CTA structure, consent, persistence, or launch access. No Production deployment.
