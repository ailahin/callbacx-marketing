/**
 * CALLBACX — PATCH /api/reviews/[id]
 * Update a review (reviewer only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateReview } from "@/services/reviews";
import { reviewCreateSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const reviewId = uuid.parse(id);

  const body = await request.json();
  const input = reviewCreateSchema.partial().parse(body);

  const result = await updateReview(reviewId, input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

