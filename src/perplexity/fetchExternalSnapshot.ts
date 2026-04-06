import { PerplexityClient, type PerplexityClientOptions } from "./client";
import {
  buildExternalSnapshotPrompt,
  type ExternalSnapshotPromptInput,
} from "./buildExternalSnapshotPrompt";

export type MarketDirectionStatus = "supportive" | "mixed" | "constrained";
export type PressureStatus = "contained" | "moderate" | "elevated";

export interface ExternalSnapshotDimension<TStatus extends string> {
  status: TStatus;
  summary: string;
  evidence: string[];
}

export interface ExternalSnapshotResult {
  market_direction: ExternalSnapshotDimension<MarketDirectionStatus>;
  competition_pressure: ExternalSnapshotDimension<PressureStatus>;
  economic_pressure: ExternalSnapshotDimension<PressureStatus>;
  transition_friction: ExternalSnapshotDimension<PressureStatus>;
  source_notes: string[];
  market_data_date: string;
}

export interface FetchExternalSnapshotOptions {
  model?: string;
  searchDomainFilter?: string[];
  clientOptions?: PerplexityClientOptions;
  temperature?: number;
}

export interface FetchExternalSnapshotResponse {
  snapshot: ExternalSnapshotResult;
  model?: string;
  requestId?: string;
  citations: string[];
}

const EXTERNAL_SNAPSHOT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "market_direction",
    "competition_pressure",
    "economic_pressure",
    "transition_friction",
    "source_notes",
    "market_data_date",
  ],
  properties: {
    market_direction: buildDimensionSchema(["supportive", "mixed", "constrained"]),
    competition_pressure: buildDimensionSchema(["contained", "moderate", "elevated"]),
    economic_pressure: buildDimensionSchema(["contained", "moderate", "elevated"]),
    transition_friction: buildDimensionSchema(["contained", "moderate", "elevated"]),
    source_notes: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 1,
      maxItems: 4,
    },
    market_data_date: {
      type: "string",
      minLength: 1,
      description: "Use YYYY-MM-DD when known; otherwise provide the best available date marker.",
    },
  },
};

function buildDimensionSchema(statusEnum: string[]): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["status", "summary", "evidence"],
    properties: {
      status: {
        type: "string",
        enum: statusEnum,
      },
      summary: {
        type: "string",
        minLength: 1,
      },
      evidence: {
        type: "array",
        items: { type: "string", minLength: 1 },
        minItems: 1,
        maxItems: 3,
      },
    },
  };
}

export async function fetchExternalSnapshot(
  input: ExternalSnapshotPromptInput,
  options: FetchExternalSnapshotOptions = {},
): Promise<FetchExternalSnapshotResponse> {
  const prompt = buildExternalSnapshotPrompt(input);
  const client = new PerplexityClient(options.clientOptions);

  const completion = await client.createJsonSchemaCompletion({
    model: options.model,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    jsonSchema: {
      name: "amc_external_snapshot",
      schema: EXTERNAL_SNAPSHOT_SCHEMA,
      strict: true,
    },
    searchDomainFilter: options.searchDomainFilter,
    temperature: options.temperature ?? 0,
  });

  const parsed = parseJson(completion.content);
  const snapshot = assertExternalSnapshotShape(parsed);

  return {
    snapshot,
    model: completion.model,
    requestId: completion.id,
    citations: completion.citations,
  };
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Perplexity content is not valid JSON: ${String(error)}`);
  }
}

function assertExternalSnapshotShape(value: unknown): ExternalSnapshotResult {
  if (!isRecord(value)) {
    throw new Error("External snapshot payload is not an object");
  }

  return {
    market_direction: assertDimension(value.market_direction, ["supportive", "mixed", "constrained"]),
    competition_pressure: assertDimension(value.competition_pressure, ["contained", "moderate", "elevated"]),
    economic_pressure: assertDimension(value.economic_pressure, ["contained", "moderate", "elevated"]),
    transition_friction: assertDimension(value.transition_friction, ["contained", "moderate", "elevated"]),
    source_notes: assertStringArray(value.source_notes, "source_notes", 1, 4),
    market_data_date: assertNonEmptyString(value.market_data_date, "market_data_date"),
  };
}

function assertDimension<TStatus extends string>(
  value: unknown,
  statuses: readonly TStatus[],
): ExternalSnapshotDimension<TStatus> {
  if (!isRecord(value)) {
    throw new Error("Dimension value is not an object");
  }

  const status = assertEnum(value.status, "status", statuses);
  const summary = assertNonEmptyString(value.summary, "summary");
  const evidence = assertStringArray(value.evidence, "evidence", 1, 3);

  return { status, summary, evidence };
}

function assertEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  const normalized = assertNonEmptyString(value, field) as T;
  if (!allowed.includes(normalized)) {
    throw new Error(`${field} must be one of: ${allowed.join(", ")}. Received: ${normalized}`);
  }
  return normalized;
}

function assertStringArray(
  value: unknown,
  field: string,
  minItems: number,
  maxItems: number,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  if (value.length < minItems || value.length > maxItems) {
    throw new Error(`${field} must have ${minItems}-${maxItems} items`);
  }

  return value.map((item, index) => assertNonEmptyString(item, `${field}[${index}]`));
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be non-empty`);
  }
  return trimmed;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
