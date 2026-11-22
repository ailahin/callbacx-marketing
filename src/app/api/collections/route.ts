/**
 * CALLBACX — /api/collections
 *
 * GET  — List the current profile's collections.
 * POST — Create a new collection owned by the current profile.
 *        Body: collectionCreateSchema
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listCollections, createCollection } from "@/services/creators";
import { collectionCreateSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await listCollections(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = collectionCreateSchema.parse(body);

  const result = await createCollection(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});