/**
 * CALLBACX — GET /api/reviews
 * List public reviews for a reviewee.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listReviewsForReviewee } from "@/services/reviews";
import { pagination } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const revieweeId = uuid.parse(searchParams.get("reviewee_id") ?? "");
  const { limit, offset } = pagination.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  const result = await listReviewsForReviewee(revieweeId, { limit, offset }, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

