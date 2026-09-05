const ACTIVE_SUBMISSION_STORAGE_KEY = "amc_launch_v3_active_submission_id";
const ACTIVE_JOURNEY_STATUS_KEY = "amc_launch_v3_active_journey_status";
const LEGACY_SUBMISSION_STORAGE_KEY = "amc_launch_v3_submission_id";
const SUBMISSION_ID_PATTERN = /^AMC-\d{8}-[A-F0-9]{8}$/;

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

export type TrackJourneyInput = {
  eventType: JourneyEventType;
  language: "en" | "ko";
  serviceStorageConsent: boolean;
  newSubmission?: boolean;
  metadata?: Record<string, unknown>;
  patch?: Record<string, unknown>;
};

type JourneyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type JourneyFetchResponse = { json(): Promise<unknown> };
type JourneyFetcher = (url: string, init: RequestInit) => Promise<JourneyFetchResponse>;

type JourneyTrackerOptions = {
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

  return function trackJourney(input: TrackJourneyInput) {
    if (!input.serviceStorageConsent) return queue;

    queue = queue.then(async () => {
      const sessionStorage = safeStorage(options.getSessionStorage);
      const legacyStorage = safeStorage(options.getLegacyStorage);
      removeStorageValue(legacyStorage, LEGACY_SUBMISSION_STORAGE_KEY);

      const requestsNewJourney =
        input.eventType === "preview_started" && input.newSubmission === true;
      const storedSubmissionId = storageValue(sessionStorage, ACTIVE_SUBMISSION_STORAGE_KEY);
      const activeJourneyStatus = storageValue(sessionStorage, ACTIVE_JOURNEY_STATUS_KEY);
      const resumesActiveJourney =
        requestsNewJourney &&
        SUBMISSION_ID_PATTERN.test(storedSubmissionId) &&
        activeJourneyStatus === "active";
      const startsNewJourney = requestsNewJourney && !resumesActiveJourney;
      const activeSubmissionId = startsNewJourney ? "" : storedSubmissionId;

      if (resumesActiveJourney) return;
      if (startsNewJourney) {
        removeStorageValue(sessionStorage, ACTIVE_SUBMISSION_STORAGE_KEY);
        removeStorageValue(sessionStorage, ACTIVE_JOURNEY_STATUS_KEY);
      }
      if (!startsNewJourney && input.eventType !== "preview_started" && !activeSubmissionId) return;

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
        } | null;
        if (
          result?.stored === true &&
          typeof result.submissionId === "string" &&
          SUBMISSION_ID_PATTERN.test(result.submissionId)
        ) {
          setStorageValue(sessionStorage, ACTIVE_SUBMISSION_STORAGE_KEY, result.submissionId);
          setStorageValue(
            sessionStorage,
            ACTIVE_JOURNEY_STATUS_KEY,
            startsNewJourney
              ? "active"
              : input.eventType === "dashboard_generated"
                ? "completed"
                : activeJourneyStatus || "active",
          );
          return;
        }
        if (startsNewJourney) {
          removeStorageValue(sessionStorage, ACTIVE_SUBMISSION_STORAGE_KEY);
          removeStorageValue(sessionStorage, ACTIVE_JOURNEY_STATUS_KEY);
        }
      } catch {
        if (startsNewJourney) {
          removeStorageValue(sessionStorage, ACTIVE_SUBMISSION_STORAGE_KEY);
          removeStorageValue(sessionStorage, ACTIVE_JOURNEY_STATUS_KEY);
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
