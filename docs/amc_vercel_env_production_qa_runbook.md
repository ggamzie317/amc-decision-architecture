# AMC Vercel Environment Setup & Production QA Runbook

## Purpose

This runbook defines the environment variables and production QA steps required before sharing the AMC Web MVP with external soft-launch testers.

AMC is currently in controlled soft launch preparation, not full public launch. Production QA must confirm that live server-side services and their fallback paths are safe, bounded, and usable before any external distribution.

## Current Product Structure

```text
User Intake
→ Internal AMC Analysis
→ External Evidence Snapshot
→ Dashboard
→ Premium Report
→ Executive Report Q&A
```

Server-side endpoints:

- `POST /api/amc/external-snapshot`
- `POST /api/amc/report-qa`

Fallback principle: if live APIs are unavailable, AMC should preserve the user experience through fallback External Evidence context and local report-grounded Q&A. API availability must not determine whether the Dashboard, Premium Report, or Q&A interface remains usable.

## Required Environment Variables

### External Evidence Snapshot

Primary variable:

- `PERPLEXITY_API_KEY`

Supported fallback variable:

- `PPLX_API_KEY`

The current implementation checks `PERPLEXITY_API_KEY` first and then `PPLX_API_KEY`. Prefer `PERPLEXITY_API_KEY` for new Vercel configuration.

Purpose: enables server-side live external intelligence for the External Evidence Snapshot.

### Executive Report Q&A

- `OPENAI_API_KEY`

Purpose: enables server-side AI-assisted Executive Report Q&A.

### Security Rules

- Configure all keys only in Vercel Project Settings → Environment Variables or a secure local environment.
- Never expose keys to frontend code.
- Never use Vite-prefixed variables such as `VITE_OPENAI_API_KEY` or `VITE_PERPLEXITY_API_KEY`.
- Never commit keys or local environment files to the repository.
- Never print keys in application, deployment, or QA logs.
- Never include keys in browser responses, source maps, screenshots, or tester instructions.

## Local Environment Setup

From the repository root:

```bash
cd manus-ui
```

Create `manus-ui/.env.local` only when local live-service testing is required. Example placeholders:

```dotenv
OPENAI_API_KEY=replace_with_your_key
PERPLEXITY_API_KEY=replace_with_your_key
```

Alternatively, the External Evidence service also supports:

```dotenv
PPLX_API_KEY=replace_with_your_key
```

These are placeholders only. Do not commit `.env.local`.

### Local QA Without Keys

- The app builds successfully.
- External Evidence Snapshot uses fallback or mock mode.
- Executive Report Q&A uses the local report-grounded fallback.
- Dashboard, Premium Report, and chat remain usable.

### Local QA With Keys

- External Evidence Snapshot may show Live mode when Perplexity is configured and available.
- Executive Report Q&A may show API-assisted mode when OpenAI is configured and available.
- Provider failure must still return the user to the applicable fallback path.
- No key appears in browser source, console output, or network responses.

## Vercel Environment Setup

1. Open the Vercel dashboard.
2. Select the AMC project.
3. Open **Project Settings**.
4. Open **Environment Variables**.
5. Add `OPENAI_API_KEY`.
6. Add `PERPLEXITY_API_KEY`. Use `PPLX_API_KEY` only when maintaining an existing configuration that already uses the supported fallback name.
7. Apply the variables to **Production**.
8. Apply them to **Preview** only when live-service preview testing is needed.
9. Redeploy the relevant deployment after adding or changing variables.

Environment variable changes usually require a redeploy before the production runtime can read them. Do not include actual secret values in deployment notes, screenshots, tickets, or this repository.

## Production Routes to Test

Normal user route:

- `/amc-web-mvp`

Internal QA route:

- `/amc-web-mvp?qa=1`

Route rules:

- The normal route may be shared with controlled external testers.
- The QA route is internal only.
- The QA route must not be linked from public-facing copy.
- The QA route must not be included in tester instructions.
- Confirm that QA controls remain hidden on the normal route before every tester distribution.

## Production QA Checklist Without Keys

- [ ] Production `/amc-web-mvp` loads.
- [ ] Landing page appears correctly.
- [ ] EN/KR toggle works.
- [ ] Free Preview works.
- [ ] Full Intake works.
- [ ] Full Dashboard generates.
- [ ] External Evidence Snapshot appears in fallback or mock mode.
- [ ] Premium Report opens.
- [ ] Executive Report Q&A appears.
- [ ] A suggested question works.
- [ ] A custom question works.
- [ ] Clear chat works.
- [ ] Executive Report Q&A uses Local fallback.
- [ ] No console errors appear.
- [ ] No horizontal overflow appears.
- [ ] The 390px mobile layout works.
- [ ] No secrets appear in browser source, console output, or network responses.

## Production QA Checklist With Keys

- [ ] Production `/amc-web-mvp` loads.
- [ ] Full Intake can be completed and the Dashboard generates.
- [ ] External Evidence Snapshot attempts Live mode when Perplexity is configured.
- [ ] External Evidence fallback works when live external evidence fails.
- [ ] Executive Report Q&A attempts API-assisted mode when `OPENAI_API_KEY` is configured.
- [ ] Local Q&A fallback works when the OpenAI request fails.
- [ ] No key appears in browser source, console output, or network responses.
- [ ] API errors do not break the Dashboard, Premium Report, or chat.
- [ ] User-facing copy does not overstate certainty.
- [ ] No final career recommendation is forced.
- [ ] No legal, financial, immigration, medical, tax, investment, or other restricted advice appears.
- [ ] Q&A does not claim that a new live web search occurred during chat.

## QA Preset Testing

Use the internal route:

```text
/amc-web-mvp?qa=1
```

Test these presets:

- Entrepreneurship
- MBA / EMBA / PhD Decision
- Family Constraint-heavy Decision

For each preset:

- [ ] Confirm `29 / 29` answers.
- [ ] Confirm validation status is `PASS`.
- [ ] Generate the Full Dashboard.
- [ ] Confirm the expected Case Type appears.
- [ ] Confirm External Evidence Snapshot appears.
- [ ] Open the Premium Report and confirm the report works.
- [ ] Open Executive Report Q&A.
- [ ] Ask: “What is the main risk in this decision?”
- [ ] Ask: “How should I read the External Evidence Snapshot?”
- [ ] Confirm responses remain grounded in the generated report context.
- [ ] Confirm responses state appropriate boundaries and uncertainty.
- [ ] Confirm EN/KR switching preserves answers and chat state.
- [ ] Confirm the 390px mobile layout works without horizontal overflow.

## Soft Launch GO / HOLD Criteria

### GO for Internal Production QA

- Production build works.
- Normal and QA routes work.
- Fallback modes work without configured keys.
- No secrets are exposed.
- Desktop and 390px mobile layouts work.

### GO for Controlled External Tester Sharing

- The normal route works end to end.
- The QA route is not shared or linked publicly.
- Fallback behavior is acceptable for the planned test.
- Vercel environment variables are configured, or the fallback limitation is explicitly accepted by the operator.
- Tester instructions are ready.
- A feedback collection method is ready.

### HOLD

- The normal route fails.
- QA controls appear on the normal route.
- API keys appear in the browser, responses, source, or logs.
- Dashboard, Premium Report, or chat crashes when an API fails.
- Mobile layout breaks or introduces horizontal overflow.
- User-facing copy claims certainty, guaranteed outcomes, or a final recommendation.
- Payment or report-delivery expectations are unclear.

## Current Limitations

- Payment is not fully automated.
- Report delivery may still be manual or simulated.
- External Evidence may use fallback or mock mode when Perplexity is not configured or unavailable.
- Executive Report Q&A may use Local fallback when OpenAI is not configured or unavailable.
- This is controlled soft launch preparation, not full public launch.

## Next Actions

1. Add the required environment variables in Vercel.
2. Redeploy production.
3. Run production QA without keys if keys are not ready.
4. Run production QA with keys when they are available.
5. Prepare the first tester message.
6. Prepare the tester feedback template.
7. Decide whether to upgrade the Vercel plan before external tester distribution.

## QA Record

For each production QA run, record:

- Deployment URL and deployment identifier
- Test date and operator
- Environment tested: Production or Preview
- Key configuration status without recording secret values
- External Evidence mode observed: Live, Fallback, or Mock
- Executive Report Q&A mode observed: API-assisted or Local fallback
- Presets tested and their PASS status
- Desktop and 390px mobile results
- Console, overflow, and secret-exposure results
- GO or HOLD decision with unresolved issues
