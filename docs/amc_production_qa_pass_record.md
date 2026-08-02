# AMC Production QA Pass Record

This document records the production QA status of AMC Web MVP before controlled soft launch. It separates verified items, pending checks, known limitations, and GO / HOLD criteria.

This is not a marketing document. It is an internal launch-readiness record.

## Current Product Flow

```text
User Intake
→ Internal AMC Analysis
→ External Evidence Snapshot
→ Full Web Dashboard
→ Premium Report
→ Executive Report Q&A
→ Production QA Diagnostics
```

Internal server-side endpoints:

- `POST /api/amc/external-snapshot`
- `POST /api/amc/report-qa`

## Current Merged Tasks

| Task | Status | Purpose |
| --- | --- | --- |
| 045A | Merged | External Intelligence Layer audit |
| 045B | Merged | Mock External Snapshot integration |
| 045C | Merged | Live External Snapshot API path |
| 045D | Merged | External Evidence presentation refinement |
| 046 | Merged | Executive Report Q&A MVP |
| 046B | Merged | Server-side OpenAI Report Q&A API path |
| 047A | Merged | Vercel environment and production QA runbook |
| 047B | Merged | QA-only Production API Diagnostics panel |

## Production Routes

Normal user route:

- `/amc-web-mvp`

Internal QA route:

- `/amc-web-mvp?qa=1`

Route rules:

- The normal route may be shared with external testers after QA pass.
- The QA route is internal only.
- The QA route must not be shared with external testers.
- The QA route must not be linked from public copy.

## Environment Variable Status

| Variable | Purpose | Required for | Status |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Server-side Executive Report Q&A | API-assisted Q&A | PENDING |
| `PERPLEXITY_API_KEY` | Server-side External Evidence Snapshot | Live external evidence | PENDING |
| `PPLX_API_KEY` | Fallback Perplexity key name if supported | Live external evidence | PENDING |

Real values must never be committed or displayed. Variables should be configured only in Vercel Project Settings or a secure local environment.

## Production QA Checklist

All statuses remain `PENDING` until the corresponding check has been executed against production and its result has been recorded.

| Area | Check | Status | Notes |
| --- | --- | --- | --- |
| Normal Route | `/amc-web-mvp` loads | PENDING | Verify on production. |
| Normal Route | QA controls hidden | PENDING | Verify no internal QA controls appear. |
| Normal Route | Production QA Diagnostics hidden | PENDING | Verify the diagnostics panel is not rendered. |
| QA Route | `/amc-web-mvp?qa=1` loads | PENDING | Verify on production. |
| QA Route | QA presets visible | PENDING | Verify internal preset controls appear. |
| QA Route | QA validation visible | PENDING | Verify validation status appears as designed. |
| QA Route | Production QA Diagnostics visible | PENDING | Verify the diagnostics panel is rendered. |
| Core Flow | Landing page loads | PENDING | Verify normal production entry. |
| Core Flow | EN/KR toggle works | PENDING | Verify language switching and state preservation. |
| Core Flow | Free Preview works | PENDING | Complete the preview flow. |
| Core Flow | Full Intake works | PENDING | Complete all required intake fields. |
| Core Flow | Full Dashboard generates | PENDING | Generate and inspect the full dashboard. |
| Core Flow | External Evidence Snapshot appears | PENDING | Record whether fallback or live evidence appears. |
| Core Flow | Premium Report opens | PENDING | Open the report from the dashboard. |
| Core Flow | Executive Report Q&A appears | PENDING | Verify the Q&A interface is available. |
| Core Flow | Suggested Q&A works | PENDING | Run at least one suggested question. |
| Core Flow | Custom Q&A works | PENDING | Run a report-grounded custom question. |
| Core Flow | Clear chat works | PENDING | Clear the current conversation and verify reset. |
| Diagnostics | External Evidence API diagnostic runs | PENDING | Run from the internal QA route. |
| Diagnostics | External Evidence fallback/live status recorded | PENDING | Record the observed non-sensitive status. |
| Diagnostics | Executive Q&A API diagnostic runs | PENDING | Run from the internal QA route. |
| Diagnostics | Executive Q&A fallback/API-assisted status recorded | PENDING | Record the observed non-sensitive status. |
| QA Presets | Entrepreneurship preset: `29 / 29`, `PASS` | PENDING | Confirm expected completion and validation result in production. |
| QA Presets | MBA / EMBA / PhD Decision preset: `29 / 29`, `PASS` | PENDING | Confirm expected completion and validation result in production. |
| QA Presets | Family Constraint-heavy Decision preset: `29 / 29`, `PASS` | PENDING | Confirm expected completion and validation result in production. |
| Technical | Desktop layout works | PENDING | Verify the complete flow at desktop width. |
| Technical | 390px mobile layout works | PENDING | Verify the complete flow at 390px width. |
| Technical | No horizontal overflow | PENDING | Check normal and QA routes. |
| Technical | Console clean | PENDING | Record any warnings or errors. |
| Technical | No secrets exposed in browser source, console, or network response | PENDING | Inspect without recording secret values. |

## Fallback Acceptance Rule

During controlled soft launch preparation, fallback is acceptable if:

- API keys are not configured yet.
- The Dashboard still works.
- The Premium Report still works.
- Executive Q&A still works with local fallback.
- User-facing copy does not claim live or API-assisted mode.

Fallback is not acceptable if:

- The Dashboard breaks.
- The Premium Report breaks.
- Executive Q&A breaks.
- User-facing copy overstates live evidence.
- API failures expose technical or secret details.

## GO Criteria

GO for controlled external tester sharing only when:

- The normal production route works end to end.
- QA tools are hidden on the normal route.
- The internal QA route works.
- The core flow works.
- External Evidence appears.
- The Premium Report opens.
- Executive Q&A works.
- Fallback behavior is acceptable or live keys are configured.
- No secrets are exposed.
- The mobile layout works.
- Tester instructions are ready.
- A feedback collection method is ready.

## HOLD Criteria

Hold if:

- The normal route fails.
- QA controls appear on the normal route.
- Diagnostics appear on the normal route.
- The Dashboard, Report, or Q&A breaks.
- An API failure breaks the user flow.
- Secrets are exposed.
- The mobile layout breaks.
- Product copy claims certainty or a final recommendation.
- Payment or delivery expectations are unclear.

## Current Limitations

- Payment is not fully automated.
- Report delivery may still be manual or simulated.
- External Evidence may use fallback or mock output if Perplexity is not configured.
- Executive Q&A may use local fallback if OpenAI is not configured.
- The product is in controlled soft launch preparation, not full public launch.
- Production QA still needs to be executed and recorded.

## Next Launch Sequence

1. Configure Vercel environment variables if ready.
2. Redeploy production after environment setup.
3. Run production QA using `/amc-web-mvp`.
4. Run internal QA using `/amc-web-mvp?qa=1`.
5. Record results in this document.
6. Prepare the first tester message.
7. Prepare the tester feedback template.
8. Decide whether Vercel Pro is needed before external tester sharing.
9. Start the controlled soft launch with 3-5 trusted testers.
