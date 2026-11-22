/**
 * CALLBACX — GET /api/collaborations/[id]
 * Get a collaboration by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getCollaboration } from "@/services/collaborations";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const collaborationId = uuid.parse(id);

  const result = await getCollaboration(collaborationId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

