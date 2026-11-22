/**
 * CALLBACX MARKETING — GET /api/admin/announcements
 * List system notifications / announcements.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAnnouncements, createAnnouncement } from "@/services/admin";
import { announcementListSchema, announcementCreateSchema } from "@/lib/validations/admin";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = announcementListSchema.parse({
    search: params.get("search") || undefined,
    target_role: params.get("target_role") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAnnouncements(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.announcements,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.announcements.length < result.data.total,
    },
    null
  );
});

/**
 * POST /api/admin/announcements
 * Create a new announcement. Platform admin only.
 */
export const POST = withAdminRoute(async (req) => {
  const body = await req.json();
  const input = announcementCreateSchema.parse(body);

  const result = await createAnnouncement(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
