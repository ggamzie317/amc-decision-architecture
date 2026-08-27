import type { Express, Request, Response } from "express";

import {
  handleAdminExport,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSubmission,
  handleAdminSubmissions,
  handleAdminSummary,
  handleTrack,
  type ApiRequest,
  type ApiResponse,
} from "./vercelFounderOps";

type Handler = (req: ApiRequest, res: ApiResponse) => Promise<void>;

function adapt(handler: Handler) {
  return (req: Request, res: Response) => {
    void handler(req as unknown as ApiRequest, res as unknown as ApiResponse);
  };
}

export function registerFounderOpsRoutes(app: Express) {
  app.post("/api/amc/ops/track", adapt(handleTrack));
  app.post("/api/amc/admin/login", adapt(handleAdminLogin));
  app.post("/api/amc/admin/logout", adapt(handleAdminLogout));
  app.get("/api/amc/admin/summary", adapt(handleAdminSummary));
  app.get("/api/amc/admin/submissions", adapt(handleAdminSubmissions));
  app.get("/api/amc/admin/submission", adapt(handleAdminSubmission));
  app.get("/api/amc/admin/export", adapt(handleAdminExport));
}
