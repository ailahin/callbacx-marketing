/**
 * CALLBACX — POST /api/payments/payouts/[id]/process
 * Mark a creator payout as paid (staff only). Records provider payout reference.
 */

import { withErrorHandler } from "@/lib/errors";
import { processPayout } from "@/services/payments";
import { uuid } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const payoutId = uuid.parse(id);

  const body = await request.json().catch(() => ({}));
  const result = await processPayout({
    payoutId,
    providerPayoutId: body?.provider_payout_id ?? null,
  });

  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
