/**
 * CALLBACX — POST /api/payments/transactions
 * Record a payment transaction (server-side, service-role client).
 * Used by webhook handlers / privileged server operations.
 */

import { withErrorHandler } from "@/lib/errors";
import { recordPaymentTransaction } from "@/services/payments";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const result = await recordPaymentTransaction(body);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});
