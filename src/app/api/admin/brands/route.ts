/**
 * CALLBACX TECHNOLOGY — GET /api/admin/brands
 * List brands with verification status for admin moderation.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminBrands } from "@/services/admin";
import { adminBrandListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminBrandListSchema.parse({
    search: params.get("search") || undefined,
    verification_status: params.get("verification_status") || undefined,
    is_active: params.get("is_active") === "true" ? true : params.get("is_active") === "false" ? false : undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminBrands(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.brands,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.brands.length < result.data.total,
    },
    null
  );
});
