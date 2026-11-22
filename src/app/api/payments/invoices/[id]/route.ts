/**
 * CALLBACX — GET /api/payments/invoices/[id]
 * Get an invoice by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getInvoice } from "@/services/payments";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const invoiceId = uuid.parse(id);

  const result = await getInvoice(invoiceId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

