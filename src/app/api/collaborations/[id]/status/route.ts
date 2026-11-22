/**
 * CALLBACX — PATCH /api/collaborations/[id]/status
 * Update collaboration status.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateCollaborationStatus } from "@/services/collaborations";
import { collaborationStatusUpdateSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const collaborationId = uuid.parse(id);

  const body = await request.json();
  const input = collaborationStatusUpdateSchema.parse({ ...body, collaboration_id: collaborationId });

  const result = await updateCollaborationStatus(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

