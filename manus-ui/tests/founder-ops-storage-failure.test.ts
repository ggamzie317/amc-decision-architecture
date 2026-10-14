import { describe, expect, it } from "vitest";
import { handleTrack, type ApiResponse } from "../server/vercelFounderOps";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { v2Identity } from "../shared/interactivePrivacy";

describe("Founder Ops bounded storage failures", () => {
  it.each([
    { code: "23514", constraint: "usage_events_event_type_check", expected: "event_contract" },
    { code: "42P01", constraint: "", expected: "schema_missing" },
    { code: "23514", constraint: "PRIVATE other constraint", expected: "schema_constraint" },
    { code: "PRIVATE unknown code", constraint: "", expected: undefined },
  ])("keeps stored=false and returns only a safe category for $code", async ({ code, constraint, expected }) => {
    const store = new MemoryFounderOpsStore();
    const row = await store.createSubmission("en", true);
    store.addEvent = async () => { throw { code, constraint_name: constraint, message: "PRIVATE SQL error", detail: "PRIVATE customer value", query: "PRIVATE query" }; };
    let status = 0;
    let body: any;
    const response: ApiResponse = {
      status(value) { status = value; return this; },
      json(value) { body = value; },
      send() {}, end() {}, setHeader() {},
    };
    await handleTrack({ method: "POST", body: {
      submissionId: row.submissionId, language: "en", serviceStorageConsent: true,
      eventType: "scenario_evaluated", metadata: v2Identity,
    } }, response, store);
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, stored: false, reason: "storage_unavailable", ...(expected ? { failureCode: expected } : {}) });
    expect(JSON.stringify(body)).not.toContain("PRIVATE");
    expect((await store.getSubmission(row.submissionId))?.events).toEqual([]);
  });
});
