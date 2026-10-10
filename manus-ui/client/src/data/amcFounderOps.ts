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
type JourneyFetchResponse = { json(): Promise<unknown> };
type JourneyFetcher = (url: string, init: RequestInit) => Promise<JourneyFetchResponse>;

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

  return function trackJourney(input: TrackJourneyInput) {
    if (!input.serviceStorageConsent) return queue;

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

      if (resumesActiveJourney) return;
      if (startsNewJourney) {
        removeStorageValue(sessionStorage, submissionKey);
        removeStorageValue(sessionStorage, statusKey);
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
          return;
        }
        if (startsNewJourney) {
          removeStorageValue(sessionStorage, submissionKey);
          removeStorageValue(sessionStorage, statusKey);
        }
      } catch {
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
export function trackV2Journey(input: TrackJourneyInput) { return v2JourneyTracker(input); }
