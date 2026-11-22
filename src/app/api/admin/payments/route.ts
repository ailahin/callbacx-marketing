/**
 * CALLBACX TECHNOLOGY — GET /api/admin/payments
 * List payment transactions for admin monitoring.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminPayments } from "@/services/admin";
import { adminPaymentListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminPaymentListSchema.parse({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    provider: params.get("provider") || undefined,
    start_date: params.get("start_date") || undefined,
    end_date: params.get("end_date") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminPayments(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.payments,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.payments.length < result.data.total,
    },
    null
  );
});
