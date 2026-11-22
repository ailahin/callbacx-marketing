/**
 * CALLBACX — GET /api/collaborations/invitations
 * List invitations for the current creator.
 */

import { withErrorHandler, Errors } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listInvitationsForCreator } from "@/services/collaborations";
import { pagination } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const { limit, offset } = pagination.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  // Resolve the current user's creator profile id.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw Errors.authSessionRequired();
  }
  const profileResult = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const profile = profileResult.data as { id: string } | null;
  if (!profile) {
    throw Errors.profileNotFound();
  }
  const creatorProfileResult = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", profile.id)
    .is("deleted_at", null)
    .maybeSingle();
  const creatorProfile = creatorProfileResult.data as { id: string } | null;
  if (!creatorProfile) {
    throw Errors.creatorProfileNotFound();
  }

  const result = await listInvitationsForCreator(creatorProfile.id, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

