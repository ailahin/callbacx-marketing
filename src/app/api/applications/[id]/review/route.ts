/**
 * CALLBACX — PATCH /api/applications/[id]/review
 * Review an application (brand owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { reviewApplication } from "@/services/applications";
import { applicationReviewSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const applicationId = uuid.parse(id);

  const body = await request.json();
  const input = applicationReviewSchema.parse({ ...body, application_id: applicationId });

  const result = await reviewApplication(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

