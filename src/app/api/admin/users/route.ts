/**
 * CALLBACX TECHNOLOGY — GET /api/admin/users
 * List admin users with filters and pagination.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { getServerSupabase } from "@/app/api/admin/_helper";
import { listAdminUsers } from "@/services/admin";
import { adminUserListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminUserListSchema.parse({
    search: params.get("search") || undefined,
    role: params.get("role") || undefined,
    status: params.get("status") || undefined,
    brand_id: params.get("brand_id") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminUsers(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.users,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.users.length < result.data.total,
    },
    null
  );
});
