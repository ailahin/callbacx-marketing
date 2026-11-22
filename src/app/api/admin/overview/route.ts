/**
 * CALLBACX MARKETING — GET /api/admin/overview
 * Platform overview metrics for the admin dashboard.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { getServerSupabase } from "@/app/api/admin/_helper";
import { getOverviewMetrics } from "@/services/admin";
import { overviewMetricsSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const supabase = getServerSupabase();
  const params = new URL(req.url).searchParams;
  const input = overviewMetricsSchema.parse({
    start_date: params.get("start_date") || undefined,
    end_date: params.get("end_date") || undefined,
  });

  const result = await getOverviewMetrics(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
