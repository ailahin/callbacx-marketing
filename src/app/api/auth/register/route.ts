/**
 * CALLBACX TECHNOLOGY — POST /api/auth/register
 * Secure user registration. Creates auth identity + public profile.
 * Service-role key is never exposed to the client.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { signUp } from "@/services/auth";
import { signupSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = signupSchema.parse(body);

  const result = await signUp(input, supabase);
  if (result.error) throw result.error;

  return Response.json(
    { data: result.data, message: "Account created. Please verify your email." },
    { status: 201 }
  );
});

