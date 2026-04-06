import type { AmcExternalSnapshotOverride } from "../amc/externalSnapshotOverride";
import {
  fetchExternalSnapshot,
  type ExternalSnapshotResult,
  type FetchExternalSnapshotOptions,
} from "./fetchExternalSnapshot";

export interface ResolvePerplexityExternalOptions {
  enabled?: boolean;
  model?: string;
  domainFilter?: string[];
  reportLanguage?: "ko" | "en" | "zh";
}

export interface ResolvePerplexityExternalResult {
  override?: AmcExternalSnapshotOverride;
  warnings: string[];
  used: boolean;
}

export async function resolvePerplexityExternalSnapshot(
  rawIntake: any,
  options: ResolvePerplexityExternalOptions = {},
): Promise<ResolvePerplexityExternalResult> {
  const warnings: string[] = [];
  const enabled = options.enabled ?? process.env.AMC_ENABLE_PERPLEXITY_EXTERNAL === "1";

  if (!enabled) {
    return { warnings, used: false };
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    warnings.push("Perplexity external snapshot enabled but PERPLEXITY_API_KEY is missing; using internal external snapshot.");
    return { warnings, used: false };
  }

  try {
    const caseSummary = buildCaseSummary(rawIntake);
    if (!caseSummary) {
      warnings.push("Perplexity external snapshot skipped because case summary is empty; using internal external snapshot.");
      return { warnings, used: false };
    }

    const fetchOptions: FetchExternalSnapshotOptions = {
      model: options.model,
      searchDomainFilter: options.domainFilter ?? parseDomainFilterEnv(process.env.AMC_PERPLEXITY_DOMAIN_FILTER),
    };

    const response = await fetchExternalSnapshot(
      {
        caseSummary,
        optionsUnderConsideration: toStringOrUndefined(rawIntake?.optionsUnderConsideration),
        location: toStringOrUndefined(rawIntake?.location),
        currentRoleCompany: toStringOrUndefined(rawIntake?.currentRoleCompany),
        reportLanguage: options.reportLanguage ?? parseLanguage(rawIntake?.lang) ?? parseLanguage(process.env.AMC_PERPLEXITY_LANG),
        asOfDate: new Date().toISOString().slice(0, 10),
      },
      fetchOptions,
    );

    return {
      override: mapToAmcExternalSnapshotOverride(response.snapshot),
      warnings,
      used: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(`Perplexity external snapshot failed (${message}); using internal external snapshot.`);
    return { warnings, used: false };
  }
}

function mapToAmcExternalSnapshotOverride(snapshot: ExternalSnapshotResult): AmcExternalSnapshotOverride {
  return {
    source: "perplexity_sonar",
    marketDirection: snapshot.market_direction,
    competitionPressure: snapshot.competition_pressure,
    economicPressure: snapshot.economic_pressure,
    transitionFriction: snapshot.transition_friction,
    sourceNotes: snapshot.source_notes,
    marketDataDate: snapshot.market_data_date,
  };
}

function buildCaseSummary(rawIntake: any): string {
  const lines = [
    rawIntake?.mainDecision,
    rawIntake?.optionsUnderConsideration,
    rawIntake?.forcedChoiceToday,
    rawIntake?.nonNegotiable,
    rawIntake?.biggestRisks,
    ...(Array.isArray(rawIntake?.topPriorities) ? rawIntake.topPriorities : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  return lines.join(" ");
}

function parseDomainFilterEnv(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const domains = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return domains.length > 0 ? domains : undefined;
}

function parseLanguage(value: unknown): "ko" | "en" | "zh" | undefined {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "ko" || normalized === "en" || normalized === "zh") {
    return normalized;
  }
  return undefined;
}

function toStringOrUndefined(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}
