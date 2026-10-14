import { getFounderOpsStore } from "./founderOpsStore.js";
import type { V2ResponseDiagnostic } from "./externalIntelligenceV2Service.js";

export type ProviderObservation = {
  provider: "perplexity";
  apiGeneration: "agent-api";
  preset: string;
  status: "live" | "fallback";
  reasonCode: string;
  latencyMs: number;
  timedOut: boolean;
  completedAt: string;
  sourceFailureCategory?: import("./publicSourceAvailability.js").SourceProbeFailure;
  /** Static failure taxonomy and numeric metadata only; no response text or URLs. */
  responseDiagnostic?: V2ResponseDiagnostic;
  upstreamHttpStatus?: number;
  /**
   * Shape of the public request only: enumerated case/area keys and lengths.
   * Never the target or geography text. Lets a no_evidence result be traced
   * to its request scope without storing what the customer typed.
   */
  requestShape?: {
    caseType: string;
    language: "en" | "ko";
    areas: string[];
    defaultAreas: boolean;
    targetLength: number;
    keyFactCount?: number;
    geographyLength: number;
  };
};

export async function recordProviderObservation(
  tracking: unknown,
  observation: ProviderObservation
) {
  console.info(
    JSON.stringify({ event: "amc_external_evidence", ...observation })
  );
  if (!tracking || typeof tracking !== "object") return;
  const { submissionId, requestId } = tracking as Record<string, unknown>;
  if (
    typeof submissionId !== "string" ||
    !/^AMC-\d{8}-[A-F0-9]{8}$/.test(submissionId) ||
    typeof requestId !== "string" ||
    !/^[a-f0-9-]{36}$/.test(requestId)
  )
    return;
  const store = getFounderOpsStore();
  if (!store.available) return;
  // Annotate only the matching NEW request event; never update submission/derived data.
  await store.annotateEvidenceRequest?.(submissionId, requestId, {
    ...observation,
  });
}
