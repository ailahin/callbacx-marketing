/**
 * CALLBACX — GET /api/messages/conversations
 * List conversations for the current user.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listConversations } from "@/services/messaging";
import { pagination } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const { limit, offset } = pagination.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  const result = await listConversations({ limit, offset }, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

