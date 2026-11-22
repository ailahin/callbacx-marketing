/**
 * CALLBACX TECHNOLOGY — GET /api/admin/creators
 * List creators with verification status for admin moderation.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminCreators } from "@/services/admin";
import { adminCreatorListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminCreatorListSchema.parse({
    search: params.get("search") || undefined,
    verification_status: params.get("verification_status") || undefined,
    is_public: params.get("is_public") === "true" ? true : params.get("is_public") === "false" ? false : undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminCreators(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.creators,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.creators.length < result.data.total,
    },
    null
  );
});
