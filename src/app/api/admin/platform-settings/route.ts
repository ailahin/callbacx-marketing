/**
 * CALLBACX TECHNOLOGY — GET /api/admin/platform-settings
 * List platform settings.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listPlatformSettings } from "@/services/admin";
import { platformSettingListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = platformSettingListSchema.parse({
    category: params.get("category") || undefined,
    search: params.get("search") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listPlatformSettings(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.settings,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.settings.length < result.data.total,
    },
    null
  );
});

/**
 * POST /api/admin/platform-settings
 * Upsert a platform setting. Platform admin only.
 */
import { upsertPlatformSetting } from "@/services/admin";
import { platformSettingUpsertSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const POST = withAdminRoute(async (req) => {
  const body = await req.json();
  const input = platformSettingUpsertSchema.parse(body);

  const result = await upsertPlatformSetting(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
