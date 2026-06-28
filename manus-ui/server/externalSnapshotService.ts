export type WebExternalSnapshotStatus = "live" | "fallback";
export type WebExternalSnapshotConfidence = "low" | "medium" | "high";
export type WebExternalSignalDirection = "supportive" | "mixed" | "caution";
export type WebExternalEvidenceType = "market" | "company" | "education" | "region" | "role" | "general";

export interface WebExternalSnapshotRequest {
  caseType: string;
  optionA: string;
  optionB: string;
  currentDecision: string;
  externalPressure: string;
  validationNeed: string;
  language: "en" | "kr";
}

export interface WebExternalSnapshot {
  status: WebExternalSnapshotStatus;
  confidence: WebExternalSnapshotConfidence;
  generatedAtLabel: string;
  externalSignals: Array<{
    label: string;
    direction: WebExternalSignalDirection;
    reading: string;
  }>;
  sourceNotes: Array<{
    sourceLabel: string;
    note: string;
    evidenceType: WebExternalEvidenceType;
  }>;
  uncertaintyNotes: string[];
  implication: string;
}

type ResolveOptions = {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  model?: string;
  timeoutMs?: number;
};

const SNAPSHOT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["confidence", "externalSignals", "sourceNotes", "uncertaintyNotes", "implication"],
  properties: {
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    externalSignals: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "direction", "reading"],
        properties: {
          label: { type: "string", minLength: 1 },
          direction: { type: "string", enum: ["supportive", "mixed", "caution"] },
          reading: { type: "string", minLength: 1 },
        },
      },
    },
    sourceNotes: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourceLabel", "note", "evidenceType"],
        properties: {
          sourceLabel: { type: "string", minLength: 1 },
          note: { type: "string", minLength: 1 },
          evidenceType: {
            type: "string",
            enum: ["market", "company", "education", "region", "role", "general"],
          },
        },
      },
    },
    uncertaintyNotes: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string", minLength: 1 },
    },
    implication: { type: "string", minLength: 1 },
  },
} as const;

export function parseWebExternalSnapshotRequest(raw: unknown): WebExternalSnapshotRequest | null {
  if (!isRecord(raw)) return null;

  const language = raw.language === "en" || raw.language === "kr" ? raw.language : null;
  const caseType = boundedString(raw.caseType, 120);
  const optionA = boundedString(raw.optionA, 240);
  const optionB = boundedString(raw.optionB, 240);
  const currentDecision = boundedString(raw.currentDecision, 1200);
  const externalPressure = boundedString(raw.externalPressure, 1200, true);
  const validationNeed = boundedString(raw.validationNeed, 1200, true);

  if (!language || !caseType || !optionA || !optionB || !currentDecision) return null;

  return {
    caseType,
    optionA,
    optionB,
    currentDecision,
    externalPressure: externalPressure ?? "",
    validationNeed: validationNeed ?? "",
    language,
  };
}

export async function resolveWebExternalSnapshot(
  request: WebExternalSnapshotRequest,
  options: ResolveOptions = {},
): Promise<WebExternalSnapshot> {
  const apiKey = options.apiKey ?? process.env.PERPLEXITY_API_KEY ?? process.env.PPLX_API_KEY;
  if (!apiKey) {
    return buildFallbackSnapshot(request.language, "missing_configuration");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

  try {
    const response = await (options.fetchImpl ?? fetch)("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: options.model ?? process.env.PERPLEXITY_MODEL ?? "sonar",
        temperature: 0,
        messages: buildMessages(request),
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "amc_web_external_snapshot",
            strict: true,
            schema: SNAPSHOT_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      return buildFallbackSnapshot(request.language, "provider_unavailable");
    }

    const envelope = await response.json().catch(() => null);
    const content = isRecord(envelope)
      ? (envelope.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content
      : null;
    if (typeof content !== "string") {
      return buildFallbackSnapshot(request.language, "invalid_response");
    }

    const parsed = JSON.parse(content) as unknown;
    return normalizeLiveSnapshot(parsed, request.language);
  } catch {
    return buildFallbackSnapshot(request.language, "provider_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

export function buildFallbackSnapshot(
  language: "en" | "kr",
  reason: "missing_configuration" | "provider_unavailable" | "invalid_response" | "malformed_request",
): WebExternalSnapshot {
  const isKr = language === "kr";
  const reasonNote = {
    missing_configuration: isKr
      ? "Live 외부 검색이 아직 설정되지 않았습니다."
      : "Live external search is not configured.",
    provider_unavailable: isKr
      ? "Live 외부 검색을 현재 사용할 수 없어 fallback 맥락을 유지합니다."
      : "Live external search is temporarily unavailable; fallback context remains in use.",
    invalid_response: isKr
      ? "외부 응답을 안전하게 해석할 수 없어 fallback 맥락을 유지합니다."
      : "The external response could not be safely normalized; fallback context remains in use.",
    malformed_request: isKr
      ? "요청 맥락이 충분하지 않아 fallback 맥락을 사용합니다."
      : "The request context was incomplete, so fallback context is in use.",
  }[reason];

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
          ? "현재 화면의 외부 맥락은 live 검색 결과가 아닌 안전한 fallback입니다."
          : "The external context shown here is a safe fallback, not a live search result.",
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
          ? "사용자가 제공한 구조적 맥락을 유지하며 live 근거로 표시하지 않습니다."
          : "Maintains the user-provided structural context without presenting it as live evidence.",
        evidenceType: "general",
      },
    ],
    uncertaintyNotes: [reasonNote],
    implication: isKr
      ? "외부 근거가 연결되기 전까지 현재 Snapshot은 결정 조건을 보조하는 fallback으로 해석해야 합니다."
      : "Until external evidence is connected, this snapshot should be read as fallback context supporting the decision conditions.",
  };
}

function buildMessages(request: WebExternalSnapshotRequest) {
  const responseLanguage = request.language === "kr" ? "natural professional Korean" : "concise professional English";
  return [
    {
      role: "system",
      content: [
        "You support AMC, a private career decision architecture report.",
        "Analyze external market, industry, role, education, or relocation context relevant to the case.",
        "Do not decide for the user and do not provide legal, immigration, tax, medical, or financial advice.",
        "Identify decision-relevant external signals, source-backed notes, uncertainty, and strategic implication.",
        "Use only claims supported by current search evidence. Return concise structured JSON only.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Response language: ${responseLanguage}`,
        `Case Type: ${request.caseType}`,
        `Option A: ${request.optionA}`,
        `Option B: ${request.optionB}`,
        `Current decision: ${request.currentDecision}`,
        `External pressure already identified: ${request.externalPressure || "Not provided"}`,
        `Validation need: ${request.validationNeed || "Not provided"}`,
        "Keep product/framework labels in English when useful. Do not give a final career recommendation.",
      ].join("\n"),
    },
  ];
}

function normalizeLiveSnapshot(raw: unknown, language: "en" | "kr"): WebExternalSnapshot {
  if (!isRecord(raw)) return buildFallbackSnapshot(language, "invalid_response");

  const confidence = oneOf(raw.confidence, ["low", "medium", "high"] as const);
  const externalSignals = Array.isArray(raw.externalSignals)
    ? raw.externalSignals.map(normalizeSignal).filter(isPresent).slice(0, 4)
    : [];
  const sourceNotes = Array.isArray(raw.sourceNotes)
    ? raw.sourceNotes.map(normalizeSource).filter(isPresent).slice(0, 4)
    : [];
  const uncertaintyNotes = stringArray(raw.uncertaintyNotes, 4);
  const implication = boundedString(raw.implication, 1200);

  if (!confidence || externalSignals.length < 3 || sourceNotes.length < 1 || uncertaintyNotes.length < 1 || !implication) {
    return buildFallbackSnapshot(language, "invalid_response");
  }

  return {
    status: "live",
    confidence,
    generatedAtLabel: `${language === "kr" ? "Live 검색" : "Live search"} · ${new Date().toISOString().slice(0, 10)}`,
    externalSignals,
    sourceNotes,
    uncertaintyNotes,
    implication,
  };
}

function normalizeSignal(raw: unknown): WebExternalSnapshot["externalSignals"][number] | null {
  if (!isRecord(raw)) return null;
  const label = boundedString(raw.label, 120);
  const direction = oneOf(raw.direction, ["supportive", "mixed", "caution"] as const);
  const reading = boundedString(raw.reading, 1000);
  return label && direction && reading ? { label, direction, reading } : null;
}

function normalizeSource(raw: unknown): WebExternalSnapshot["sourceNotes"][number] | null {
  if (!isRecord(raw)) return null;
  const sourceLabel = boundedString(raw.sourceLabel, 240);
  const note = boundedString(raw.note, 1000);
  const evidenceType = oneOf(
    raw.evidenceType,
    ["market", "company", "education", "region", "role", "general"] as const,
  );
  return sourceLabel && note && evidenceType ? { sourceLabel, note, evidenceType } : null;
}

function boundedString(raw: unknown, maxLength: number, optional = false): string | null {
  if (typeof raw !== "string") return optional ? "" : null;
  const value = raw.trim();
  if (!value) return optional ? "" : null;
  return value.length <= maxLength ? value : null;
}

function stringArray(raw: unknown, maxItems: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => boundedString(item, 1000)).filter(isPresent).slice(0, maxItems);
}

function oneOf<const T extends readonly string[]>(raw: unknown, values: T): T[number] | null {
  return typeof raw === "string" && values.includes(raw) ? (raw as T[number]) : null;
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
