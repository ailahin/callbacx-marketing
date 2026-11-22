/**
 * CALLBACX — POST /api/admin/activity-logs
 * Create an admin activity log entry (staff only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createActivityLog } from "@/services/admin";
import { adminActivityLogSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = adminActivityLogSchema.parse(body);

  const result = await createActivityLog(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

