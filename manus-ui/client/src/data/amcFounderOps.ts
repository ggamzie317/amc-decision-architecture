const SUBMISSION_STORAGE_KEY = "amc_launch_v2_submission_id";

export type JourneyEventType =
  | "preview_started"
  | "preview_completed"
  | "full_intake_started"
  | "full_intake_completed"
  | "external_evidence_requested"
  | "external_evidence_live"
  | "external_evidence_fallback"
  | "dashboard_generated"
  | "detailed_report_opened"
  | "print_save_clicked"
  | "language_changed";

type TrackJourneyInput = {
  eventType: JourneyEventType;
  language: "en" | "ko";
  serviceStorageConsent: boolean;
  metadata?: Record<string, unknown>;
  patch?: Record<string, unknown>;
};

function readSubmissionId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SUBMISSION_STORAGE_KEY) || "";
}

let trackingQueue = Promise.resolve();

export function trackAmcJourney(input: TrackJourneyInput) {
  if (!input.serviceStorageConsent) return;
  trackingQueue = trackingQueue.then(async () => {
    try {
      const response = await fetch("/api/amc/ops/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          ...input,
          submissionId: readSubmissionId() || undefined,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        submissionId?: unknown;
      } | null;
      if (
        typeof result?.submissionId === "string" &&
        /^AMC-\d{8}-[A-F0-9]{8}$/.test(result.submissionId)
      ) {
        window.localStorage.setItem(
          SUBMISSION_STORAGE_KEY,
          result.submissionId
        );
      }
    } catch {
      // Operations persistence is best-effort and must never block the report flow.
    }
  });
}
