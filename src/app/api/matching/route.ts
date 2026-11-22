/**
 * CALLBACX — POST /api/matching
 *
 * Match creators for a campaign using the rule-based explainable engine.
 * Body: { campaignId: string, ...matchingCriteria }
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { matchCreatorsForCampaign } from "@/services/matching";
import { z } from "zod";
import { uuid, matchingCriteriaSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const { campaignId, ...criteriaInput } = z
    .object({ campaignId: uuid })
    .parse(body);
  const criteria = matchingCriteriaSchema.parse(criteriaInput);

  const result = await matchCreatorsForCampaign(campaignId, criteria, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
