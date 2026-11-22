/**
 * CALLBACX — POST /api/messages
 * Send a message.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { sendMessage } from "@/services/messaging";
import { messageSendSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = messageSendSchema.parse(body);

  const result = await sendMessage(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

