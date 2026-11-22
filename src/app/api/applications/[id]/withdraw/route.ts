/**
 * CALLBACX — DELETE /api/applications/[id]/withdraw
 * Withdraw an application (applicant only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { withdrawApplication } from "@/services/applications";
import { uuid } from "@/lib/validations";

export const DELETE = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const applicationId = uuid.parse(id);

  const result = await withdrawApplication(applicationId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: null, message: "Application withdrawn." });
});

