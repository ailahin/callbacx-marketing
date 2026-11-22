/**
 * CALLBACX — GET /api/payments/payouts
 * List creator payouts for the current user.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createPayout, listMyPayouts } from "@/services/payments";
import { pagination } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const { limit, offset } = pagination.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  const result = await listMyPayouts({ limit, offset }, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

/**
 * CALLBACX — POST /api/payments/payouts
 * Create a creator payout (staff only, or creator requesting own payout).
 */

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const result = await createPayout(
    {
      creatorProfileId: body.creator_profile_id,
      paymentTransactionId: body.payment_transaction_id ?? null,
      amount: body.amount,
      currency: body.currency ?? "USD",
    },
    supabase,
  );

  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});
