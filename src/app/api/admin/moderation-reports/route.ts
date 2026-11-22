/**
 * CALLBACX TECHNOLOGY — GET /api/admin/moderation-reports
 * List moderation reports for admin review.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminModerationReports } from "@/services/admin";
import { adminModerationReportListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminModerationReportListSchema.parse({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminModerationReports(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.reports,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.reports.length < result.data.total,
    },
    null
  );
});
