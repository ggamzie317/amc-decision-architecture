import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  inspectFounderOpsDatabase,
  missingUsageEventTypes,
  REQUIRED_SCHEMA,
} from "../server/founderOpsHealth";
import { usageEventTypes } from "../server/founderOpsTypes";

vi.mock("postgres", () => ({ default: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const root = path.basename(process.cwd()) === "manus-ui" ? process.cwd() : path.join(process.cwd(), "manus-ui");
const legacy = usageEventTypes.filter(type => !/^(?:simulator_|scenario_|jev_)/.test(type));
const check = (events: readonly string[]) =>
  `CHECK ((event_type = ANY (ARRAY[${events.map(type => `'${type}'::text`).join(", ")}])) )`;
function migrationEvents(file: string) {
  const source = fs.readFileSync(path.join(root, "db", file), "utf8");
  const list = /CHECK\s*\(\s*event_type\s+IN\s*\(([\s\S]*?)\)\s*\)/.exec(source)?.[1];
  return { source, events: [...(list ?? "").matchAll(/'([a-z_]+)'/g)].map(match => match[1]) };
}

describe("Founder Ops event schema compatibility", () => {
  it("catches the legacy constraint despite complete table/column coverage", () => {
    expect(missingUsageEventTypes([check(legacy)])).toEqual(usageEventTypes.filter(type => !legacy.includes(type)));
    expect(missingUsageEventTypes([check(legacy)])).toContain("scenario_evaluated");
  });
  it("accepts the canonical PostgreSQL allowlist after the upgrade", () => {
    expect(missingUsageEventTypes([check(usageEventTypes)])).toEqual([]);
  });
  it.each([{ rules: [] }, { rules: ["CHECK (event_type <> 'scenario_evaluated'::text)"] }, { rules: ["CHECK (true)"] }])("does not label an absent or unrecognized rule ready", ({ rules }) => {
    expect(missingUsageEventTypes(rules)).toEqual(usageEventTypes);
  });
  it("does not ignore an older restrictive rule alongside a new rule", () => {
    expect(missingUsageEventTypes([check(usageEventTypes), check(legacy)])).toContain("scenario_reset");
  });
  it("keeps fresh and existing-database migrations in sync with the server contract", () => {
    for (const file of ["001_amc_founder_ops.sql", "002_amc_usage_event_contract.sql"]) {
      const { events } = migrationEvents(file);
      expect(events).toHaveLength(usageEventTypes.length);
      expect([...events].sort()).toEqual([...usageEventTypes].sort());
      expect(new Set(events).size).toBe(events.length);
    }
    const { source } = migrationEvents("002_amc_usage_event_contract.sql");
    expect(source).not.toMatch(/\b(?:DELETE|TRUNCATE|DROP TABLE|DROP COLUMN|UPDATE|INSERT)\b/i);
    expect(source).toMatch(/BEGIN;[\s\S]*COMMIT;/);
    expect(source).toContain("SET LOCAL lock_timeout = '5s'");
    expect(source).toContain("SET LOCAL statement_timeout = '30s'");
    expect(fs.readFileSync(path.join(root, "scripts/db_migrate.ts"), "utf8")).toContain("002_amc_usage_event_contract.sql");
  });
  it.each([false, true])("inspects live constraint metadata and closes the read-only connection (upgraded=%s)", async upgraded => {
    const queries: string[] = [];
    const sql = Object.assign(async (strings: TemplateStringsArray) => {
      const query = strings.join("?");
      queries.push(query);
      if (query.includes("information_schema.columns"))
        return Object.entries(REQUIRED_SCHEMA).flatMap(([table_name, columns]) => columns.map(column_name => ({ table_name, column_name })));
      if (query.includes("pg_constraint")) return [{ definition: check(upgraded ? usageEventTypes : legacy) }];
      throw new Error("Unexpected metadata query");
    }, { end: vi.fn(async () => undefined) });
    vi.mocked(postgres).mockReturnValue(sql as unknown as ReturnType<typeof postgres>);
    const result = await inspectFounderOpsDatabase("postgres://synthetic-fixture");
    expect(result.database).toBe("connected");
    expect(result.schema).toBe(upgraded ? "ready" : "missing_migration");
    expect(result.usageEvents).toBe(upgraded ? "ready" : "unavailable");
    expect(result.submissionStorage).toBe("ready");
    expect(result.missing).toEqual(upgraded ? [] : ["usage_events.event_type_support"]);
    expect(queries).toHaveLength(2);
    expect(queries.join("\n")).not.toMatch(/SELECT\s+\*|\b(?:INSERT|UPDATE|DELETE|ALTER)\b/i);
    expect(sql.end).toHaveBeenCalledOnce();
  });
});
