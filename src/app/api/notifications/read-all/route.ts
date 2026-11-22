/**
 * CALLBACX — PATCH /api/notifications/read-all
 * Mark all notifications as read.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { markAllNotificationsRead } from "@/services/notifications";

export const PATCH = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await markAllNotificationsRead(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

