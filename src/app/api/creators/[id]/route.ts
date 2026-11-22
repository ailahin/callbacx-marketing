/**
 * CALLBACX — GET /api/creators/[id]
 * Public creator profile by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getCreatorProfile } from "@/services/creators";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const creatorId = uuid.parse(id);

  const result = await getCreatorProfile(creatorId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

