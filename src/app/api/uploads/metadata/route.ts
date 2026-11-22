/**
 * CALLBACX — POST /api/uploads/metadata
 * Get upload metadata (storage path, bucket, limits) for client-side direct upload.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getUploadMetadata } from "@/services/uploads";
import { uploadPresignSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = uploadPresignSchema.parse(body);

  const result = await getUploadMetadata(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

