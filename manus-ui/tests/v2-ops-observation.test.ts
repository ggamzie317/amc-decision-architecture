import { describe, expect, it } from "vitest";
import {
  createFounderOpsJourneyTracker,
  type JourneyTrackingObservation,
} from "../client/src/data/amcFounderOps";
import { trackFounderOps } from "../server/founderOpsApi";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { v2Identity, projectInteractivePatch } from "../shared/interactivePrivacy";

const idKey = "amc_launch_v3_active_submission_id_interactive-v2";
const start = {
  eventType: "preview_started" as const,
  language: "en" as const,
  serviceStorageConsent: true,
  newSubmission: true,
  patch: projectInteractivePatch({ structuralOutputJson: v2Identity }),
};
function storage() {
  const rows = new Map<string, string>();
  return {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => { rows.set(key, value); },
    removeItem: (key: string) => { rows.delete(key); },
  };
}
function responseTracker(body: unknown, status = 200) {
  const session = storage();
  const sent: Record<string, unknown>[] = [];
  const track = createFounderOpsJourneyTracker({
    storageNamespace: "interactive-v2",
    getSessionStorage: () => session,
    getLegacyStorage: () => null,
    fetcher: async (_url, init) => {
      sent.push(JSON.parse(String(init.body)));
      return { status, json: async () => body };
    },
  });
  return { track, session, sent };
}

describe("V2 operations response observation", () => {
  it("reports stored only after the actual store writes and exposes no correlation ID", async () => {
    const session = storage();
    const store = new MemoryFounderOpsStore();
    const observed: JourneyTrackingObservation[] = [];
    const track = createFounderOpsJourneyTracker({
      storageNamespace: "interactive-v2",
      getSessionStorage: () => session,
      getLegacyStorage: () => null,
      fetcher: async (_url, init) => ({
        status: 200,
        json: async () => trackFounderOps(JSON.parse(String(init.body)), store),
      }),
    });
    await track(start, value => observed.push(value));
    const saved = await store.getSubmission(session.getItem(idKey)!);
    expect(saved?.events.map(event => event.eventType)).toEqual(["preview_started"]);
    expect(saved?.submission.answersJson).toEqual({});
    expect(observed).toEqual([{
      eventType: "preview_started", outcome: "stored", reasonCode: "stored", httpStatus: 200,
    }]);
    expect(JSON.stringify(observed)).not.toContain(session.getItem(idKey)!);
  });

  it.each(["backend_unavailable", "storage_unavailable"])("distinguishes HTTP 200 / %s from a successful write", async reason => {
    const { track, session, sent } = responseTracker({ ok: true, stored: false, reason });
    const observed: JourneyTrackingObservation[] = [];
    await track(start, value => observed.push(value));
    expect(observed).toEqual([{
      eventType: "preview_started", outcome: "unavailable", reasonCode: reason, httpStatus: 200,
    }]);
    expect(session.getItem(idKey)).toBeNull();
    expect(sent).toHaveLength(1);
    expect(Object.keys(sent[0])).not.toContain("observer");
  });

  it("does not accept a success-looking body from a failed HTTP response", async () => {
    const { track, session } = responseTracker({ stored: true, submissionId: "AMC-20261013-AAAAAAAA" }, 503);
    const observed: JourneyTrackingObservation[] = [];
    await track(start, value => observed.push(value));
    expect(observed[0]).toMatchObject({ outcome: "unavailable", reasonCode: "http_error", httpStatus: 503 });
    expect(session.getItem(idKey)).toBeNull();
  });

  it.each([
    { stored: true, submissionId: "PRIVATE invalid identifier" },
    { stored: false, reason: "PRIVATE provider or customer detail", secret: "DO NOT EXPOSE" },
    null,
  ])("keeps malformed response details out of observations", async body => {
    const { track } = responseTracker(body);
    const observed: JourneyTrackingObservation[] = [];
    await track(start, value => observed.push(value));
    expect(observed[0]).toEqual({
      eventType: "preview_started", outcome: "unavailable", reasonCode: "invalid_response", httpStatus: 200,
    });
    expect(JSON.stringify(observed)).not.toMatch(/PRIVATE|DO NOT EXPOSE/);
  });

  it("does not send unconsented or baseline-free operations", async () => {
    const { track, sent } = responseTracker({ stored: false });
    const observed: JourneyTrackingObservation[] = [];
    await track({ ...start, serviceStorageConsent: false }, value => observed.push(value));
    await track({ ...start, newSubmission: false, eventType: "scenario_evaluated" }, value => observed.push(value));
    expect(sent).toEqual([]);
    expect(observed.map(value => value.reasonCode)).toEqual(["consent_required", "no_active_journey"]);
  });

  it("keeps queued tracking working after network and observer failures", async () => {
    const session = storage();
    const observed: JourneyTrackingObservation[] = [];
    let attempts = 0;
    const track = createFounderOpsJourneyTracker({
      storageNamespace: "interactive-v2",
      getSessionStorage: () => session,
      getLegacyStorage: () => null,
      fetcher: async () => {
        if (++attempts === 1) throw new Error("PRIVATE transport detail");
        return { status: 200, json: async () => ({ stored: true, submissionId: "AMC-20261013-AAAAAAAA" }) };
      },
    });
    await track(start, value => { observed.push(value); throw new Error("observer failure"); });
    await track(start, value => observed.push(value));
    await track(start, value => observed.push(value));
    expect(attempts).toBe(2);
    expect(observed.map(value => value.reasonCode)).toEqual(["network_error", "stored", "active_journey_resumed"]);
    expect(JSON.stringify(observed)).not.toContain("PRIVATE");
  });
});
