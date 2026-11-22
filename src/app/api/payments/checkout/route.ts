/**
 * CALLBACX — POST /api/payments/checkout
 * Create a server-side Stripe Checkout Session for an invoice.
 * Records a pending payment transaction with an idempotency key.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createCheckoutSession } from "@/services/payments";
import { checkoutCreateSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = checkoutCreateSchema.parse(body);

  const result = await createCheckoutSession(
    {
      collaborationId: input.collaboration_id,
      invoiceId: input.invoice_id,
      successUrl: input.success_url,
      cancelUrl: input.cancel_url,
    },
    supabase,
  );
  if (result.error) throw result.error;

  const sessionData = result.data;
  if (!sessionData) {
    throw new Error("Failed to create checkout session.");
  }
  const checkoutUrl = sessionData.checkoutUrl;
  const sessionId = sessionData.sessionId;
  const transactionId = sessionData.transactionId;
  return Response.json(
    {
      data: {
        checkout_url: checkoutUrl,
        session_id: sessionId,
        transaction_id: transactionId,
      },
    },
    { status: 201 },
  );
});
