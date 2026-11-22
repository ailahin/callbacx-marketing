/**
 * CALLBACX — POST /api/integrations/email/send
 *
 * Send a transactional email via Resend (or equivalent provider).
 * Staff/system use; requires RESEND_API_KEY + sender email configured in
 * integration settings. Returns INTEGRATION_NOT_CONFIGURED until an
 * administrator sets up the provider.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { sendEmail, sendTransactionalNotification } from "@/services/integrations";
import { integrationEmailSendSchema, integrationNotificationSendSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const notification = body.notification === true;

  if (notification) {
    const input = integrationNotificationSendSchema.parse(body);
    const result = await sendTransactionalNotification(
      {
        recipientEmail: input.recipient_email,
        recipientProfileId: input.recipient_profile_id ?? null,
        category: input.category,
        subject: input.subject,
        body: input.body,
        templateId: input.template_id ?? null,
      },
      supabase
    );
    return Response.json({ data: result }, { status: 201 });
  }

  const input = integrationEmailSendSchema.parse(body);
  const result = await sendEmail(
    {
      to: input.to,
      subject: input.subject,
      body: input.body,
      from: undefined,
      replyTo: input.reply_to ?? undefined,
      templateId: input.template_id ?? null,
    },
    supabase
  );
  return Response.json({ data: result }, { status: 201 });
});
