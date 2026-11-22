/**
 * CALLBACX — POST /api/payments/invoices
 * Create an invoice (brand owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createInvoice } from "@/services/payments";
import { invoiceCreateSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = invoiceCreateSchema.parse(body);

  const result = await createInvoice(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

