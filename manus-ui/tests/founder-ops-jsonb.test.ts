import { describe, expect, it, vi } from "vitest";
import postgres, { type JSONValue, type Sql } from "postgres";

import { PostgresFounderOpsStore } from "../server/founderOpsStore";

type JsonParameter = {
  value: unknown;
  type: 3802;
};

function jsonbTypeof(parameter: JsonParameter) {
  expect(parameter.type).toBe(3802);
  expect(typeof parameter.value).not.toBe("string");
  if (parameter.value === null) return "null";
  if (Array.isArray(parameter.value)) return "array";
  return typeof parameter.value === "object"
    ? "object"
    : typeof parameter.value;
}

function createPostgresHarness() {
  let submission: Record<string, unknown> | null = null;
  const events: Record<string, unknown>[] = [];
  const jsonParameters: JsonParameter[] = [];

  const parameterSql = postgres();
  const json = vi.fn((value: unknown) => {
    const parameter = parameterSql.json(
      value as JSONValue
    ) as unknown as JsonParameter;
    jsonParameters.push(parameter);
    return parameter;
  });

  const tagged = vi.fn(
    async (strings: TemplateStringsArray, ...parameters: unknown[]) => {
      const query = strings.join("?").replace(/\s+/g, " ").trim();
      if (query.startsWith("INSERT INTO submissions")) {
        const now = new Date("2026-09-04T12:00:00.000Z");
        submission = {
          submission_id: parameters[0],
          product_version: parameters[1],
          framework_version: parameters[2],
          language: parameters[3],
          current_stage: "preview_started",
          preview_started_at: now,
          service_storage_consent: parameters[4],
          research_use_consent: false,
          created_at: now,
          updated_at: now,
          answers_json: {},
          structural_output_json: {},
          external_evidence_json: {},
          decision_conditions_json: [],
          safety_margin_structured_data: {},
          existing_fifwm_structured_data: {},
        };
        return [submission];
      }
      if (query.startsWith("INSERT INTO usage_events")) {
        const metadata = parameters[3] as JsonParameter;
        events.push({
          event_id: parameters[0],
          submission_id: parameters[1],
          event_type: parameters[2],
          metadata_json: metadata.value,
          created_at: new Date("2026-09-04T12:01:00.000Z"),
        });
        return [];
      }
      if (query.startsWith("SELECT * FROM submissions"))
        return submission ? [submission] : [];
      if (query.startsWith("SELECT * FROM usage_events")) return events;
      throw new Error(`Unexpected tagged query: ${query}`);
    }
  );

  const unsafe = vi.fn(async (query: string, parameters: unknown[] = []) => {
    if (!submission) return [];
    const assignments = query
      .slice(query.indexOf(" SET ") + 5, query.indexOf(", updated_at"))
      .split(", ");
    assignments.forEach((assignment, index) => {
      const column = assignment.slice(0, assignment.indexOf(" ="));
      const parameter = parameters[index];
      submission![column] =
        typeof parameter === "object" &&
        parameter !== null &&
        "type" in parameter &&
        (parameter as JsonParameter).type === 3802
          ? (parameter as JsonParameter).value
          : parameter;
    });
    submission.updated_at = new Date("2026-09-04T12:01:00.000Z");
    return [{ submission_id: submission.submission_id }];
  });

  const sql = Object.assign(tagged, { json, unsafe }) as unknown as Sql;
  return { sql, json, jsonParameters };
}

describe("Founder Ops native JSONB persistence", () => {
  it("binds actual AMC structured shapes and event metadata as native JSONB", async () => {
    const harness = createPostgresHarness();
    const store = new PostgresFounderOpsStore(harness.sql);
    const created = await store.createSubmission("ko", true);

    const answers = {
      "1": "현재 선택지를 검토하고 있습니다.",
      "2": "서울과 해외 기회를 함께 비교합니다.",
    };
    const structure = {
      caseType: "Constraint-heavy Decision",
      primaryRisk: { name: "Timing", meaning: "검증 전 확정 위험" },
      comparisonRows: [
        { dimension: "Reversibility", optionA: "Medium", optionB: "High" },
      ],
      internalSignals: [{ label: "Safety Margin", status: "Moderate" }],
    };
    const evidence = {
      status: "live",
      confidence: "medium",
      signals: [{ title: "시장 신호", relevant: true, score: 0.82 }],
    };
    const safetyMargin = {
      band: "Moderate",
      signal: { label: "Safety Margin", status: "Moderate" },
      reversibility: { optionA: false, optionB: true },
    };
    const fifwm = {
      signals: [{ label: "Facts", value: "검증 필요", active: true }],
      comparisonRows: [{ dimension: "Impact", optionA: 3, optionB: 4 }],
      internalSignals: [{ label: "Wants", status: "Mixed" }],
    };
    const conditions = ["현금흐름이 안정될 것", "핵심 가설이 검증될 것"];
    const metadata = {
      source: "full_dashboard",
      language: "ko",
      attempt: 1,
      live: true,
      tags: ["qa", "structured"],
    };

    await store.updateSubmission(created.submissionId, {
      answersJson: answers,
      structuralOutputJson: structure,
      externalEvidenceJson: evidence,
      safetyMarginStructuredData: safetyMargin,
      existingFifwmStructuredData: fifwm,
      decisionConditionsJson: conditions,
    });
    await store.addEvent(created.submissionId, "dashboard_generated", metadata);

    expect(harness.json).toHaveBeenCalledTimes(7);
    expect(harness.jsonParameters.map(jsonbTypeof)).toEqual([
      "object",
      "object",
      "object",
      "object",
      "object",
      "array",
      "object",
    ]);

    const detail = await store.getSubmission(created.submissionId);
    expect(detail?.submission.answersJson).toEqual(answers);
    expect(detail?.submission.structuralOutputJson).toEqual(structure);
    expect(detail?.submission.externalEvidenceJson).toEqual(evidence);
    expect(detail?.submission.safetyMarginStructuredData).toEqual(safetyMargin);
    expect(detail?.submission.existingFifwmStructuredData).toEqual(fifwm);
    expect(detail?.submission.decisionConditionsJson).toEqual(conditions);
    expect(detail?.events[0]?.metadataJson).toEqual(metadata);
  });

  it("does not update an omitted structured field and preserves explicit empty shapes", async () => {
    const harness = createPostgresHarness();
    const store = new PostgresFounderOpsStore(harness.sql);
    const created = await store.createSubmission("en", true);

    await store.updateSubmission(created.submissionId, {
      structuralOutputJson: { saved: true },
    });
    await store.updateSubmission(created.submissionId, {
      structuralOutputJson: undefined,
      answersJson: {},
      decisionConditionsJson: [],
    });

    const detail = await store.getSubmission(created.submissionId);
    expect(detail?.submission.structuralOutputJson).toEqual({ saved: true });
    expect(detail?.submission.answersJson).toEqual({});
    expect(detail?.submission.decisionConditionsJson).toEqual([]);
    expect(harness.jsonParameters.slice(-2).map(jsonbTypeof)).toEqual([
      "object",
      "array",
    ]);
  });
});
