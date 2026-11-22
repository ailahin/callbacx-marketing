/**
 * CALLBACX MARKETING — POST /api/auth/update-password
 * Update the password of the currently authenticated user.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updatePassword } from "@/services/auth";
import { updatePasswordSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = updatePasswordSchema.parse(body);

  const result = await updatePassword(input, supabase);
  if (result.error) throw result.error;

  return Response.json({ data: null, message: "Password updated." });
});

