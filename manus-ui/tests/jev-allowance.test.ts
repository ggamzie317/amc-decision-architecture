import { describe, it, expect, vi, afterEach } from "vitest";
import { createJevScenarioHandler } from "../server/jevScenario";
import { metrics } from "../server/jevScenarioContract";
import {
  JEV_DAILY_LIMIT,
  JEV_PER_JOURNEY_LIMIT,
  MemoryFounderOpsStore,
  PostgresFounderOpsStore,
} from "../server/founderOpsStore";
import { identity, projectInteractivePatch } from "../shared/interactivePrivacy";

const baselineBands = {
  financialRoom: "developing",
  reversibility: "strong",
  downsideExposure: "low",
  internalReadiness: "developing",
  optionBSupport: "weak",
  constraintLoad: "material",
  externalValidation: "unknown",
} as const;
// Eight distinct one-variable scenarios: each is a different packet (fingerprint).
const changes: [keyof typeof baselineBands, string][] = [
  ["financialRoom", "strong"],
  ["financialRoom", "weak"],
  ["reversibility", "developing"],
  ["reversibility", "weak"],
  ["internalReadiness", "strong"],
  ["internalReadiness", "weak"],
  ["optionBSupport", "strong"],
  ["externalValidation", "strong"],
];
const packet = (i = 0) => {
  const [key, band] = changes[i];
  return {
    caseType: "Entrepreneurship",
    baselineBands,
    scenarioBands: { ...baselineBands, [key]: band },
    changedVariables: [key],
    baselinePosture: "Preserve and Validate",
    scenarioPosture: "Preserve and Validate",
    safetyMargin: ["developing", "developing"],
    changingFamilies: [["resource"], ["resource"]],
  };
};
const reply = () => ({
  model: "typesafe-ai/jev",
  provider_metadata: {
    gateway: {
      routing: {
        originalModelId: "typesafe-ai/jev",
        canonicalSlug: "typesafe-ai/jev",
        resolvedProvider: "typesafe-ai",
        finalProvider: "typesafe-ai",
      },
    },
  },
  answers: Object.fromEntries(
    metrics.map(k => [
      k,
      {
        type: "choice",
        choice: "medium",
        confidence: 0.7,
        probabilities: { low: 0.1, medium: 0.7, high: 0.2 },
      },
    ])
  ),
});
async function journey(store: MemoryFounderOpsStore) {
  const s = await store.createSubmission("en", true);
  await store.updateSubmission(
    s.submissionId,
    projectInteractivePatch({
      caseType: "Entrepreneurship",
      fullIntakeCompletedAt: new Date().toISOString(),
      structuralOutputJson: {
        ...identity,
        baselineBands,
        currentStructuralPosture: { label: "Preserve and Validate" },
        safetyMargin: { band: "developing" },
        changingPlays: [{ family: "resource" }],
      },
    })
  );
  return s.submissionId;
}
async function call(
  handler: ReturnType<typeof createJevScenarioHandler>,
  id: string,
  body: unknown
) {
  let value: any;
  await handler({ method: "POST", body, headers: { "x-amc-submission-id": id } }, {
    setHeader: vi.fn(),
    status() {
      return this;
    },
    json(v: unknown) {
      value = v;
    },
    end: vi.fn(),
    send: vi.fn(),
  } as any);
  return value;
}
function harness(store = new MemoryFounderOpsStore()) {
  const fetcher = vi.fn(async () => new Response(JSON.stringify(reply())));
  const handler = createJevScenarioHandler({
    store,
    enabled: true,
    credential: () => "TEST_ONLY",
    fetcher,
  });
  return { store, fetcher, handler };
}
const stages = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls
    .map(([line]) => {
      try {
        return JSON.parse(String(line));
      } catch {
        return null;
      }
    })
    .filter(e => e?.event === "amc_jev_unavailable")
    .map(e => e.stage);
const requested = (store: MemoryFounderOpsStore, id?: string) =>
  store.events.filter(
    e =>
      e.eventType === "jev_assessment_requested" &&
      e.metadataJson.packetFingerprint &&
      (!id || e.submissionId === id)
  ).length;

afterEach(() => vi.restoreAllMocks());

describe("JEV allowance (owner decision 2026-10-17)", () => {
  it("keeps the owner-facing limits as named constants", () => {
    expect(JEV_PER_JOURNEY_LIMIT).toBe(6);
    expect(JEV_DAILY_LIMIT).toBe(200);
  });

  it("allows six assessments per journey and refuses the seventh with the guard stage", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const { store, fetcher, handler } = harness();
    const id = await journey(store);
    for (let i = 0; i < 6; i++)
      expect((await call(handler, id, packet(i))).status).toBe("available");
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(await call(handler, id, packet(6))).toEqual({ status: "unavailable" });
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(stages(log)).toEqual(["guard"]);
    expect(requested(store, id)).toBe(6);
    expect(store.events.at(-1)?.eventType).toBe("jev_assessment_unavailable");
  });

  it("still serves another journey after one journey reaches its cap", async () => {
    const { store, fetcher, handler } = harness();
    const first = await journey(store);
    for (let i = 0; i < 7; i++) await call(handler, first, packet(i));
    const second = await journey(store);
    expect((await call(handler, second, packet(0))).status).toBe("available");
    expect(fetcher).toHaveBeenCalledTimes(7);
    expect(requested(store, second)).toBe(1);
  });

  it("never sends the same packet for the same journey twice", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const { store, fetcher, handler } = harness();
    const id = await journey(store);
    expect((await call(handler, id, packet(0))).status).toBe("available");
    expect(await call(handler, id, packet(0))).toEqual({ status: "unavailable" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(stages(log)).toEqual(["guard"]);
    // The store refuses a duplicate fingerprint directly, too.
    expect(await store.reserveJevScenario(id, "fp-a")).toBe(true);
    expect(await store.reserveJevScenario(id, "fp-a")).toBe(false);
  });

  it(`refuses at the service-wide daily ceiling of ${JEV_DAILY_LIMIT}`, async () => {
    const store = new MemoryFounderOpsStore();
    let n = 0;
    while (requested(store) < JEV_DAILY_LIMIT) {
      const id = await journey(store);
      for (let i = 0; i < JEV_PER_JOURNEY_LIMIT && requested(store) < JEV_DAILY_LIMIT; i++)
        expect(await store.reserveJevScenario(id, `fp-${n++}`)).toBe(true);
    }
    const fresh = await journey(store);
    expect(await store.reserveJevScenario(fresh, "fp-next")).toBe(false);
    expect(requested(store)).toBe(JEV_DAILY_LIMIT);
  });

  it("refuses through the handler at an injected small ceiling, without a Gateway call", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const { store, fetcher, handler } = harness(
      new MemoryFounderOpsStore({ perJourney: 6, daily: 2 })
    );
    const a = await journey(store),
      b = await journey(store),
      c = await journey(store);
    expect((await call(handler, a, packet(0))).status).toBe("available");
    expect((await call(handler, b, packet(0))).status).toBe("available");
    expect(await call(handler, c, packet(0))).toEqual({ status: "unavailable" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(stages(log)).toEqual(["guard"]);
  });

  it("does not count reservations older than 24 hours toward the daily ceiling", async () => {
    const store = new MemoryFounderOpsStore({ perJourney: 6, daily: 2 });
    const old = await journey(store);
    expect(await store.reserveJevScenario(old, "old-1")).toBe(true);
    expect(await store.reserveJevScenario(old, "old-2")).toBe(true);
    const id = await journey(store);
    expect(await store.reserveJevScenario(id, "new-1")).toBe(false);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000 - 60_000).toISOString();
    for (const e of store.events) e.createdAt = dayAgo;
    expect(await store.reserveJevScenario(id, "new-1")).toBe(true);
    expect(await store.reserveJevScenario(id, "new-2")).toBe(true);
    expect(await store.reserveJevScenario(id, "new-3")).toBe(false);
  });

  it("old reservations still count toward the per-journey cap (it is not time-limited)", async () => {
    const store = new MemoryFounderOpsStore();
    const id = await journey(store);
    for (let i = 0; i < 6; i++) expect(await store.reserveJevScenario(id, `fp-${i}`)).toBe(true);
    for (const e of store.events) e.createdAt = "2026-01-01T00:00:00.000Z";
    expect(await store.reserveJevScenario(id, "fp-7")).toBe(false);
  });
});

describe("Postgres JEV allowance query shape", () => {
  function fakeSql(journeyRow: Record<string, unknown>, dayRow: Record<string, unknown>) {
    const queries: { text: string; values: unknown[] }[] = [];
    const tx: any = (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join("$").replace(/\s+/g, " ").trim();
      queries.push({ text, values });
      if (/BOOL_OR/.test(text)) return Promise.resolve([journeyRow]);
      if (/INTERVAL '24 hours'/.test(text)) return Promise.resolve([dayRow]);
      return Promise.resolve([]);
    };
    tx.json = (v: unknown) => v;
    const sql: any = { begin: async (cb: (t: unknown) => unknown) => cb(tx) };
    return { sql, queries };
  }

  it("locks, counts only this journey, then the rolling 24 hours, then inserts", async () => {
    const { sql, queries } = fakeSql({ reserved: 5, duplicate: false }, { reserved: 199 });
    const store = new PostgresFounderOpsStore(sql);
    expect(await store.reserveJevScenario("AMC-20261017-AAAAAAAA", "fp")).toBe(true);
    expect(queries).toHaveLength(4);
    expect(queries[0].text).toContain("pg_advisory_xact_lock(590059)");
    expect(queries[1].text).toContain("submission_id = $");
    expect(queries[1].values).toEqual(["fp", "AMC-20261017-AAAAAAAA"]);
    expect(queries[2].text).toContain("created_at > NOW() - INTERVAL '24 hours'");
    expect(queries[2].text).not.toContain("submission_id");
    expect(queries[3].text).toContain("INSERT INTO usage_events");
  });

  it.each([
    [{ reserved: 6, duplicate: false }, { reserved: 0 }, 2],
    [{ reserved: 0, duplicate: true }, { reserved: 0 }, 2],
    [{ reserved: 0, duplicate: false }, { reserved: 200 }, 3],
  ])("refuses %o / %o without inserting", async (j, d, count) => {
    const { sql, queries } = fakeSql(j, d);
    const store = new PostgresFounderOpsStore(sql);
    expect(await store.reserveJevScenario("AMC-20261017-AAAAAAAA", "fp")).toBe(false);
    expect(queries).toHaveLength(count);
    expect(queries.some(q => q.text.includes("INSERT"))).toBe(false);
  });
});
