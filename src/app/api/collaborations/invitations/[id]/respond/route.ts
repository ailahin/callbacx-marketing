/**
 * CALLBACX — POST /api/collaborations/invitations/[id]/respond
 * Accept or reject a collaboration invitation (creator only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { respondToInvitation } from "@/services/collaborations";
import { collaborationInvitationResponseSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const invitationId = uuid.parse(id);

  const body = await request.json();
  const input = collaborationInvitationResponseSchema.parse({ ...body, invitation_id: invitationId });

  const result = await respondToInvitation(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

