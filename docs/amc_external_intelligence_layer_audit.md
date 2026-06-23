# AMC External Intelligence Layer Audit

## 1. Purpose

AMC needs an External Intelligence Layer before Executive Report Q&A can become a meaningful evidence-grounded product layer.

The correct product sequence is:

1. User case input
2. External information search and validation
3. AMC internal structural analysis
4. Full Web Dashboard and Detailed PDF Report
5. Executive Report Q&A grounded in the generated report

The chatbot should come after the report has been enriched with external evidence. The repository’s chatbot policy already defines Q&A as a report interpreter and prohibits invented findings, so external evidence must first become stable report context.

## 2. Current Status Summary

**Status: IMPLEMENTED BUT NOT CONNECTED TO WEB MVP**

Repository evidence shows that AMC already has:

- A typed Perplexity API client
- A structured external snapshot prompt and JSON Schema response
- A frozen External Layer Contract v1
- A contract normalizer and AMC override adapter
- Optional live Perplexity resolution with non-blocking fallback
- Report-runner integration for contract files or live Perplexity
- External Snapshot integration in the non-Web-MVP report payload and DOCX generation pipeline
- Legacy manual and semi-automated external-layer tooling
- Single and comparative examples

However, `/amc-web-mvp` does not import or call these modules. Its Dashboard and Detailed PDF Report use local React state, intake-derived case logic, and static presentation objects. The route explicitly states that it makes no external API calls or production report-generation calls.

The integration is therefore real at the report-pipeline level, but disconnected from the current Web MVP route.

## 3. Existing Files Found

| Area | File | What It Does | Status | Notes |
| --- | --- | --- | --- | --- |
| Contract documentation | `docs/amc_external_layer_contract_v1.md` | Freezes the provider payload, enum rules, mapping, fallback, and single/comparative display policy. | Implemented | Current canonical typed contract. |
| Perplexity client | `src/perplexity/client.ts` | Sends a JSON Schema completion request to Perplexity `/chat/completions` and returns content plus citations. | Implemented | Uses server-side process environment variables. |
| Prompt | `src/perplexity/buildExternalSnapshotPrompt.ts` | Builds the external intelligence system/user prompt from case summary, options, location, company, language, and date. | Implemented | Explicitly asks for evidence-linked, uncertainty-aware output. |
| Provider adapter | `src/perplexity/fetchExternalSnapshot.ts` | Requests and validates four external dimensions, source notes, and market data date. | Implemented | Returns provider citations separately from the snapshot. |
| Safe resolver | `src/perplexity/resolveAmcExternalSnapshot.ts` | Enables live Perplexity conditionally, builds case context, maps results, and falls back on failure. | Implemented | Missing key, empty summary, and provider errors are non-blocking. |
| Contract adapter | `src/perplexity/externalLayerContract.ts` | Normalizes direct contract, `snapshot`, or `response.snapshot` payloads and converts them to AMC override shape. | Implemented | Rejects invalid enums and empty required fields. |
| AMC override type | `src/amc/externalSnapshotOverride.ts` | Defines the internal override consumed by AMC’s External Snapshot builder. | Implemented | Source is fixed to `perplexity_sonar`. |
| AMC snapshot builder | `src/buildExternalSnapshot.ts` | Uses provider override when supplied; otherwise generates an internal structural fallback. | Implemented | Stores provider source notes and date in native metadata. |
| Report assembly | `src/assembleAmcReportPayload.ts` | Passes `externalSnapshotOverride` into the section builders. | Implemented | Connects typed external data to report sections. |
| Report generation | `src/generateAmcReport.ts` | Maps External Snapshot into render payload and includes integration warnings. | Implemented | Feeds DOCX/template rendering. |
| Report runner | `scripts/run_amc_report.ts` | Accepts `--external-layer` or optionally resolves live Perplexity before generating a report. | Implemented | Preferred existing production-pipeline hookup point. |
| Contract emitter | `scripts/emit_perplexity_external_layer.ts` | Converts fixture/provider output or live Perplexity output into contract-v1 JSON. | Implemented | Supports dry-run and file output. |
| Live smoke script | `scripts/test_perplexity_external_snapshot.ts` | Manually exercises the live provider adapter. | Implemented | Requires a real API key; it is not an isolated automated unit test. |
| Contract examples | `examples/external_layer_contract_single_example.json`, `examples/external_layer_contract_comparative_example.json` | Provide valid single and comparative contract fixtures. | Implemented | Both use the same four-dimension contract shape. |
| Provider examples | `examples/perplexity_provider_response_single_example.json`, `examples/perplexity_provider_response_comparative_example.json` | Show provider-style response envelopes with snapshot and citations. | Implemented | Citations are fixture URLs and are not retained by the contract adapter. |
| Legacy merge path | `src/merge_external_layer.py` | Shallow-merges a flat external-layer JSON object into an older report payload. | Implemented | Separate from contract-v1 architecture. |
| Legacy notes builder | `src/build_external_layer_from_notes.py` | Converts normalized notes into legacy flat `External_*` fields. | Implemented | Supports single and comparative fields. |
| Legacy raw-text extractor | `src/extract_external_notes_from_text.py` | Extracts comparative notes from structured Perplexity-style raw text. | Implemented | Semi-automated and comparative-focused. |
| Legacy templates | `output/templates/external_layer_*.json`, `output/templates/perplexity_external_raw_comparative.template.txt` | Templates for manual/semi-automated external-layer production. | Implemented | Tracked examples exist under `output/templates`. |
| Legacy sample artifacts | `output/external_layer_latest.json`, `output/external_layer_notes_latest.json`, `output/perplexity_external_raw.txt` | Committed sample outputs for the legacy comparative path. | Implemented | Not the newer contract-v1 shape. |
| Legacy UI payload | `manus-ui/client/src/data/reportPayload.json`, `mockReportPayload.ts` | Contains flat External Snapshot and comparative fields for another report UI path. | Implemented | Not consumed by `AmcWebMvp.tsx`. |
| Builder tests | `tests/buildExternalSnapshot.test.ts` | Tests internal snapshot shape, comparative signals, safe fallback, and recommendation-free wording. | Partial | Does not directly test the Perplexity client, contract normalizer, or live resolver fallback. |
| Web MVP | `manus-ui/client/src/pages/AmcWebMvp.tsx` | Implements the staged customer flow, dashboard, report view, Q&A placeholder, and QA presets. | Not connected | No Perplexity or external-layer import, fetch, or API integration. |
| Q&A policy | `prompts/amc_chatbot_system_prompt_v1.txt`, `prompts/amc_faq_seed_v1.json` | Defines report-grounded Q&A behavior and External Snapshot explanations. | Scaffolded | No functional chatbot on the Web MVP route. |

## 4. Existing Data Contract

### Canonical contract-v1 fields

```text
market_direction
  status: supportive | mixed | constrained
  summary: string
  evidence: string[]

competition_pressure
  status: contained | moderate | elevated
  summary: string
  evidence: string[]

economic_pressure
  status: contained | moderate | elevated
  summary: string
  evidence: string[]

transition_friction
  status: contained | moderate | elevated
  summary: string
  evidence: string[]

source_notes: string[]
market_data_date: string
```

### Expected input

The live prompt accepts:

- Case summary
- Options under consideration
- Location
- Current role/company
- Report language: `ko`, `en`, or `zh`
- As-of date
- Optional model and domain filter

The resolver builds the case summary from intake fields including main decision, options, forced choice, non-negotiables, risks, and priorities.

### Expected output

The provider returns:

- Four normalized external dimensions
- One status per dimension
- A concise summary per dimension
- Evidence bullets per dimension
- Source notes
- Market data date

The client response also carries provider-level `citations`, model, and request ID.

### Citation and source fields

- `source_notes` and `market_data_date` are part of contract v1.
- Provider response `citations` exist in `fetchExternalSnapshot()` and provider fixtures.
- Citations are not part of `ExternalLayerContractV1`.
- The live resolver maps only the snapshot into `AmcExternalSnapshotOverride`.
- The contract emitter normalizes only the snapshot and therefore drops provider citations.
- No stable source URL, source title, publisher, publication date, or claim-to-source mapping is present in the canonical contract.

The current contract supports traceability notes, but not customer-ready citations.

### Confidence fields

No explicit confidence score or confidence enum was found. Uncertainty is expected to be expressed in summary/evidence text and indirectly through normalized statuses.

### Fallback behavior

If the provider integration is:

- Disabled
- Missing `PERPLEXITY_API_KEY`
- Given an empty case summary
- Returning an error or invalid response

the report pipeline continues with AMC’s internal External Snapshot and emits a non-blocking warning.

### Single and comparative support

The contract is documented as supporting both `single_path` and `comparative` reports.

Important limitation: contract v1 contains one global set of four dimensions. In comparative mode, `buildExternalSnapshotFromOverride()` applies the same provider-derived status set to Option A and Option B. Comparative-specific prose remains AMC-owned. The legacy flat external layer supports explicit per-option statuses, but the newer live contract does not yet provide per-option evidence or status differentiation.

## 5. Existing Perplexity / API Handling

### API client

`src/perplexity/client.ts` provides a functioning JSON Schema client using `fetch()` and bearer authentication.

### Environment variable names

The following names are referenced:

- `PERPLEXITY_API_KEY`
- `PERPLEXITY_MODEL`
- `AMC_ENABLE_PERPLEXITY_EXTERNAL`
- `AMC_PERPLEXITY_DOMAIN_FILTER`
- `AMC_PERPLEXITY_LANG`

No values were inspected or recorded. No Perplexity-specific entries were found in the repository’s local environment file during this audit.

### Existing API-call behavior

- Endpoint defaults to `https://api.perplexity.ai/chat/completions`.
- Default model is `sonar`.
- JSON Schema strict mode is used.
- Temperature defaults to `0`.
- Optional domain filters are supported.
- Invalid HTTP responses, non-JSON responses, missing content, invalid enums, and malformed snapshot fields produce errors.

### Error and fallback behavior

- The client throws structured HTTP errors.
- The resolver catches provider and validation errors.
- The report runner receives warnings and falls back to internal structural output.
- Render success is intentionally preserved.

### Missing operational hardening

No explicit request timeout, abort controller, retry policy, rate-limit handling, cache, request deduplication, usage logging, or cost control was found in the Perplexity client.

### Test coverage

Existing coverage includes:

- External Snapshot internal builder tests
- Report payload/template/render tests for External Snapshot fields
- Fixture examples
- A manual live-provider smoke script
- A contract emitter that can normalize fixture provider responses without a live API call

No dedicated automated tests were found for:

- `PerplexityClient`
- `fetchExternalSnapshot`
- `normalizeExternalLayerContractV1`
- `resolvePerplexityExternalSnapshot`
- Missing-key fallback
- Provider failure fallback
- Citation preservation
- Timeout or rate-limit behavior

### Web MVP usage

The Perplexity API path is not used by `/amc-web-mvp`.

## 6. Current Web MVP Integration Status

### Does the Web MVP call external intelligence?

No.

`AmcWebMvp.tsx` does not import the external contract, Perplexity modules, report assembler, or report runner. No external-intelligence `fetch()` call or Web MVP API endpoint is present.

### Does the Dashboard display an External Snapshot?

It displays a section labeled `External Comparative Snapshot`, but the content is not externally sourced.

The matrix rows are module-level constants such as Income Stability, Identity Alignment, External Validation, Execution Burden, and Reversibility. They are local product interpretation copy, not market evidence with sources.

### Does the Detailed PDF Report display external evidence?

It displays an `External Pressure Map`, but the values and readings come from static EN/KR arrays in `AmcWebMvp.tsx`.

No citations, source notes, market data date, provider status, or externally retrieved evidence are shown.

### Does Executive Q&A have external context?

No functional Q&A exists on the route. The page shows example questions and a placeholder for later private-link or access-code delivery.

The chatbot prompt scaffold requires report-grounded answers and prohibits invented findings, but no runtime report context or external evidence is connected to the Web MVP Q&A section.

### What currently drives output?

Current Web MVP output is based on:

- User-entered answers held in local React state
- Frontend-only Case Type Detection
- Case-specific local interpretation branches
- Static dashboard/report structures and copy

The page explicitly states that it does not call external APIs or production report generation.

## 7. Gap Analysis

### Gap 1 — External Search

**What is missing:**
A Web MVP server-side endpoint or orchestration layer that accepts a normalized case request and invokes the existing provider adapter. The current live integration exists only in scripts/report-runner flow.

**Impact:**
The Web MVP cannot retrieve current market, company, industry, relocation, degree, or demand signals.

**Needed next:**
Define a Web-facing request boundary using the existing contract, first with a mock resolver and later with server-side Perplexity. Keep the API key off the client.

### Gap 2 — External Validation / Source Grounding

**What is missing:**
Stable citation preservation, source normalization, source titles, publication dates, claim-to-source linkage, confidence/uncertainty fields, and customer-facing evidence limitations.

**Impact:**
Even the existing live report pipeline can generate externally informed summaries, but cannot yet present robust cited evidence in the Dashboard or report.

**Needed next:**
Create an additive source metadata contract. Normalize provider citations into safe source records and explicitly represent uncertainty. Preserve the existing fallback contract.

### Gap 3 — Dashboard Integration

**What is missing:**
State, loading, success, fallback, and error handling for an External Snapshot in `/amc-web-mvp`, plus components for four dimensions, evidence bullets, source date, and limitation notes.

**Impact:**
The section currently labeled External Comparative Snapshot may be interpreted as market intelligence even though it is local structural interpretation.

**Needed next:**
Add a mock contract-v1 External Snapshot to the Web MVP and clearly distinguish:

- User-provided facts
- AMC structural interpretation
- External evidence
- Unverified or low-confidence signals

### Gap 4 — Detailed PDF Report Integration

**What is missing:**
The report-only view does not consume the existing typed external override or show source-grounded evidence.

**Impact:**
The report can be case-specific internally but lacks externally validated market context and source traceability.

**Needed next:**
Add an External Snapshot report section using the same mock contract and print-safe source treatment. Preserve the current premium page structure and fallback behavior.

### Gap 5 — Executive Q&A Readiness

**What is missing:**
A stable generated-report context object that combines intake, internal analysis, external evidence, source limitations, and the final rendered interpretation.

**Impact:**
Q&A cannot safely answer external questions without inventing facts or reaching beyond the report.

**Needed next:**
After Dashboard and report integration, create a versioned Q&A context derived from the final report. Restrict answers to that context and expose missing evidence plainly.

## 8. Recommended Implementation Sequence

### Task 045B — Add External Snapshot contract/mock layer to Web MVP

- Do not call a live API.
- Reuse or adapt `ExternalLayerContractV1`.
- Add a static/mock external intelligence object per QA scenario.
- Display External Snapshot in Full Web Dashboard.
- Display the same evidence in Detailed PDF Report.
- Include source notes, as-of date, uncertainty, and fallback labeling.
- Confirm EN/KR, desktop, mobile, and print layout.

This task should also decide whether comparative Web MVP output needs a contract-v2 additive per-option evidence structure or a separate AMC-owned comparison derived from one shared market snapshot.

### Task 045C — Connect live Perplexity behind a safe server-side/API layer

- Keep `PERPLEXITY_API_KEY` server-side.
- Reuse the existing client, prompt, resolver, and normalizer where practical.
- Add timeout and abort handling.
- Add explicit error classes and fallback responses.
- Add retry/rate-limit policy.
- Add citation and source normalization.
- Add request observability without logging sensitive intake or secrets.
- Add automated tests with mocked provider responses.

### Task 045D — Use live external evidence in Dashboard and Detailed PDF Report

- Replace mock resolution with the safe API response.
- Show external signals and source-backed validation.
- Show uncertainty and evidence limitations.
- Preserve a visible fallback mode when live retrieval is unavailable.
- Ensure the Dashboard and report consume the same normalized snapshot.

### Task 046 — Build Executive Report Q&A Chat

Use:

- User intake
- AMC internal structural analysis
- Normalized External Intelligence Layer
- Generated Dashboard and Detailed PDF Report context

The Q&A layer should interpret the report, cite or identify the relevant external evidence, state missing context, and never invent facts beyond the report.

## 9. Risk and Safety Notes

- Do not expose `PERPLEXITY_API_KEY` in client-side code.
- Do not overstate external information accuracy.
- External sources should be cited or summarized with identifiable source names.
- If source confidence is low, the report must show uncertainty.
- The External Intelligence Layer must support fallback mode.
- Separate user-provided facts from externally validated facts.
- Separate AMC interpretation from provider evidence.
- Do not present stale market data as current; show the as-of date.
- Do not treat `source_notes` as a substitute for normalized citations.
- Comparative output must not imply per-option evidence if only a shared market snapshot was retrieved.
- Q&A must not invent facts beyond the final report context.
- Avoid logging sensitive intake, raw provider responses, or secrets.

## 10. Product Interpretation

### Without external intelligence

- AMC can provide an internal structural diagnosis.
- The current Web MVP is useful for controlled QA and soft-launch learning.
- Case Type, risk structure, Decision Conditions, and validation plans can still be valuable.
- The report may lack external market validation and current source grounding.

### With external intelligence

- AMC can compare the user’s situation with market, company, industry, geography, program, or demand signals.
- Dashboard and report claims become more credible when evidence and limitations are visible.
- External validation can refine the timing and conditions of a decision without turning AMC into a recommendation engine.
- Executive Q&A can answer from both internal decision structure and external evidence.

## 11. Soft Launch Recommendation

**Recommended: Option B — Implement Task 045B mock External Snapshot before broader external testing.**

The existing external intelligence backend/report-pipeline work is more advanced than the Web MVP integration. Connecting live Perplexity immediately would combine unresolved data-contract, citation, comparative-model, UI, print, fallback, and privacy questions in one change.

A mock contract layer first is safer because it:

- Validates the Web MVP information architecture before introducing network behavior.
- Reuses an existing stable four-dimension contract.
- Exposes the citation and comparative limitations early.
- Allows Dashboard, report, EN/KR, mobile, print, and QA testing deterministically.
- Creates the exact interface the future server-side Perplexity endpoint must satisfy.

The current internal-only MVP can continue controlled QA with a clear limitation notice. Broader paid external testing should wait until mock External Snapshot presentation and evidence boundaries are stable.

## 12. Verification

- This audit is documentation-only.
- No external API was called.
- No secret values were inspected or recorded.
- No application behavior, backend logic, report scripts, dependencies, or product logic were changed.
