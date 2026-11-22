/**
 * CALLBACX — POST /api/campaigns/[id]/publish
 * Publish a campaign (brand owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { publishCampaign } from "@/services/campaigns";
import { uuid } from "@/lib/validations";

export const POST = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const campaignId = uuid.parse(id);

  const result = await publishCampaign(campaignId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

