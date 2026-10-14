import { unavailableIntelligence } from "../../client/src/data/externalIntelligenceV2.js";
import type { V2EvidenceLanguage } from "../../shared/externalIntelligenceV2Request.js";
import { caseTypes } from "../../shared/interactivePrivacy.js";

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
  setHeader(name: string, value: string): void;
};
type Service = typeof import("../../server/externalIntelligenceV2Service.js");
type Parser = typeof import("../../shared/externalIntelligenceV2Request.js");
type Load = () => Promise<{ service: Service; parser: Parser }>;
const load: Load = async () => ({
  service: await import("../../server/externalIntelligenceV2Service.js"),
  parser: await import("../../shared/externalIntelligenceV2Request.js"),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleV2ExternalIntelligence(req, res);
}

export async function handleV2ExternalIntelligence(
  req: VercelRequest,
  res: VercelResponse,
  loadService: Load = load
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-AMC-Evidence-Stage", "request");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const language: V2EvidenceLanguage =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    (body as { language?: unknown }).language === "ko"
      ? "ko"
      : "en";
  const rawCaseType =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { caseType?: unknown }).caseType
      : null;
  const caseType = caseTypes.includes(rawCaseType as never)
    ? (rawCaseType as string)
    : "General Career Reconfiguration";
  const unavailable = () => unavailableIntelligence(caseType, language);
  if (!body || JSON.stringify(body).length > 4096) {
    res.setHeader("X-AMC-Evidence-Reason", "malformed_request");
    res.status(400).json(unavailable());
    return;
  }
  let loaded: Awaited<ReturnType<Load>>;
  try {
    res.setHeader("X-AMC-Evidence-Stage", "initialization");
    loaded = await loadService();
  } catch {
    res.setHeader("X-AMC-Evidence-Reason", "service_load_error");
    res.status(503).json(unavailable());
    return;
  }
  try {
    const { service, parser } = loaded;
    const request = parser.parseV2EvidenceRequest(body);
    if (!request) {
      res.setHeader("X-AMC-Evidence-Stage", "request");
      res.setHeader("X-AMC-Evidence-Reason", "malformed_request");
      res.status(400).json(unavailable());
      return;
    }
    res.setHeader("X-AMC-Evidence-Stage", "execution");
    const result = await service.resolveV2ExternalIntelligence(request, {
      onReason: reason => res.setHeader("X-AMC-Evidence-Reason", reason),
      onDiagnostics: execution => {
        res.setHeader("X-AMC-Evidence-Stage", execution.stage);
        if (execution.diagnostic) res.setHeader("X-AMC-Evidence-Diagnostic", execution.diagnostic);
        if (execution.field) res.setHeader("X-AMC-Evidence-Field", execution.field);
        if (execution.sourceFailure) res.setHeader("X-AMC-Source-Check", execution.sourceFailure);
        if (execution.upstreamStatus) res.setHeader("X-AMC-Upstream-Status", String(execution.upstreamStatus));
      },
    });
    res.status(result.status === "live" ? 200 : 503).json(result);
  } catch {
    res.setHeader("X-AMC-Evidence-Reason", "service_execution_error");
    res.status(503).json(unavailable());
  }
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
