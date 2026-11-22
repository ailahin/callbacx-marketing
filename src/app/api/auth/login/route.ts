/**
 * CALLBACX MARKETING — POST /api/auth/login
 * Secure login with email + password. Returns session tokens.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { signIn } from "@/services/auth";
import { loginSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = loginSchema.parse(body);

  const result = await signIn(input, supabase);
  if (result.error) throw result.error;

  return Response.json({ data: result.data });
});

