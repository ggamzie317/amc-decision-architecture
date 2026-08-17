type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
  setHeader(name: string, value: string): void;
};

type Language = "en" | "kr";
type RouteFallbackReason = "malformed_request" | "service_load_error";

type ExternalSnapshotService = {
  parseWebExternalSnapshotRequest(raw: unknown): unknown | null;
  resolveWebExternalSnapshot(request: unknown): Promise<unknown>;
  buildFallbackSnapshot(language: Language, reason: "malformed_request"): unknown;
};

type LoadExternalSnapshotService = () => Promise<ExternalSnapshotService>;

const loadExternalSnapshotService: LoadExternalSnapshotService = () =>
  import("../../server/externalSnapshotService.js") as Promise<ExternalSnapshotService>;

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleExternalSnapshot(req, res);
}

export async function handleExternalSnapshot(
  req: VercelRequest,
  res: VercelResponse,
  loadService: LoadExternalSnapshotService = loadExternalSnapshotService,
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", process.env.AMC_CORS_ORIGIN || "*");
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

  const rawBody = typeof req.body === "string" ? safeJsonParse(req.body) : req.body;
  const language = requestLanguage(rawBody);
  if (!isPotentialExternalSnapshotRequest(rawBody)) {
    res.status(400).json(buildRouteFallbackSnapshot(language, "malformed_request"));
    return;
  }

  try {
    const { buildFallbackSnapshot, parseWebExternalSnapshotRequest, resolveWebExternalSnapshot } =
      await loadService();
    const request = parseWebExternalSnapshotRequest(rawBody);
    if (!request) {
      res.status(400).json(buildFallbackSnapshot(language, "malformed_request"));
      return;
    }

    res.status(200).json(await resolveWebExternalSnapshot(request));
  } catch {
    res.status(200).json(buildRouteFallbackSnapshot(language, "service_load_error"));
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requestLanguage(value: unknown): Language {
  return isRecord(value) && value.language === "kr" ? "kr" : "en";
}

function isPotentialExternalSnapshotRequest(value: unknown) {
  if (!isRecord(value) || (value.language !== "en" && value.language !== "kr")) return false;

  return (
    isBoundedString(value.caseType, 120) &&
    isBoundedString(value.optionA, 240) &&
    isBoundedString(value.optionB, 240) &&
    isBoundedString(value.currentDecision, 1200) &&
    isOptionalBoundedString(value.externalPressure, 1200) &&
    isOptionalBoundedString(value.validationNeed, 1200)
  );
}

function isBoundedString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maxLength;
}

function isOptionalBoundedString(value: unknown, maxLength: number) {
  return value === undefined || (typeof value === "string" && value.trim().length <= maxLength);
}

function buildRouteFallbackSnapshot(language: Language, reason: RouteFallbackReason) {
  const isKr = language === "kr";
  const isMalformed = reason === "malformed_request";
  return {
    status: "fallback",
    confidence: "low",
    reasonCode: reason,
    generatedAtLabel: isKr ? "Fallback · Live 검색 미적용" : "Fallback · Live search unavailable",
    externalSignals: [
      {
        label: "External Validation",
        direction: "mixed",
        reading: isKr
          ? "현재 결정에는 외부 시장과 역할 맥락에 대한 추가 검증이 필요합니다."
          : "This decision still requires validation against external market and role context.",
      },
      {
        label: "Evidence Quality",
        direction: "caution",
        reading: isKr
          ? "현재 응답은 live 검색 결과가 아닌 안전한 fallback입니다."
          : "This response is a safe fallback, not a live search result.",
      },
      {
        label: "Decision Timing",
        direction: "supportive",
        reading: isKr
          ? "외부 근거가 보강되기 전에는 Reversibility를 유지하는 접근이 적절합니다."
          : "A reversible approach remains appropriate until external evidence is strengthened.",
      },
    ],
    sourceNotes: [
      {
        sourceLabel: isMalformed ? "AMC request validation" : "AMC route fallback context",
        note: isMalformed
          ? isKr
            ? "요청 맥락이 충분하지 않아 외부 근거를 생성하지 않았습니다."
            : "The request context was incomplete, so external evidence was not generated."
          : isKr
            ? "외부 근거 서비스를 불러오지 못해 안전한 fallback 맥락을 제공합니다."
            : "The external evidence service could not be loaded, so safe fallback context is in use.",
        evidenceType: "general",
      },
    ],
    uncertaintyNotes: [
      isMalformed
        ? isKr
          ? "요청에 필수 결정 맥락이 누락되었습니다."
          : "Required decision context was missing from the request."
        : isKr
          ? "현재 외부 근거 서비스 모듈을 불러올 수 없습니다."
          : "The external evidence service module could not be loaded for this response.",
    ],
    implication: isKr
      ? "외부 근거가 연결되기 전까지 이 Snapshot은 결정 조건을 보조하는 fallback으로 해석해야 합니다."
      : "Until external evidence is available, read this snapshot as fallback context supporting the decision conditions.",
  };
}
