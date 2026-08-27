import {
  handleAdminSubmission,
  type ApiRequest,
  type ApiResponse,
} from "../../../server/vercelFounderOps.js";

export default function handler(req: ApiRequest, res: ApiResponse) {
  return handleAdminSubmission(req, res);
}
