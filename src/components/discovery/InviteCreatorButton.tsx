"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  Input,
  Textarea,
} from "@/components";
import { MailIcon, ClockIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { inviteCreatorToCampaign } from "@/services/creators";
import { useToast } from "@/components";
import { z } from "zod";

const invitationSchema = z.object({
  proposed_fee: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  message: z.string().max(5000).optional().or(z.literal("")),
  expires_at: z.coerce.date(),
});

export interface InviteCreatorButtonProps {
  creatorId: string;
  creatorName: string;
  campaignId: string;
  campaignTitle: string;
  className?: string;
}

/**
 * Invite a creator to a campaign. Opens a sheet with fee, message and expiry,
 * then creates a collaboration invitation.
 */
export function InviteCreatorButton({
  creatorId,
  creatorName,
  campaignId,
  campaignTitle,
  className,
}: InviteCreatorButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<{
    proposed_fee: string;
    currency: string;
    message: string;
    expires_at: string;
  }>({
    proposed_fee: "",
    currency: "USD",
    message: "",
    expires_at: "",
  });

  const defaultExpires = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  }, []);

  React.useEffect(() => {
    if (form.expires_at === "") setForm((prev) => ({ ...prev, expires_at: defaultExpires }));
  }, [defaultExpires]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = invitationSchema.safeParse({
        proposed_fee: form.proposed_fee,
        currency: form.currency,
        message: form.message,
        expires_at: form.expires_at,
      });
      if (!parsed.success) {
        toast({ variant: "error", message: "Please check the invitation details." });
        return;
      }
      const result = await inviteCreatorToCampaign({
        campaign_id: campaignId,
        creator_profile_id: creatorId,
        proposed_fee: parsed.data.proposed_fee,
        currency: parsed.data.currency,
        message: parsed.data.message,
        expires_at: parsed.data.expires_at,
      });
      if (result.error) {
        toast({ variant: "error", message: result.error.message });
        return;
      }
      toast({
        variant: "success",
        message: `Invitation sent to ${creatorName}.`,
      });
      setOpen(false);
    } catch {
      toast({ variant: "error", message: "Could not send invitation." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-1.5 text-xs", className)}
      >
        <MailIcon className="h-3 w-3" />
        <span>Invite to campaign</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen} side="right">
        <SheetTrigger />
        <SheetContent className="max-w-[400px]">
          <SheetHeader className="pb-4">
            <SheetTitle>Invite {creatorName}</SheetTitle>
            <SheetDescription>
              Invite this creator to join “{campaignTitle}”.
            </SheetDescription>
            <SheetClose />
          </SheetHeader>
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary block">
                  Proposed fee (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.proposed_fee}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, proposed_fee: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary block">
                  Currency
                </label>
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary block">
                  Message to creator
                </label>
                <Textarea
                  rows={3}
                  placeholder="Introduce your brand and why youâ€™d like to collaborate..."
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-text-secondary" />
                  <label className="text-xs font-medium text-text-secondary">
                    Expires at
                  </label>
                </div>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expires_at: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                  className="flex-1"
                >
                  Send invitation <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </SheetContent>
      </Sheet>
    </>
  );
}
