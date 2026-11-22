/**
 * CALLBACX — PATCH /api/profiles/me
 * Update the current user's public profile.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateMyProfile } from "@/services/profiles";
import { profileUpdateSchema } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = profileUpdateSchema.parse(body);

  const result = await updateMyProfile(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

