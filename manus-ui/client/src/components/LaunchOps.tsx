import SimulatorAnalytics from "./SimulatorAnalytics";
import type { LaunchOpsSummary } from "../../../server/launchOpsAnalytics";

type LaunchResponse =
  | LaunchOpsSummary
  | {
      backendAvailable: false;
      configuration?: LaunchOpsSummary["configuration"];
      testRecords?: LaunchOpsSummary["testRecords"];
    };
export type { LaunchResponse };
const percent = (value: number | null) => (value === null ? "—" : `${value}%`);
const duration = (value: number | null) =>
  value === null ? "Unknown" : `${Math.round(value / 6000) / 10} min`;
const timestamp = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Unknown";

/** Marks a journey the owner ran as a test (known id or `?test=1`). */
export function TestBadge() {
  return (
    <span
      title="Test record"
      className="ml-2 inline-block border border-amber-400 bg-amber-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-amber-900"
    >
      TEST
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="min-w-0 rounded border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}
function Pattern({
  title,
  values,
}: {
  title: string;
  values: Record<string, number>;
}) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, count]) => count));
  return (
    <section className="min-w-0 rounded border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {entries.length ? (
          entries.map(([label, count]) => (
            <div key={label}>
              <div className="flex justify-between gap-3 text-xs">
                <span className="break-words text-muted-foreground">
                  {label}
                </span>
                <strong>{count}</strong>
              </div>
              <div aria-hidden="true" className="mt-1 h-1 bg-secondary">
                <div
                  className="h-1 bg-foreground/70"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No completed journeys yet.
          </p>
        )}
      </div>
    </section>
  );
}
type FunnelRow = LaunchOpsSummary["funnel"][number];
function FunnelTable({ stages }: { stages: FunnelRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-3 font-medium">Stage</th>
            <th className="px-3 font-medium">Journeys</th>
            <th className="px-3 font-medium">From previous</th>
            <th className="px-3 font-medium">From start</th>
          </tr>
        </thead>
        <tbody>
          {stages.map(stage => (
            <tr key={stage.key} className="border-b border-border">
              <td className="py-3">
                <span>{stage.label}</span>
                <div
                  aria-hidden="true"
                  className="mt-2 h-1 max-w-60 bg-secondary"
                >
                  <div
                    className="h-1 bg-foreground/70"
                    style={{ width: `${stage.startRate ?? 0}%` }}
                  />
                </div>
              </td>
              <td className="px-3 font-semibold">{stage.count}</td>
              <td className="px-3">{percent(stage.previousRate)}</td>
              <td className="px-3">{percent(stage.startRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const integrityLabels: Record<string, string> = {
  suspiciousLifecycle: "Duplicate starts / missing or out-of-order stages",
  completedAnswerCountMismatch:
    "Completed intake with invalid schema-specific answer count",
  completedMissingStructuralOutput:
    "Dashboard missing complete structural output",
  liveMissingDerivedSync: "Legacy: live evidence missing final derived sync",
  reportPrintMissingOrStaleDerived:
    "Legacy: Report / Print before final sync or missing output",
  malformedJson: "Malformed JSONB / unexpected payload shape",
  finalChangingUnavailable: "Final Changing array unavailable",
  v2DashboardWithoutIntakeCompleted:
    "V2: dashboard generated without Full Intake completed",
  v2CompletedMissingStructuralOutput:
    "V2: completed journey missing projected structural output",
  v2PrintBeforeDashboard: "V2: Print / Save before dashboard generated",
  orphanEvents: "Orphan usage events in selected period",
};

export default function LaunchOps({
  data,
  openDetail,
}: {
  data: LaunchResponse | null;
  openDetail: (id: string) => void;
}) {
  const config = data?.configuration;
  return (
    <div className="mt-6 space-y-6">
      {data?.backendAvailable && <SimulatorAnalytics data={data.simulator} />}
      <section className="rounded border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Launch Ops
        </p>
        <h2 className="mt-2 text-xl font-semibold">Free public launch</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Launch mode", config?.launchMode ?? "Loading"],
            ["Pricing", "FREE"],
            ["External provider", config?.provider ?? "Loading"],
            [config?.presetLabel ?? "V2 search preset", config?.preset ?? "Loading"],
            ["Research", "OPT-IN ONLY"],
            ["Customer accounts", "NONE"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-words font-medium">{value}</dd>
            </div>
          ))}
          {config?.productionSha ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Production SHA</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {config.productionSha}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      {!data ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading launch activity…
        </p>
      ) : !data.backendAvailable ? (
        <p
          role="status"
          className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Launch analytics unavailable. Check Operations Health. No counts are
          estimated.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="V2 journey starts"
              value={data.funnel[0].count}
              detail={`Unique V2 journeys with Preview Started · ${data.experienceCounts.legacy} legacy journeys in this period`}
            />
            <Metric
              label="Full Intake completion"
              value={percent(data.quality.intakeCompletionRate)}
              detail="Among journeys that started Full Intake"
            />
            <Metric
              label="Dashboard → Report"
              value={percent(data.quality.dashboardReportRate)}
            />
            <Metric
              label="Report → Print / Save"
              value={percent(data.quality.reportPrintRate)}
              detail="Print dialog opened; saving cannot be confirmed"
            />
          </div>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Launch funnel · V2</h2>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
              {data.cohortDescription} Conversion uses journeys present in both
              stages, so no rate exceeds 100%. V2 has no separate preview step
              (Preview Completed does not apply). Missing prior-stage events are
              flagged below.
            </p>
            <FunnelTable stages={data.funnel} />
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Legacy MVP / V1 funnel (retired) ·{" "}
                {data.experienceCounts.legacy} journeys
              </summary>
              <p className="mt-2 text-xs text-muted-foreground">
                Historical journeys from the retired legacy routes, which had a
                separate Preview Completed step.
              </p>
              <FunnelTable stages={data.legacyFunnel} />
            </details>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">Journey quality</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Incomplete journeys"
                value={data.quality.incomplete}
                detail="Started Preview; Full Intake not completed"
              />
              <Metric
                label="Inactive incomplete journeys"
                value={data.quality.inactiveIncomplete}
                detail="No recorded activity for 24 hours; not confirmed abandonment"
              />
              <Metric
                label="Median Full Intake elapsed time"
                value={duration(data.quality.medianCompletionMs)}
                detail={`${data.quality.completionTimeSamples} valid start/completion pairs; includes time away`}
              />
              <Metric
                label="Average Full Intake elapsed time"
                value={duration(data.quality.averageCompletionMs)}
                detail="Recorded event interval, not active session time"
              />
            </div>
          </section>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="text-base font-semibold">
              External Evidence health · V2
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              From V2 journey events (evidence requested / live / fallback).
              V2 does not record provider latency or provider diagnostics, by
              design. No dollar costs are estimated.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Evidence requests"
                value={data.evidence.v2.requests}
                detail={`${data.evidence.v2.requestJourneys} journeys`}
              />
              <Metric
                label="Results: live / fallback"
                value={`${data.evidence.v2.liveResults} / ${data.evidence.v2.fallbackResults}`}
                detail={`${percent(data.evidence.v2.livePercent)} live`}
              />
              <Metric
                label="Journeys with a live result"
                value={data.evidence.v2.liveJourneys}
                detail={`${percent(data.evidence.v2.liveJourneyPercent)} of journeys with a result · ${data.evidence.v2.fallbackOnlyJourneys} fallback only`}
              />
              <Metric
                label="Most recent live result"
                value={timestamp(data.evidence.v2.recentLiveEvent)}
                detail="Latency / provider diagnostics: not recorded for V2"
              />
            </div>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Legacy route provider diagnostics (retired)
              </summary>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Legacy journeys only. Request diagnostics apply only when server
                metadata was recorded; older requests remain unknown.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Live journeys"
                  value={data.evidence.liveJourneys}
                  detail={`${percent(data.evidence.livePercent)} of live/fallback journeys`}
                />
                <Metric
                  label="Fallback journeys"
                  value={data.evidence.fallbackJourneys}
                  detail={`${percent(data.evidence.fallbackPercent)} of live/fallback journeys`}
                />
                <Metric
                  label="Recorded evidence requests"
                  value={data.evidence.requests}
                />
                <Metric
                  label="Requests: live / fallback / unknown"
                  value={`${data.evidence.liveRuns} / ${data.evidence.fallbackRuns} / ${data.evidence.unknownRuns}`}
                />
                <Metric
                  label="Provider failures"
                  value={data.evidence.providerFailures}
                  detail={`${data.evidence.timeouts} recorded timeouts`}
                />
                <Metric
                  label="Invalid provider responses"
                  value={data.evidence.invalidResponses}
                />
                <Metric
                  label="Missing configuration"
                  value={data.evidence.missingConfiguration}
                />
                <Metric
                  label="Average / recent latency"
                  value={`${data.evidence.averageLatencyMs ?? "—"} / ${data.evidence.recentLatencyMs ?? "—"}`}
                  detail="Milliseconds, when recorded"
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Recent verified live success (legacy):{" "}
                {timestamp(data.evidence.recentLiveSuccess)}
              </p>
            </details>
          </section>
          <section>
            <h2 className="text-base font-semibold">Decision patterns</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {data.patterns.completedCount} completed submissions. Operational
              pattern, not a research conclusion. Language covers all{" "}
              {data.cohortSize} journeys; other patterns cover completed
              submissions. Unknown history is not treated as zero Changing
              Plays.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Pattern title="Case Type" values={data.patterns.caseType} />
              <Pattern
                title="Current Structural Posture"
                values={data.patterns.posture}
              />
              <Pattern
                title="Safety Margin"
                values={data.patterns.safetyMargin}
              />
              <Pattern
                title="Changing Plays per journey"
                values={data.patterns.changingCount}
              />
              <Pattern
                title="Changing family frequency"
                values={data.patterns.changingFamily}
              />
              <Pattern title="Language" values={data.patterns.language} />
            </div>
          </section>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Research consent</h2>
            <p className="mt-3 text-xl font-semibold">
              {data.research.consented} / {data.research.completed}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                completed submissions · {percent(data.research.percent)}
              </span>
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Launch Ops uses service-consented operational data. Research
              Patterns includes only explicit research opt-ins. Operational
              counts do not add anyone to the research dataset.
            </p>
          </section>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="text-base font-semibold">
              Data integrity · observation only
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Review flags, not automatic corrections. V2 journeys are checked
              against the V2 lifecycle; legacy-only checks (Preview Completed
              order, derived sync markers, 29 answers) apply to legacy rows
              only. Counts overlap; no rows are changed.
            </p>
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {Object.entries(data.integrity).map(([key, count]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 border-b border-border py-3 text-sm"
                >
                  <dt className="text-muted-foreground">
                    {integrityLabels[key]}
                  </dt>
                  <dd
                    className={`font-semibold ${count ? "text-amber-800" : ""}`}
                  >
                    {count}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Latest stored submission/event timestamp:{" "}
              {timestamp(data.lastPersistenceAt)}
            </p>
          </section>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Newest journeys in this cohort. Raw answers are available only in
              explicit submission detail.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {[
                      "Journey / created",
                      "Experience",
                      "Case Type",
                      "Language",
                      "Stage",
                      "Evidence",
                      "Safety Margin",
                      "Changing",
                      "Report",
                      "Print",
                      "Research",
                    ].map(label => (
                      <th key={label} className="px-2 py-3 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map(row => (
                    <tr
                      key={row.submissionId}
                      className="border-b border-border"
                    >
                      <td className="px-2 py-3">
                        <button
                          onClick={() => openDetail(row.submissionId)}
                          className="min-h-11 text-left font-medium underline underline-offset-4"
                        >
                          {row.submissionId}
                        </button>
                        {row.isTest ? <TestBadge /> : null}
                        <p className="text-muted-foreground">
                          {timestamp(row.createdAt)}
                        </p>
                      </td>
                      {[
                        row.experience,
                        row.caseType,
                        row.language,
                        row.stage,
                        row.evidence,
                        row.safetyMargin,
                        row.changingCount ?? "Unknown",
                        row.reportOpened ? "Yes" : "No",
                        row.printed ? "Yes" : "No",
                        row.researchConsent ? "Opt-in" : "No",
                      ].map((value, index) => (
                        <td key={index} className="px-2 py-3">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.recent.length ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No journeys in this period.
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
