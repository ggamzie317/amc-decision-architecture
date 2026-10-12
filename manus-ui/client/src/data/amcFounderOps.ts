const ACTIVE_SUBMISSION_STORAGE_KEY = "amc_launch_v3_active_submission_id";
const ACTIVE_JOURNEY_STATUS_KEY = "amc_launch_v3_active_journey_status";
const LEGACY_SUBMISSION_STORAGE_KEY = "amc_launch_v3_submission_id";
const SUBMISSION_ID_PATTERN = /^AMC-\d{8}-[A-F0-9]{8}$/;

export type JourneyEventType =
  | "simulator_opened"
  | "scenario_variable_changed"
  | "scenario_evaluated"
  | "scenario_reset"
  | "jev_assessment_requested"
  | "jev_assessment_completed"
  | "jev_assessment_unavailable"
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

export type TrackJourneyInput = {
  eventType: JourneyEventType;
  language: "en" | "ko";
  serviceStorageConsent: boolean;
  newSubmission?: boolean;
  metadata?: Record<string, unknown>;
  patch?: Record<string, unknown>;
};

type JourneyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type JourneyFetchResponse = { status?: number; json(): Promise<unknown> };
type JourneyFetcher = (url: string, init: RequestInit) => Promise<JourneyFetchResponse>;

const trackingFailureReasons = [
  "consent_required", "backend_unavailable", "storage_unavailable",
  "invalid_event", "baseline_required",
] as const;

/** Safe response categories only: never IDs, request/response bodies or errors. */
export type JourneyTrackingObservation = {
  eventType: JourneyEventType;
  outcome: "stored" | "not_stored" | "unavailable" | "skipped";
  reasonCode: typeof trackingFailureReasons[number] | "stored" | "http_error" |
    "invalid_response" | "network_error" | "no_active_journey" | "active_journey_resumed";
  httpStatus: number | null;
};
type JourneyObserver = (observation: JourneyTrackingObservation) => void;

type JourneyTrackerOptions = {
  storageNamespace?: "interactive-v1" | "interactive-v2";
  fetcher: JourneyFetcher;
  getSessionStorage: () => JourneyStorage | null;
  getLegacyStorage: () => JourneyStorage | null;
};

function safeStorage(getStorage: () => JourneyStorage | null) {
  try {
    return getStorage();
  } catch {
    return null;
  }
}

function storageValue(storage: JourneyStorage | null, key: string) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function removeStorageValue(storage: JourneyStorage | null, key: string) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function setStorageValue(storage: JourneyStorage | null, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Tracking remains non-blocking when browser storage is unavailable.
  }
}

export function createFounderOpsJourneyTracker(options: JourneyTrackerOptions) {
  let queue = Promise.resolve();
  const submissionKey = ACTIVE_SUBMISSION_STORAGE_KEY + (options.storageNamespace ? `_${options.storageNamespace}` : "");
  const statusKey = ACTIVE_JOURNEY_STATUS_KEY + (options.storageNamespace ? `_${options.storageNamespace}` : "");

  return function trackJourney(input: TrackJourneyInput, observer?: JourneyObserver) {
    const observe = (
      outcome: JourneyTrackingObservation["outcome"],
      reasonCode: JourneyTrackingObservation["reasonCode"],
      httpStatus: number | null = null,
    ) => {
      try { observer?.({ eventType: input.eventType, outcome, reasonCode, httpStatus }); }
      catch { /* Observation must not block customer flow or queued tracking. */ }
    };
    if (!input.serviceStorageConsent) {
      observe("skipped", "consent_required");
      return queue;
    }

    queue = queue.then(async () => {
      const sessionStorage = safeStorage(options.getSessionStorage);
      const legacyStorage = safeStorage(options.getLegacyStorage);
      removeStorageValue(legacyStorage, LEGACY_SUBMISSION_STORAGE_KEY);

      const requestsNewJourney =
        input.eventType === "preview_started" && input.newSubmission === true;
      const storedSubmissionId = storageValue(sessionStorage, submissionKey);
      const activeJourneyStatus = storageValue(sessionStorage, statusKey);
      const resumesActiveJourney =
        requestsNewJourney &&
        SUBMISSION_ID_PATTERN.test(storedSubmissionId) &&
        activeJourneyStatus === "active";
      const startsNewJourney = requestsNewJourney && !resumesActiveJourney;
      const activeSubmissionId = startsNewJourney ? "" : storedSubmissionId;

      if (resumesActiveJourney) {
        observe("skipped", "active_journey_resumed");
        return;
      }
      if (startsNewJourney) {
        removeStorageValue(sessionStorage, submissionKey);
        removeStorageValue(sessionStorage, statusKey);
      }
      if (!startsNewJourney && input.eventType !== "preview_started" && !activeSubmissionId) {
        observe("skipped", "no_active_journey");
        return;
      }

      try {
        const response = await options.fetcher("/api/amc/ops/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            ...input,
            submissionId: activeSubmissionId || undefined,
          }),
        });
        const result = (await response.json().catch(() => null)) as {
          stored?: unknown;
          submissionId?: unknown;
          reason?: unknown;
        } | null;
        const httpStatus = typeof response.status === "number" &&
          Number.isInteger(response.status) && response.status >= 100 && response.status <= 599
          ? response.status : null;
        const successfulHttp = httpStatus === null || (httpStatus >= 200 && httpStatus < 300);
        if (
          successfulHttp &&
          result?.stored === true &&
          typeof result.submissionId === "string" &&
          SUBMISSION_ID_PATTERN.test(result.submissionId)
        ) {
          setStorageValue(sessionStorage, submissionKey, result.submissionId);
          setStorageValue(
            sessionStorage,
            statusKey,
            startsNewJourney
              ? "active"
              : input.eventType === "dashboard_generated"
                ? "completed"
                : activeJourneyStatus || "active",
          );
          observe("stored", "stored", httpStatus);
          return;
        }
        const reasonCode = trackingFailureReasons.find(reason => reason === result?.reason);
        if (!successfulHttp) observe("unavailable", "http_error", httpStatus);
        else if (result?.stored === false && reasonCode) {
          observe(reasonCode === "backend_unavailable" || reasonCode === "storage_unavailable"
            ? "unavailable" : "not_stored", reasonCode, httpStatus);
        } else observe("unavailable", "invalid_response", httpStatus);
        if (startsNewJourney) {
          removeStorageValue(sessionStorage, submissionKey);
          removeStorageValue(sessionStorage, statusKey);
        }
      } catch {
        observe("unavailable", "network_error");
        if (startsNewJourney) {
          removeStorageValue(sessionStorage, submissionKey);
          removeStorageValue(sessionStorage, statusKey);
        }
        // Operations persistence is best-effort and must never block the report flow.
      }
    });

    return queue;
  };
}

const browserJourneyTracker = createFounderOpsJourneyTracker({
  fetcher: (url, init) => fetch(url, init),
  getSessionStorage: () => (typeof window === "undefined" ? null : window.sessionStorage),
  getLegacyStorage: () => (typeof window === "undefined" ? null : window.localStorage),
});

export function trackAmcJourney(input: TrackJourneyInput) {
  return browserJourneyTracker(input);
}

/** Opaque journey correlation only; provider details remain on the server. */
export function activeAmcSubmissionId(experience?: "interactive-v1" | "interactive-v2") {
  return storageValue(safeStorage(() => typeof window === "undefined" ? null : window.sessionStorage), ACTIVE_SUBMISSION_STORAGE_KEY + (experience ? `_${experience}` : ""));
}

const interactiveJourneyTracker = createFounderOpsJourneyTracker({
  storageNamespace: "interactive-v1",
  fetcher: (url, init) => fetch(url, init),
  getSessionStorage: () => (typeof window === "undefined" ? null : window.sessionStorage),
  getLegacyStorage: () => (typeof window === "undefined" ? null : window.localStorage),
});
export function trackInteractiveJourney(input: TrackJourneyInput) { return interactiveJourneyTracker(input); }

const v2JourneyTracker = createFounderOpsJourneyTracker({
  storageNamespace: "interactive-v2",
  fetcher: (url, init) => fetch(url, init),
  getSessionStorage: () => (typeof window === "undefined" ? null : window.sessionStorage),
  getLegacyStorage: () => (typeof window === "undefined" ? null : window.localStorage),
});
export function trackV2Journey(input: TrackJourneyInput, observer?: JourneyObserver) {
  return v2JourneyTracker(input, observer);
}
