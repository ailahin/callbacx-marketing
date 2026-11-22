/**
 * CALLBACX — GET /api/campaigns/[id]/budget
 * Campaign budget tracking: spent vs allocated.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getCampaignBudget } from "@/services/payments";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const campaignId = uuid.parse(id);

  const result = await getCampaignBudget(campaignId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
