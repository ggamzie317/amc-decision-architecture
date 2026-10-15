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

/**
 * Retired legacy route (owner decision 2026-10-16). It sent the customer's
 * free-text answers to the search provider for the /amc-web-mvp page, which
 * now redirects to V2. Every call is refused without loading the search
 * service, so no provider request is made and nothing is stored.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleExternalSnapshot(req, res);
}

export const EXTERNAL_SNAPSHOT_RETIRED = {
  error: "retired",
  message: "This endpoint is no longer available.",
} as const;

export async function handleExternalSnapshot(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.status(410).json(EXTERNAL_SNAPSHOT_RETIRED);
}
