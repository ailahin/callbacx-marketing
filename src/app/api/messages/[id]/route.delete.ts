/**
 * CALLBACX — DELETE /api/messages/[id]
 * Delete a message (sender only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { deleteMessage } from "@/services/messaging";
import { uuid } from "@/lib/validations";

export const DELETE = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const messageId = uuid.parse(id);

  const result = await deleteMessage(messageId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: null, message: "Message deleted." });
});

