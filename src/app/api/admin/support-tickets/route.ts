/**
 * CALLBACX TECHNOLOGY — GET /api/admin/support-tickets
 * List support tickets for admin assignment and resolution.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { listAdminSupportTickets } from "@/services/admin";
import { adminSupportTicketListSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const GET = withAdminRoute(async (req) => {
  const params = new URL(req.url).searchParams;
  const input = adminSupportTicketListSchema.parse({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    priority: params.get("priority") || undefined,
    assigned_to: params.get("assigned_to") || undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    offset: params.get("offset") ? Number(params.get("offset")) : undefined,
  });

  const result = await listAdminSupportTickets(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(
    result.data.tickets,
    {
      limit: input.limit,
      offset: input.offset,
      total: result.data.total,
      has_more: input.offset + result.data.tickets.length < result.data.total,
    },
    null
  );
});
