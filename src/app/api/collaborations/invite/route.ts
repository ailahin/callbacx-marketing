/**
 * CALLBACX — POST /api/collaborations/invite
 * Create a collaboration invitation (brand owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createCollaborationInvitation } from "@/services/collaborations";
import { collaborationInvitationSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = collaborationInvitationSchema.parse(body);

  const result = await createCollaborationInvitation(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

