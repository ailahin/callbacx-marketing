/**
 * CALLBACX MARKETING — POST /api/auth/login
 * Secure login with email + password. Returns session tokens.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signIn } from "@/services/auth";
import { loginSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const response = NextResponse.next();
  const setCookie = (name: string, value: string, options?: any) => {
    response.cookies.set(name, value, options);
  };
  const supabase = createSupabaseServerClient(cookieStore, setCookie);

  const body = await request.json();
  const input = loginSchema.parse(body);

  const result = await signIn(input, supabase);
  if (result.error) throw result.error;

  return response;
});

