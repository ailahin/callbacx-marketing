/**
 * CALLBACX — GET /api/messages/conversations/[id]/messages
 * List messages in a conversation.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listMessages } from "@/services/messaging";
import { pagination } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const conversationId = uuid.parse(id);

  const { searchParams } = new URL(request.url);
  const { limit, offset } = pagination.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  const result = await listMessages({ conversationId, limit }, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

