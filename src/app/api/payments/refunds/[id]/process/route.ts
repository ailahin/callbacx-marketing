/**
 * CALLBACX — POST /api/payments/refunds/[id]/process
 * Execute a refund through the payment provider and mark the transaction refunded.
 * Staff only. Called after a refund has been approved.
 */

import { withErrorHandler } from "@/lib/errors";
import { processRefund } from "@/services/payments";
import { uuid } from "@/lib/validations";

export const POST = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const refundId = uuid.parse(id);

  const result = await processRefund({ refundId });
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
