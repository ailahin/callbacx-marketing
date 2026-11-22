/**
 * CALLBACX — GET /api/reviews/[id]
 * Get a review by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getReview } from "@/services/reviews";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const reviewId = uuid.parse(id);

  const result = await getReview(reviewId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

