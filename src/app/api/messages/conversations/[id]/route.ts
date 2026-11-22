/**
 * CALLBACX — GET /api/messages/conversations/[id]
 * Get a conversation with messages.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getConversation } from "@/services/messaging";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const conversationId = uuid.parse(id);

  const result = await getConversation(conversationId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

