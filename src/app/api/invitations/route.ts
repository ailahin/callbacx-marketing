/**
 * CALLBACX — POST /api/invitations
 *
 * Invite a creator to a campaign (creates a collaboration invitation).
 * Body: collaborationInvitationSchema
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { inviteCreatorToCampaign } from "@/services/creators";
import { collaborationInvitationSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = collaborationInvitationSchema.parse(body);

  const result = await inviteCreatorToCampaign(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});
