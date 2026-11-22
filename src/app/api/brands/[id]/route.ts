/**
 * CALLBACX — GET /api/brands/[id]
 * Get a brand by ID.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getBrand } from "@/services/brands";
import { uuid } from "@/lib/validations";

export const GET = withErrorHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const brandId = uuid.parse(id);

  const result = await getBrand(brandId, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

