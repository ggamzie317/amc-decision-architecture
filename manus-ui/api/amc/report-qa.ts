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

type ReportQaService = {
  parseReportQaRequest(raw: unknown): unknown | null;
  resolveReportQa(request: unknown): Promise<unknown>;
  buildReportQaFallback(language: Language): unknown;
};

type LoadReportQaService = () => Promise<ReportQaService>;

const loadReportQaService: LoadReportQaService = () =>
  import("../../server/reportQaService") as Promise<ReportQaService>;

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleReportQa(req, res);
}

export async function handleReportQa(
  req: VercelRequest,
  res: VercelResponse,
  loadService: LoadReportQaService = loadReportQaService,
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
    const { buildReportQaFallback, parseReportQaRequest, resolveReportQa } = await loadService();
    const request = parseReportQaRequest(rawBody);
    if (!request) {
      res.status(400).json(buildReportQaFallback(language));
      return;
    }

    res.status(200).json(await resolveReportQa(request));
  } catch {
    res.status(200).json(buildRouteReportQaFallback(language));
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

function buildRouteReportQaFallback(language: Language) {
  return {
    status: "fallback",
    answer: "",
    modelLabel: "Local fallback",
    boundaryNote:
      language === "kr"
        ? "이 답변은 생성된 AMC 리포트 맥락을 해석하며 결정을 대신하거나 전문 자문을 제공하지 않습니다."
        : "This answer interprets the generated AMC report context; it does not decide the outcome or provide professional advice.",
  };
}
