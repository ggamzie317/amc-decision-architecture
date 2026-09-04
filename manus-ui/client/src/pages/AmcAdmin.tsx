import { useEffect, useMemo, useState } from "react";

type Summary = {
  backendAvailable: boolean;
  totals?: Record<string, number>;
  rates?: Record<string, number>;
  languageDistribution?: Record<string, number>;
  caseTypeDistribution?: Record<string, number>;
  evidenceDistribution?: Record<string, number>;
  safetyMarginDistribution?: Record<string, number>;
  frameworkSignalDistributions?: Record<string, Record<string, number>>;
  alternativePathSurfaced?: Record<string, number>;
};

type Submission = {
  submissionId: string;
  createdAt: string;
  productVersion: string;
  frameworkVersion: string;
  language: string;
  caseType: string | null;
  currentStage: string;
  fullIntakeCompletedAt: string | null;
  externalEvidenceMode: string | null;
  externalEvidenceConfidence: string | null;
  reportGeneratedAt: string | null;
  printSaveClickedAt: string | null;
  researchUseConsent: boolean;
  answersJson: Record<string, string>;
  structuralOutputJson: Record<string, unknown>;
  externalEvidenceJson: Record<string, unknown>;
  missingPoint: string | null;
  alternativePath: string | null;
  decisionConditionsJson: string[];
  safetyMarginStructuredData: Record<string, unknown>;
  existingFifwmStructuredData: Record<string, unknown>;
};

type Detail = {
  submission: Submission;
  events: Array<{ eventId: string; eventType: string; createdAt: string }>;
};
type Health = {
  database: "connected" | "not_configured" | "error";
  schema: "ready" | "missing_migration";
  submissionStorage: "ready" | "unavailable";
  usageEvents: "ready" | "unavailable";
  adminSession: "ready" | "not_configured";
  emailNotification: "configured" | "not_configured";
  externalEvidence: "configured" | "not_configured";
  dataQuality: null | {
    totalSubmissions: number;
    productVersionPresent: number;
    frameworkVersionPresent: number;
    completeFullIntake: number;
    structuralOutputSaved: number;
    safetyMarginSaved: number;
    externalEvidenceSaved: number;
    missingPointSaved: number;
    alternativePathStateSaved: number;
    decisionConditionsSaved: number;
    researchConsentRate: number;
  };
};
type Tab = "operations" | "research" | "submissions";

const metricLabels: Record<string, string> = {
  submissions: "Anonymous submissions",
  previewStarts: "Preview starts",
  previewCompletions: "Preview completions",
  fullIntakeStarts: "Full Intake starts",
  fullIntakeCompletions: "Full Intake completions",
  reportsGenerated: "Reports generated",
  detailedReportsOpened: "Detailed reports opened",
  printSaveClicks: "Print / Save clicks",
  previewToFullIntake: "Preview → Full Intake",
  fullIntakeCompletion: "Full Intake completion",
  reportGeneration: "Report generation",
  externalEvidenceLive: "Evidence live success",
  researchConsent: "Research consent",
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

function Distribution({
  title,
  values,
}: {
  title: string;
  values?: Record<string, number>;
}) {
  const entries = Object.entries(values || {}).sort((a, b) => b[1] - a[1]);
  return (
    <section className="border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-2 text-sm">
        {entries.length ? (
          entries.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-border pb-2"
            >
              <span className="truncate text-muted-foreground">{label}</span>
              <strong>{value}</strong>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No data</p>
        )}
      </div>
    </section>
  );
}

export default function AmcAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("operations");
  const [windowDays, setWindowDays] = useState("all");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [research, setResearch] = useState<Summary | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [filters, setFilters] = useState({
    language: "",
    caseType: "",
    completion: "",
    researchConsent: "",
    evidenceMode: "",
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (windowDays !== "all") params.set("window", windowDays);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, windowDays]);

  const load = async () => {
    try {
      const [ops, patterns, list, status] = await Promise.all([
        api<Summary>(
          `/api/amc/admin/summary?${new URLSearchParams({ ...(windowDays !== "all" ? { window: windowDays } : {}) })}`
        ),
        api<Summary>(
          `/api/amc/admin/summary?${new URLSearchParams({ mode: "research", ...(windowDays !== "all" ? { window: windowDays } : {}) })}`
        ),
        api<{ backendAvailable: boolean; submissions: Submission[] }>(
          `/api/amc/admin/submissions?${query}`
        ),
        api<Health>("/api/amc/admin/health"),
      ]);
      setAuthenticated(true);
      setSummary(ops);
      setResearch(patterns);
      setSubmissions(list.submissions);
      setHealth(status);
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized")
        setAuthenticated(false);
      else
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to load founder operations."
        );
    }
  };

  useEffect(() => {
    void load();
  }, [query]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    try {
      await api("/api/amc/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setAuthenticated(true);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Login failed");
    }
  };

  const logout = async () => {
    await api("/api/amc/admin/logout", { method: "POST" }).catch(
      () => undefined
    );
    setAuthenticated(false);
    setSummary(null);
    setResearch(null);
    setSubmissions([]);
    setDetail(null);
    setHealth(null);
  };

  const openDetail = async (submissionId: string) => {
    try {
      setDetail(
        await api<Detail>(
          `/api/amc/admin/submission?id=${encodeURIComponent(submissionId)}`
        )
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to load submission."
      );
    }
  };

  const exportCsv = (full: boolean) => {
    const warning =
      full &&
      !window.confirm(
        "Full Response Export contains raw user responses. Continue?"
      );
    if (warning) return;
    window.location.assign(
      `/api/amc/admin/export?mode=${full ? "full" : "summary"}&${query}`
    );
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-background px-5 py-20 text-foreground">
        <form
          onSubmit={login}
          className="mx-auto max-w-sm border border-border bg-card p-7"
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Founder only
          </p>
          <h1 className="mt-3 text-2xl font-semibold">AMC Operations</h1>
          <label className="mt-7 block text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 h-11 w-full border border-border bg-background px-3"
            />
          </label>
          <button
            type="submit"
            className="mt-5 h-11 w-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Sign in
          </button>
          {notice ? (
            <p className="mt-4 text-sm text-red-700">{notice}</p>
          ) : null}
        </form>
      </main>
    );
  }

  const backendAvailable =
    health?.database === "connected" && health.schema === "ready";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              AMC Founder Operations
            </p>
            <h1 className="mt-1 text-xl font-semibold">Launch V2 Data Layer</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="border border-border px-4 py-2 text-sm"
          >
            Log out
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        {!backendAvailable ? (
          <p className="mb-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {health?.database === "not_configured"
              ? "Data backend not configured. Configure DATABASE_URL and run the migration."
              : health?.database === "error"
                ? "Data backend unavailable. Check the server-side database configuration and connectivity."
                : "Database schema is not ready. Run the founder operations migration."}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex gap-2">
            {(["operations", "research", "submissions"] as Tab[]).map(item => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`px-3 py-2 text-sm font-medium ${tab === item ? "bg-foreground text-background" : "border border-border"}`}
              >
                {item === "operations"
                  ? "Operations"
                  : item === "research"
                    ? "Research Patterns"
                    : "Recent Submissions"}
              </button>
            ))}
          </div>
          <select
            value={windowDays}
            onChange={event => setWindowDays(event.target.value)}
            className="h-10 border border-border bg-background px-3 text-sm"
          >
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </div>

        {tab === "operations" ? (
          <div className="mt-6 space-y-6">
            <section className="border border-border bg-card p-5">
              <h2 className="text-base font-semibold">
                Founder Operations Health
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Database", health?.database],
                  ["Schema", health?.schema],
                  ["Submission storage", health?.submissionStorage],
                  ["Usage events", health?.usageEvents],
                  ["Admin session", health?.adminSession],
                  ["Email notification", health?.emailNotification],
                  ["External Evidence", health?.externalEvidence],
                ].map(([label, value]) => (
                  <div key={label} className="border border-border p-3 text-sm">
                    <p className="text-muted-foreground">{label}</p>
                    <p className="mt-1 font-semibold capitalize">
                      {String(value || "checking").replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Data Quality</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Completeness indicators only; no research interpretation or new
                AI analysis.
              </p>
              {health?.dataQuality ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    [
                      "Product version present",
                      health.dataQuality.productVersionPresent,
                    ],
                    [
                      "Framework version present",
                      health.dataQuality.frameworkVersionPresent,
                    ],
                    [
                      "Complete Full Intake",
                      health.dataQuality.completeFullIntake,
                    ],
                    [
                      "Structural output saved",
                      health.dataQuality.structuralOutputSaved,
                    ],
                    [
                      "Safety Margin saved",
                      health.dataQuality.safetyMarginSaved,
                    ],
                    [
                      "External Evidence saved",
                      health.dataQuality.externalEvidenceSaved,
                    ],
                    [
                      "Missing Point saved",
                      health.dataQuality.missingPointSaved,
                    ],
                    [
                      "Changing Play state saved",
                      health.dataQuality.alternativePathStateSaved,
                    ],
                    [
                      "Decision Switches saved",
                      health.dataQuality.decisionConditionsSaved,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 border-b border-border pb-2 text-sm"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <strong>
                        {value} / {health.dataQuality?.totalSubmissions}
                      </strong>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-b border-border pb-2 text-sm">
                    <span className="text-muted-foreground">
                      Research consent rate
                    </span>
                    <strong>{health.dataQuality.researchConsentRate}%</strong>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Unavailable until the database is connected and the migration
                  is ready.
                </p>
              )}
            </section>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Object.entries(summary?.totals || {}).map(([key, value]) => (
                <div key={key} className="border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">
                    {metricLabels[key] || key}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {Object.entries(summary?.rates || {}).map(([key, value]) => (
                <div key={key} className="border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    {metricLabels[key] || key}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{value}%</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Distribution
                title="Language"
                values={summary?.languageDistribution}
              />
              <Distribution
                title="Case Type"
                values={summary?.caseTypeDistribution}
              />
              <Distribution
                title="Evidence"
                values={summary?.evidenceDistribution}
              />
            </div>
          </div>
        ) : null}

        {tab === "research" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Only research-consented submissions are included. No additional
              LLM analysis is performed.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              <Distribution
                title="Case Type"
                values={research?.caseTypeDistribution}
              />
              <Distribution
                title="Safety Margin"
                values={research?.safetyMarginDistribution}
              />
              <Distribution
                title="Alternative Path"
                values={research?.alternativePathSurfaced}
              />
              <Distribution
                title="Language"
                values={research?.languageDistribution}
              />
              <Distribution
                title="Evidence"
                values={research?.evidenceDistribution}
              />
            </div>
            {Object.entries(research?.frameworkSignalDistributions || {}).map(
              ([label, values]) => (
                <Distribution key={label} title={label} values={values} />
              )
            )}
          </div>
        ) : null}

        {tab === "submissions" ? (
          <div className="mt-6">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(filters).map(([key, value]) =>
                key === "caseType" ? (
                  <input
                    key={key}
                    value={value}
                    onChange={event =>
                      setFilters(current => ({
                        ...current,
                        caseType: event.target.value,
                      }))
                    }
                    placeholder="Case Type"
                    className="h-10 border border-border px-3 text-sm"
                  />
                ) : (
                  <select
                    key={key}
                    value={value}
                    onChange={event =>
                      setFilters(current => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="h-10 border border-border bg-background px-2 text-sm"
                  >
                    <option value="">All {key}</option>
                    {key === "language" ? (
                      <>
                        <option value="en">EN</option>
                        <option value="ko">KR</option>
                      </>
                    ) : key === "completion" ? (
                      <>
                        <option value="complete">Complete</option>
                        <option value="incomplete">Incomplete</option>
                      </>
                    ) : key === "researchConsent" ? (
                      <>
                        <option value="yes">Research yes</option>
                        <option value="no">Research no</option>
                      </>
                    ) : (
                      <>
                        <option value="live">Live</option>
                        <option value="fallback">Fallback</option>
                        <option value="mock">Mock</option>
                      </>
                    )}
                  </select>
                )
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => exportCsv(false)}
                className="border border-border px-4 py-2 text-sm"
              >
                Summary CSV
              </button>
              <button
                onClick={() => exportCsv(true)}
                className="border border-red-300 px-4 py-2 text-sm text-red-800"
              >
                Full Response CSV
              </button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    {[
                      "Submission",
                      "Created",
                      "Language",
                      "Case Type",
                      "Stage",
                      "Intake",
                      "Evidence",
                      "Report",
                      "Print",
                      "Research",
                    ].map(label => (
                      <th key={label} className="px-3 py-3 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(item => (
                    <tr
                      key={item.submissionId}
                      className="border-b border-border"
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={() => openDetail(item.submissionId)}
                          className="font-medium underline"
                        >
                          {item.submissionId}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        {item.language.toUpperCase()}
                      </td>
                      <td className="px-3 py-3">{item.caseType || "—"}</td>
                      <td className="px-3 py-3">{item.currentStage}</td>
                      <td className="px-3 py-3">
                        {item.fullIntakeCompletedAt ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-3">
                        {item.externalEvidenceMode || "—"}{" "}
                        {item.externalEvidenceConfidence || ""}
                      </td>
                      <td className="px-3 py-3">
                        {item.reportGeneratedAt ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-3">
                        {item.printSaveClickedAt ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-3">
                        {item.researchUseConsent ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {detail ? (
          <section className="mt-8 border-t border-border pt-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Submission Detail
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {detail.submission.submissionId}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {detail.submission.productVersion} · {detail.submission.frameworkVersion}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="border border-border px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <article className="border border-border p-5">
                <h3 className="font-semibold">RAW USER INPUT</h3>
                <div className="mt-4 space-y-3">
                  {Object.entries(detail.submission.answersJson).map(
                    ([question, answer]) => (
                      <div key={question}>
                        <p className="text-xs text-muted-foreground">
                          Question {question}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {answer}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </article>
              <article className="border border-border p-5">
                <h3 className="font-semibold">AMC DERIVED ANALYSIS</h3>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">
                      Current Structural Posture
                    </dt>
                    <dd>
                      {JSON.stringify(
                        detail.submission.structuralOutputJson
                          .currentStructuralPosture || "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Missing Point</dt>
                    <dd>{detail.submission.missingPoint || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Changing Play</dt>
                    <dd>{detail.submission.alternativePath || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Decision Switches
                    </dt>
                    <dd>
                      {detail.submission.decisionConditionsJson.join(" · ") ||
                        "—"}
                    </dd>
                  </div>
                </dl>
                <pre className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap bg-secondary/30 p-3 text-xs">
                  {JSON.stringify(
                    {
                      safetyMargin:
                        detail.submission.safetyMarginStructuredData,
                      framework: detail.submission.existingFifwmStructuredData,
                      structure: detail.submission.structuralOutputJson,
                      externalEvidence: detail.submission.externalEvidenceJson,
                    },
                    null,
                    2
                  )}
                </pre>
              </article>
            </div>
            <article className="mt-5 border border-border p-5">
              <h3 className="font-semibold">Usage Event Timeline</h3>
              <ol className="mt-4 space-y-2 text-sm">
                {detail.events.map(event => (
                  <li
                    key={event.eventId}
                    className="flex justify-between gap-4 border-b border-border pb-2"
                  >
                    <span>{event.eventType}</span>
                    <time className="text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            </article>
          </section>
        ) : null}
        {notice ? <p className="mt-6 text-sm text-red-700">{notice}</p> : null}
      </div>
    </main>
  );
}
