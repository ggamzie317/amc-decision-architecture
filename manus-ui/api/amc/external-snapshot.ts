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

type ExternalSnapshotService = {
  parseWebExternalSnapshotRequest(raw: unknown): unknown | null;
  resolveWebExternalSnapshot(request: unknown): Promise<unknown>;
  buildFallbackSnapshot(language: Language, reason: "malformed_request"): unknown;
};

type LoadExternalSnapshotService = () => Promise<ExternalSnapshotService>;

const loadExternalSnapshotService: LoadExternalSnapshotService = () =>
  import("../../server/externalSnapshotService") as Promise<ExternalSnapshotService>;

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
    res.status(200).json(buildRouteFallbackSnapshot(language));
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

function buildRouteFallbackSnapshot(language: Language) {
  const isKr = language === "kr";
  return {
    status: "fallback",
    confidence: "low",
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
        sourceLabel: "AMC fallback context",
        note: isKr
          ? "Live 외부 근거를 사용할 수 없어 안전한 fallback 맥락을 제공합니다."
          : "Live external evidence is unavailable, so this response provides safe fallback context.",
        evidenceType: "general",
      },
    ],
    uncertaintyNotes: [
      isKr
        ? "현재 외부 근거 서비스 상태를 확인할 수 없습니다."
        : "The external evidence service could not be verified for this response.",
    ],
    implication: isKr
      ? "외부 근거가 연결되기 전까지 이 Snapshot은 결정 조건을 보조하는 fallback으로 해석해야 합니다."
      : "Until external evidence is available, read this snapshot as fallback context supporting the decision conditions.",
  };
}
