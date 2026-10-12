/** Safe execution labels only. Never include a URL, input, key or provider text. */
export const v2EvidenceStages = [
  "request", "initialization", "execution", "configuration", "provider",
  "normalization", "sources", "ready",
] as const;
export const v2EvidenceDiagnostics = [
  "upstream_http", "transport_error", "timeout", "terminal_status",
  "response_json", "response_shape", "assistant_output_missing",
  "citation_mismatch", "duplicate_citation", "invalid_field", "limit_exceeded",
  "no_evidence", "source_probe_failure",
] as const;
export const v2EvidenceDiagnosticFields = [
  "status", "output", "content", "evidenceBlocks", "dimension", "headline",
  "direction", "fact", "whyItMatters", "sourceUrl", "opportunitySignals",
  "frictionSignals", "uncertainties", "implication", "contextConfidence",
] as const;
export const v2SourceFailures = [
  "invalid_destination", "dns", "tls", "timeout", "redirect", "http_denied",
  "http_gone", "http_method", "http_other", "content_gate", "network",
] as const;
export const v2EvidenceReasons = [
  "live", "provider_not_configured", "provider_failure", "source_unavailable",
  "invalid_provider_response", "malformed_request", "service_load_error",
  "service_execution_error",
] as const;

export type V2EvidenceExecution = {
  stage: (typeof v2EvidenceStages)[number];
  diagnostic?: (typeof v2EvidenceDiagnostics)[number];
  field?: (typeof v2EvidenceDiagnosticFields)[number];
  sourceFailure?: (typeof v2SourceFailures)[number];
  upstreamStatus?: number;
};
export type V2EvidenceHttpObservation = Partial<V2EvidenceExecution> & {
  status: number;
  reason: string | null;
};
