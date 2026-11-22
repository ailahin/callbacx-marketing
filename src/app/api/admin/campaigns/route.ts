/**
 * CALLBACX TECHNOLOGY — GET /api/admin/campaigns
 * List campaigns for admin moderation.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminCampaigns } from "@/services/admin";
import { adminCampaignListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminCampaignListSchema.parse({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    brand_id: params.get("brand_id") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminCampaigns(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.campaigns,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.campaigns.length < result.data.total,
    },
    null
  );
});
