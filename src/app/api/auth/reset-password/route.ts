/**
 * CALLBACX MARKETING — POST /api/auth/reset-password
 * Request a password reset email. Always returns success to avoid
 * email enumeration.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { resetPassword } from "@/services/auth";
import { resetPasswordSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = resetPasswordSchema.parse(body);

  const result = await resetPassword(input, supabase);
  if (result.error) throw result.error;

  return Response.json({ data: null, message: "If an account exists, a reset link has been sent." });
});

