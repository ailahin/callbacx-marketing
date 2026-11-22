/**
 * CALLBACX — PATCH /api/notifications/[id]/read
 * Mark a notification as read.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { markNotificationRead } from "@/services/notifications";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const notificationId = uuid.parse(id);

  const result = await markNotificationRead(notificationId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

