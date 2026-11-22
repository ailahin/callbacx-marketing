/**
 * CALLBACX TECHNOLOGY — PATCH /api/admin/collaborations/[id]/status
 * Update collaboration status for admin monitoring.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { updateCollaborationStatus } from "@/services/admin";
import { collaborationStatusUpdateSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const PATCH = withAdminRoute(async (req, { params }) => {
  const resolvedParams = await params;
  const collaborationId = resolvedParams.id as string;
  const body = await req.json();
  const input = collaborationStatusUpdateSchema.parse({ ...body, collaboration_id: collaborationId });

  const result = await updateCollaborationStatus(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
