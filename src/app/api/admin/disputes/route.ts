/**
 * CALLBACX MARKETING — GET /api/admin/disputes
 * List disputes for admin resolution.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminDisputes } from "@/services/admin";
import { adminDisputeListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminDisputeListSchema.parse({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminDisputes(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.disputes,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.disputes.length < result.data.total,
    },
    null
  );
});
