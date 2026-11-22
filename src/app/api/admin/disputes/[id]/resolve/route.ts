/**
 * CALLBACX TECHNOLOGY — POST /api/admin/disputes/[id]/resolve
 * Resolve or update a dispute. Staff only.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { resolveDispute } from "@/services/admin";
import { disputeResolutionSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const POST = withAdminRoute(async (req, { params }) => {
  const resolvedParams = await params;
  const disputeId = resolvedParams.id as string;
  const body = await req.json();
  const input = disputeResolutionSchema.parse({ ...body, dispute_id: disputeId });

  const result = await resolveDispute(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
