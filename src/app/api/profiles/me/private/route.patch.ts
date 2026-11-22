/**
 * CALLBACX — PATCH /api/profiles/me/private
 * Update the current user's private profile (owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateMyPrivateProfile } from "@/services/profiles";
import type { ProfilePrivate } from "@/lib/supabase/types/database";

export const PATCH = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();

  const result = await updateMyPrivateProfile(body as Partial<Pick<ProfilePrivate, "phone" | "date_of_birth" | "address" | "id_document_url">>, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

