/**
 * CALLBACX — GET /api/profiles/[id]
 * Public profile by ID (readable if public, or by owner/staff via RLS).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getProfileById } from "@/services/profiles";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const profileId = uuid.parse(id);

  const result = await getProfileById(profileId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

