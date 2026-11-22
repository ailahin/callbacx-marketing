/**
 * CALLBACX — PATCH /api/campaigns/[id]
 * Update a campaign (brand member only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateCampaign } from "@/services/campaigns";
import { campaignUpdateSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const campaignId = uuid.parse(id);

  const body = await request.json();
  const input = campaignUpdateSchema.parse(body);

  const result = await updateCampaign(campaignId, input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

