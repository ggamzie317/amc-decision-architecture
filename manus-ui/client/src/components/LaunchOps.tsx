import type { LaunchOpsSummary } from "../../../server/launchOpsAnalytics";

type LaunchResponse =
  | LaunchOpsSummary
  | {
      backendAvailable: false;
      configuration?: LaunchOpsSummary["configuration"];
    };
export type { LaunchResponse };
const percent = (value: number | null) => (value === null ? "—" : `${value}%`);
const duration = (value: number | null) =>
  value === null ? "Unknown" : `${Math.round(value / 6000) / 10} min`;
const timestamp = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Unknown";

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
const integrityLabels: Record<string, string> = {
  suspiciousLifecycle: "Duplicate starts / missing or out-of-order stages",
  completedAnswerCountMismatch:
    "Completed intake without exactly 29 valid answers",
  completedMissingStructuralOutput:
    "Dashboard missing complete structural output",
  liveMissingDerivedSync: "Live evidence missing final derived sync",
  reportPrintMissingOrStaleDerived:
    "Report / Print before final sync or missing output",
  malformedJson: "Malformed JSONB / unexpected payload shape",
  finalChangingUnavailable: "Final Changing array unavailable",
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
            ["Current preset", config?.preset ?? "Loading"],
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
              label="Measurable journey starts"
              value={data.funnel[0].count}
              detail="Unique Preview Started journeys"
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
            <h2 className="text-base font-semibold">Launch funnel</h2>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
              {data.cohortDescription} Conversion uses journeys present in both
              stages. Missing prior-stage events are flagged below.
            </p>
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
                  {data.funnel.map(stage => (
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
              External Evidence health
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Journey outcomes include history. Request diagnostics apply only
              when server metadata was recorded; older requests remain unknown.
              No dollar costs are estimated.
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
              Recent verified live success:{" "}
              {timestamp(data.evidence.recentLiveSuccess)}
            </p>
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
              Review flags, not automatic corrections. Historical missing sync
              markers and reports opened while evidence was pending may be
              flagged. Counts overlap; no rows are changed.
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
                        <p className="text-muted-foreground">
                          {timestamp(row.createdAt)}
                        </p>
                      </td>
                      {[
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
