/**
 * CALLBACX TECHNOLOGY — POST /api/admin/campaigns/moderate
 * Publish, pause, archive, cancel, or reject a campaign. Platform admin only.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { moderateCampaign } from "@/services/admin";
import { campaignModerationSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const POST = withAdminRoute(async (req) => {
  const body = await req.json();
  const input = campaignModerationSchema.parse(body);

  const result = await moderateCampaign(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
