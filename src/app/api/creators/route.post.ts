/**
 * CALLBACX — POST /api/creators
 * Create the current user's creator profile.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createCreatorProfile } from "@/services/creators";
import { creatorProfileCreateSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = creatorProfileCreateSchema.parse(body);

  const result = await createCreatorProfile(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

