/**
 * CALLBACX MARKETING — PATCH /api/admin/users/[id]
 * Update a user's role / status.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { getServerSupabase } from "@/app/api/admin/_helper";
import { updateAdminUser } from "@/services/admin";
import { adminUserUpdateSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const PATCH = withAdminRoute(async (req, { params }) => {
  const resolvedParams = await params;
  const userId = resolvedParams.id as string;
  const body = await req.json();
  const input = adminUserUpdateSchema.parse(body);

  const result = await updateAdminUser(userId, input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
