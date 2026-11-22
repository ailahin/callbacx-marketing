/**
 * CALLBACX — POST /api/campaigns
 * Create a campaign (brand owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { createCampaign } from "@/services/campaigns";
import { campaignCreateSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = campaignCreateSchema.parse(body);

  const result = await createCampaign(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data }, { status: 201 });
});

