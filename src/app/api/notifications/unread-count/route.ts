/**
 * CALLBACX — GET /api/notifications/unread-count
 * Get unread notification count.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getUnreadCount } from "@/services/notifications";

export const GET = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await getUnreadCount(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

