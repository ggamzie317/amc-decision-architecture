import {
  buildFallbackSnapshot,
  parseWebExternalSnapshotRequest,
  resolveWebExternalSnapshot,
} from "../../server/externalSnapshotService";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const rawBody = typeof req.body === "string" ? safeJsonParse(req.body) : req.body;
  const request = parseWebExternalSnapshotRequest(rawBody);
  if (!request) {
    const language = isRecord(rawBody) && rawBody.language === "kr" ? "kr" : "en";
    res.status(400).json(buildFallbackSnapshot(language, "malformed_request"));
    return;
  }

  const snapshot = await resolveWebExternalSnapshot(request);
  res.status(200).json(snapshot);
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
