/**
 * CALLBACX TECHNOLOGY — POST /api/auth/verify-email
 * Verify an email verification token (server-side, service-role client).
 * Never exposed to the browser.
 */

import { withErrorHandler } from "@/lib/errors";
import { verifyEmail } from "@/services/auth";
import { emailVerificationSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { token_hash, type } = emailVerificationSchema.parse(body);

  const result = await verifyEmail({ tokenHash: token_hash, type });
  if (result.error) throw result.error;

  return Response.json({ data: null, message: "Email verified." });
});
