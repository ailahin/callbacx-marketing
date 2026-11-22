/**
 * CALLBACX — /api/collections/[id]/items
 *
 * POST   — Add a creator to a collection.
 *          Body: { creator_profile_id: string }
 * DELETE — Remove a creator from a collection.
 *          Query: ?creator_profile_id=...
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { addCollectionItem, removeCollectionItem } from "@/services/creators";
import { uuid, collectionItemSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const body = await request.json();
  const input = collectionItemSchema.parse({ ...body, collection_id: id });

  const result = await addCollectionItem(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

export const DELETE = withErrorHandler(async (request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const collectionId = uuid.parse(id);
  const { searchParams } = new URL(request.url);
  const creatorProfileId = uuid.parse(searchParams.get("creator_profile_id") ?? "");

  const result = await removeCollectionItem(collectionId, creatorProfileId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});