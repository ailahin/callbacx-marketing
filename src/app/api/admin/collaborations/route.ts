/**
 * CALLBACX MARKETING — GET /api/admin/collaborations
 * List collaborations for admin monitoring.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminCollaborations } from "@/services/admin";
import { adminCollaborationListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminCollaborationListSchema.parse({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    campaign_id: params.get("campaign_id") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminCollaborations(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.collaborations,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.collaborations.length < result.data.total,
    },
    null
  );
});
