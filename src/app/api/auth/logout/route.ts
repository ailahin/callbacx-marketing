/**
 * CALLBACX — POST /api/auth/logout
 * Sign out the current user.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { signOut } from "@/services/auth";

export const POST = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await signOut(supabase);
  if (result.error) throw result.error;

  return Response.json({ data: null, message: "Signed out." });
});

