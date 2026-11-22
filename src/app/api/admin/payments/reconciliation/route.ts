/**
 * CALLBACX — GET /api/admin/payments/reconciliation
 * Financial reconciliation report: provider-confirmed transactions vs refunds
 * and creator payouts within a date window.
 */

import { NextRequest } from "next/server";
import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { getReconciliationReport } from "@/services/payments";

export const GET = withAdminRoute(async (req: NextRequest) => {
  const from = req.nextUrl.searchParams.get("from") || undefined;
  const to = req.nextUrl.searchParams.get("to") || undefined;

  const result = await getReconciliationReport({ from, to });
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data);
});
