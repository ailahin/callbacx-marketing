/**
 * CALLBACX MARKETING — POST /api/admin/brands/verify
 * Verify or reject a brand. Platform admin only.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { verifyBrand } from "@/services/admin";
import { brandVerificationSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const POST = withAdminRoute(async (req) => {
  const body = await req.json();
  const input = brandVerificationSchema.parse(body);

  const result = await verifyBrand(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
