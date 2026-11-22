/**
 * CALLBACX — /api/favorites
 *
 * GET  — List the current profile's favourited creators (paginated).
 * POST — Toggle a creator in the current profile's favourites.
 *        Body: { creator_profile_id: string }
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listFavorites, toggleFavorite } from "@/services/creators";
import { favoriteToggleSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;

  const result = await listFavorites({ limit, offset }, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = favoriteToggleSchema.parse(body);

  const result = await toggleFavorite(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});