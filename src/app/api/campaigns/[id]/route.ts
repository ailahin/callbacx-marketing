/**
 * CALLBACX — GET /api/campaigns/[id]
 * Get a campaign by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getCampaign } from "@/services/campaigns";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const campaignId = uuid.parse(id);

  const result = await getCampaign(campaignId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

