# AMC Web MVP Deployment Note

## Route

- `/amc-web-mvp`

## App Structure

- App type: Vite React single-page app under `manus-ui/`
- Router: client-side `wouter`
- Local build command: `pnpm --dir manus-ui build`
- Build output:
  - static assets: `manus-ui/dist/public`
  - optional Express server bundle: `manus-ui/dist/index.js`

## Deployment Behavior

The bundled Express server already serves static files from `dist/public` and falls back to `index.html` for client-side routes. Direct navigation to `/amc-web-mvp` works when deployed through that server.

For static Vercel deployment with `manus-ui` as the project root, `manus-ui/vercel.json` provides the SPA rewrite so direct URLs such as `/amc-web-mvp` resolve to `index.html`.

If using another static host, configure the equivalent SPA fallback from all client routes to `index.html`.

## Prototype Scope

Included:

- staged AMC web funnel prototype at `/amc-web-mvp`
- local-state preview flow
- simulated Essential / Executive unlock
- simulated full-intake progress
- web dashboard sample
- browser print-based PDF save action
- Executive Q&A placeholder

Intentionally not included:

- real payment
- real chatbot
- account/auth
- backend submission
- external APIs
- production report generation
