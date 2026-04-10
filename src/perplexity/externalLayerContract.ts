import type {
  AmcExternalSnapshotOverride,
  OverrideDimension,
  OverrideMarketDirectionStatus,
  OverridePressureStatus,
} from "../amc/externalSnapshotOverride";

export interface ExternalLayerContractV1 {
  market_direction: ContractDimension<OverrideMarketDirectionStatus>;
  competition_pressure: ContractDimension<OverridePressureStatus>;
  economic_pressure: ContractDimension<OverridePressureStatus>;
  transition_friction: ContractDimension<OverridePressureStatus>;
  source_notes: string[];
  market_data_date: string;
}

interface ContractDimension<TStatus extends string> {
  status: TStatus;
  summary: string;
  evidence: string[];
}

export function normalizeExternalLayerContractV1(raw: unknown): ExternalLayerContractV1 {
  const candidate = unwrapContractPayload(raw);

  return {
    market_direction: assertDimension(
      candidate.market_direction,
      "market_direction",
      ["supportive", "mixed", "constrained"],
    ),
    competition_pressure: assertDimension(
      candidate.competition_pressure,
      "competition_pressure",
      ["contained", "moderate", "elevated"],
    ),
    economic_pressure: assertDimension(
      candidate.economic_pressure,
      "economic_pressure",
      ["contained", "moderate", "elevated"],
    ),
    transition_friction: assertDimension(
      candidate.transition_friction,
      "transition_friction",
      ["contained", "moderate", "elevated"],
    ),
    source_notes: assertStringArray(candidate.source_notes, "source_notes", 1, 8),
    market_data_date: assertString(candidate.market_data_date, "market_data_date"),
  };
}

export function toExternalSnapshotOverride(
  contract: ExternalLayerContractV1,
): AmcExternalSnapshotOverride {
  return {
    source: "perplexity_sonar",
    marketDirection: toOverrideDimension(contract.market_direction),
    competitionPressure: toOverrideDimension(contract.competition_pressure),
    economicPressure: toOverrideDimension(contract.economic_pressure),
    transitionFriction: toOverrideDimension(contract.transition_friction),
    sourceNotes: contract.source_notes,
    marketDataDate: contract.market_data_date,
  };
}

function unwrapContractPayload(raw: unknown): Record<string, unknown> {
  const base = assertRecord(raw, "external-layer payload");

  if (isContractPayload(base)) {
    return base;
  }
  if (isRecord(base.snapshot) && isContractPayload(base.snapshot)) {
    return base.snapshot;
  }
  if (isRecord(base.response) && isRecord(base.response.snapshot) && isContractPayload(base.response.snapshot)) {
    return base.response.snapshot;
  }

  throw new Error(
    "external-layer payload does not match contract v1 shape (expected contract object, snapshot, or response.snapshot)",
  );
}

function isContractPayload(value: Record<string, unknown>): boolean {
  return (
    value.market_direction !== undefined &&
    value.competition_pressure !== undefined &&
    value.economic_pressure !== undefined &&
    value.transition_friction !== undefined
  );
}

function toOverrideDimension<TStatus extends string>(
  dimension: ContractDimension<TStatus>,
): OverrideDimension<TStatus> {
  return {
    status: dimension.status,
    summary: dimension.summary,
    evidence: dimension.evidence,
  };
}

function assertDimension<TStatus extends string>(
  raw: unknown,
  field: string,
  statuses: readonly TStatus[],
): ContractDimension<TStatus> {
  const value = assertRecord(raw, field);
  const status = assertEnum(value.status, `${field}.status`, statuses);
  const summary = assertString(value.summary, `${field}.summary`);
  const evidence = assertStringArray(value.evidence, `${field}.evidence`, 1, 8);

  return { status, summary, evidence };
}

function assertEnum<T extends string>(
  raw: unknown,
  field: string,
  allowed: readonly T[],
): T {
  const value = assertString(raw, field) as T;
  if (!allowed.includes(value)) {
    throw new Error(`${field} must be one of: ${allowed.join(", ")} (received: ${value})`);
  }
  return value;
}

function assertStringArray(
  raw: unknown,
  field: string,
  minLength: number,
  maxLength: number,
): string[] {
  if (!Array.isArray(raw)) {
    throw new Error(`${field} must be an array`);
  }
  if (raw.length < minLength || raw.length > maxLength) {
    throw new Error(`${field} must have ${minLength}-${maxLength} items`);
  }
  return raw.map((item, index) => assertString(item, `${field}[${index}]`));
}

function assertString(raw: unknown, field: string): string {
  if (typeof raw !== "string") {
    throw new Error(`${field} must be a string`);
  }
  const value = raw.trim();
  if (!value) {
    throw new Error(`${field} must be non-empty`);
  }
  return value;
}

function assertRecord(raw: unknown, field: string): Record<string, unknown> {
  if (!isRecord(raw)) {
    throw new Error(`${field} must be an object`);
  }
  return raw;
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
}
