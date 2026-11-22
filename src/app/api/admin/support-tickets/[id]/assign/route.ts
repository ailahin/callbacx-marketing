/**
 * CALLBACX TECHNOLOGY — PATCH /api/admin/support-tickets/[id]/assign
 * Assign a support ticket to a staff member. Staff only.
 */

import { withAdminRoute, apiResponse } from "@/app/api/admin/_helper";
import { assignSupportTicket } from "@/services/admin";
import { supportTicketAssignmentSchema } from "@/lib/validations/admin";
import { z } from "zod";

export const PATCH = withAdminRoute(async (req, { params }) => {
  const resolvedParams = await params;
  const ticketId = resolvedParams.id as string;
  const body = await req.json();
  const input = supportTicketAssignmentSchema.parse({ ...body, ticket_id: ticketId });

  const result = await assignSupportTicket(input);
  if (result.error) {
    return apiResponse(null, null, { code: result.error.code, message: result.error.message });
  }

  return apiResponse(result.data, null, null);
});
