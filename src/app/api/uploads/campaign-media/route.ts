/**
 * CALLBACX — POST /api/uploads/campaign-media
 * Create a campaign_media record after a campaign asset upload.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createCampaignMediaRecord } from "@/services/uploads";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();

  const result = await createCampaignMediaRecord(body, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

