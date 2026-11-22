/**
 * CALLBACX — GET /api/payments/transactions
 * List payment transactions with optional filters (history).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listPaymentTransactions, recordPaymentTransaction } from "@/services/payments";
import { pagination } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const { limit, offset } = pagination.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  const status = searchParams.get("status") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const search = searchParams.get("search") || undefined;
  const brandId = searchParams.get("brand_id") || undefined;
  const creatorProfileId = searchParams.get("creator_profile_id") || undefined;
  const collaborationId = searchParams.get("collaboration_id") || undefined;

  const result = await listPaymentTransactions(
    {
      limit,
      offset,
      status,
      provider,
      search,
      brandId,
      creatorProfileId,
      collaborationId,
    },
    supabase,
  );
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

/**
 * CALLBACX — POST /api/payments/transactions
 * Record a payment transaction (server-side, service-role client).
 * Used by webhook handlers / privileged server operations.
 */

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const result = await recordPaymentTransaction(body);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});
