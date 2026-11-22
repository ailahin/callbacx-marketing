/**
 * CALLBACX — PATCH /api/notifications/preferences
 * Update notification preferences.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateNotificationPreferences } from "@/services/notifications";
import { notificationPreferenceSchema } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = notificationPreferenceSchema.parse(body);

  const result = await updateNotificationPreferences(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

