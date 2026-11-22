/**
 * CALLBACX — /api/collections/[id]
 *
 * GET    — Get a single collection with its items.
 * PUT    — Update a collection owned by the current profile.
 *          Body: collectionUpdateSchema
 * DELETE — Delete a collection owned by the current profile.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getCollection, updateCollection, deleteCollection } from "@/services/creators";
import { uuid, collectionUpdateSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const collectionId = uuid.parse(id);

  const result = await getCollection(collectionId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

export const PUT = withErrorHandler(async (request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const collectionId = uuid.parse(id);
  const body = await request.json();
  const input = collectionUpdateSchema.parse(body);

  const result = await updateCollection(collectionId, input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

export const DELETE = withErrorHandler(async (_request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const collectionId = uuid.parse(id);

  const result = await deleteCollection(collectionId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});