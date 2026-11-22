/**
 * CALLBACX — GET /api/applications/[id]
 * Get an application by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getApplication } from "@/services/applications";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const applicationId = uuid.parse(id);

  const result = await getApplication(applicationId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

