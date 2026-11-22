/**
 * CALLBACX — PATCH /api/brands/[id]
 * Update a brand (owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { updateBrand } from "@/services/brands";
import { brandUpdateSchema } from "@/lib/validations";
import { uuid } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { id } = await params;
  const brandId = uuid.parse(id);

  const body = await request.json();
  const input = brandUpdateSchema.parse(body);

  const result = await updateBrand(brandId, input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

