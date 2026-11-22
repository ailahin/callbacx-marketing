/**
 * CALLBACX — PATCH /api/messages/[id]
 * Update a message (sender only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateMessage } from "@/services/messaging";
import { messageSendSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const messageId = uuid.parse(id);

  const body = await request.json();
  const input = messageSendSchema.parse(body);

  const result = await updateMessage(messageId, input.body ?? "", supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

