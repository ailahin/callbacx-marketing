/**
 * CALLBACX TECHNOLOGY — POST /api/admin/creators/verify
 * Verify or reject a creator. Platform admin only.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { verifyCreator } from "@/services/admin";
import { creatorVerificationSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const POST = withAdminRoute(async (req) => {
  const body = await req.json();
  const input = creatorVerificationSchema.parse(body);

  const result = await verifyCreator(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
