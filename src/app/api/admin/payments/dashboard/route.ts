/**
 * CALLBACX — GET /api/admin/payments/dashboard
 * Aggregated financial dashboard stats (admin / staff).
 */

import { withAdminRoute } from "@/app/api/admin/_helper";
import { getFinancialDashboardStats } from "@/services/payments";
import { apiResponse } from "@/app/api/admin/_helper";

export const GET = withAdminRoute(async () => {
  const result = await getFinancialDashboardStats();
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data);
});
