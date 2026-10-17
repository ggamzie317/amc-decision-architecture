import type { SubmissionRecord, UsageEventRecord } from "./founderOpsTypes.js";

/**
 * Journeys the owner ran as tests before the `?test=1` tag existed
 * (owner decision 2026-10-17: tag tests so later aggregate reviews can exclude
 * them). Stored rows are not modified; they are recognised by id here.
 */
export const KNOWN_TEST_SUBMISSION_IDS: readonly string[] = [
  "AMC-20261015-B71A3311",
  "AMC-20261015-185EC4AC",
  "AMC-20261016-4F0934D5",
  "AMC-20261016-1B435E00",
  "AMC-20261017-557E5D38",
];

const knownTestIds = new Set(KNOWN_TEST_SUBMISSION_IDS);

/** A test journey: listed above, or tagged by the client with `testRun: true`. */
export function isTestRecord(
  row: Pick<SubmissionRecord, "submissionId"> & { structuralOutputJson?: unknown }
) {
  const output = row.structuralOutputJson;
  return (
    knownTestIds.has(row.submissionId) ||
    (!!output &&
      typeof output === "object" &&
      !Array.isArray(output) &&
      (output as Record<string, unknown>).testRun === true)
  );
}

/** `excludeTests=1` opts in; absent (or anything else) keeps every record. */
export function excludeTestsRequested(query: Record<string, unknown> | undefined) {
  const value = query?.excludeTests;
  return (Array.isArray(value) ? value[0] : value) === "1";
}

export type TestRecordCount = { count: number; excluded: boolean };

/**
 * Drops test journeys and their events when asked. Events of removed journeys
 * are removed too, so they are not reported as orphan events.
 */
export function filterTestRecords<
  S extends Pick<SubmissionRecord, "submissionId" | "structuralOutputJson">,
  E extends Pick<UsageEventRecord, "submissionId">,
>(submissions: S[], events: E[], exclude: boolean) {
  const testIds = new Set(
    submissions.filter(isTestRecord).map(row => row.submissionId)
  );
  KNOWN_TEST_SUBMISSION_IDS.forEach(id => testIds.add(id));
  const testRecords: TestRecordCount = {
    count: submissions.filter(isTestRecord).length,
    excluded: exclude,
  };
  if (!exclude) return { submissions, events, testRecords };
  return {
    submissions: submissions.filter(row => !testIds.has(row.submissionId)),
    events: events.filter(event => !testIds.has(event.submissionId)),
    testRecords,
  };
}
