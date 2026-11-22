/**
 * CALLBACX TECHNOLOGY — PATCH /api/admin/announcements/[id]
 * Update an announcement. Platform admin only.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { updateAnnouncement } from "@/services/admin";
import { announcementUpdateSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const PATCH = withAdminRoute(async (req, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams.id as string;
  const body = await req.json();
  const input = announcementUpdateSchema.parse(body);

  const result = await updateAnnouncement(id, input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
