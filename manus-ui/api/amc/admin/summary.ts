import {
  handleAdminSummary,
  type ApiRequest,
  type ApiResponse,
} from "../../../server/vercelFounderOps.js";

export default function handler(req: ApiRequest, res: ApiResponse) {
  return handleAdminSummary(req, res);
}
