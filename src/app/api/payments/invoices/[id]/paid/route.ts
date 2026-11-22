/**
 * CALLBACX — PATCH /api/payments/invoices/[id]/paid
 * Mark an invoice as paid (brand owner or staff).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { markInvoicePaid } from "@/services/payments";
import { invoiceMarkPaidSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const invoiceId = uuid.parse(id);

  const body = await request.json();
  const input = invoiceMarkPaidSchema.parse({ ...body, invoice_id: invoiceId });

  const result = await markInvoicePaid(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

