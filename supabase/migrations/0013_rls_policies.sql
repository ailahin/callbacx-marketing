-- Migration 0013: Row Level Security, triggers, and composite indexes
-- RLS is enabled on every table containing user or business data.
-- Policies use server-side helper functions (migration 0012) and never trust
-- client-supplied user ids, roles, or ownership claims.

------------------------------------------------------------
-- Additional access helpers used by policies
------------------------------------------------------------

-- Collaboration participant: the creator profile owner, or a brand-side member
-- (owner or active member) of the collaboration's brand.
create or replace function public.is_collaboration_participant(p_collaboration uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select public.is_creator_profile_owner(c.creator_profile_id, p_profile)
     or public.can_manage_brand(c.brand_id, p_profile)
  from public.collaborations c
  where c.id = p_collaboration and c.deleted_at is null;
$$;

create or replace function public.is_conversation_participant(p_conversation uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation
      and cp.profile_id = p_profile
      and cp.left_at is null
  );
$$;

create or replace function public.is_deliverable_submission_owner(p_submission uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.deliverable_submissions ds
    join public.collaboration_deliverables cd on cd.id = ds.collaboration_deliverable_id
    where ds.id = p_submission and ds.creator_profile_id = public.creator_profile_for_profile(p_profile)
  );
$$;

------------------------------------------------------------
-- Generic updated_at trigger
------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

------------------------------------------------------------
-- Enable RLS + policies: identity
------------------------------------------------------------

alter table public.profiles enable row level security;
create policy "profiles_own_read" on public.profiles
  for select using (auth.uid() = auth_user_id);
create policy "profiles_public_read" on public.profiles
  for select using (is_public = true and deleted_at is null);
create policy "profiles_own_insert" on public.profiles
  for insert with check (auth.uid() = auth_user_id);
create policy "profiles_own_update" on public.profiles
  for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
create policy "profiles_own_soft_delete" on public.profiles
  for update using (auth.uid() = auth_user_id or public.is_staff(auth.uid()))
  with check (auth.uid() = auth_user_id or public.is_staff(auth.uid()));

alter table public.profile_private enable row level security;
create policy "profile_private_owner" on public.profile_private
  for all using (
    auth.uid() = (select profile_id from public.profiles where id = profile_id limit 1)
  );

alter table public.user_roles enable row level security;
create policy "user_roles_read" on public.user_roles for select using (true);
create policy "user_roles_staff_write" on public.user_roles
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.permissions enable row level security;
create policy "permissions_read" on public.permissions for select using (true);
create policy "permissions_staff_write" on public.permissions
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.role_permissions enable row level security;
create policy "role_permissions_read" on public.role_permissions for select using (true);
create policy "role_permissions_staff_write" on public.role_permissions
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.profile_user_roles enable row level security;
create policy "profile_user_roles_read_own_or_staff" on public.profile_user_roles
  for select using (
    auth.uid() = profile_id or public.is_staff(auth.uid())
  );
create policy "profile_user_roles_insert_self_creator_or_staff" on public.profile_user_roles
  for insert with check (
    public.is_staff(auth.uid())
    or (auth.uid() = profile_id
        and exists (
          select 1 from public.user_roles ur
          where ur.id = role_id and ur.slug = 'creator' and ur.is_privileged = false
        ))
  );
create policy "profile_user_roles_update_staff" on public.profile_user_roles
  for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "profile_user_roles_delete_staff" on public.profile_user_roles
  for delete using (public.is_staff(auth.uid()));

alter table public.user_preferences enable row level security;
create policy "user_preferences_owner" on public.user_preferences
  for all using (auth.uid() = profile_id);

alter table public.user_sessions enable row level security;
create policy "user_sessions_owner" on public.user_sessions
  for all using (auth.uid() = profile_id);
create policy "user_sessions_staff_read" on public.user_sessions
  for select using (public.is_staff(auth.uid()));

------------------------------------------------------------
-- Enable RLS + policies: brands
------------------------------------------------------------

alter table public.brand_categories enable row level security;
create policy "brand_categories_read" on public.brand_categories for select using (true);
create policy "brand_categories_staff_write" on public.brand_categories
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.brands enable row level security;
create policy "brands_read_active" on public.brands
  for select using (is_active = true and deleted_at is null);
create policy "brands_read_owner_member" on public.brands
  for select using (
    public.is_brand_owner(id, auth.uid()) or public.is_brand_member(id, auth.uid())
  );
create policy "brands_insert_owner" on public.brands
  for insert with check (auth.uid() = owner_id);
create policy "brands_update_manager" on public.brands
  for update using (public.can_manage_brand(id, auth.uid()))
  with check (public.can_manage_brand(id, auth.uid()));
create policy "brands_delete_owner_staff" on public.brands
  for delete using (
    auth.uid() = owner_id or public.is_staff(auth.uid())
  );

alter table public.brand_members enable row level security;
create policy "brand_members_read" on public.brand_members
  for select using (
    public.is_brand_owner(brand_id, auth.uid())
    or public.is_brand_member(brand_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "brand_members_insert_manager" on public.brand_members
  for insert with check (public.can_manage_brand(brand_id, auth.uid()));
create policy "brand_members_update_manager" on public.brand_members
  for update using (public.can_manage_brand(brand_id, auth.uid()))
  with check (public.can_manage_brand(brand_id, auth.uid()));
create policy "brand_members_delete_manager" on public.brand_members
  for delete using (public.can_manage_brand(brand_id, auth.uid()));

alter table public.brand_invitations enable row level security;
create policy "brand_invitations_read" on public.brand_invitations
  for select using (
    public.can_manage_brand(brand_id, auth.uid())
    or auth.uid() = invited_by
    or public.is_staff(auth.uid())
  );
create policy "brand_invitations_insert_manager" on public.brand_invitations
  for insert with check (public.can_manage_brand(brand_id, auth.uid()));
create policy "brand_invitations_update_respond" on public.brand_invitations
  for update using (
    public.can_manage_brand(brand_id, auth.uid())
    or accepted_by = auth.uid()
  );
create policy "brand_invitations_delete_manager" on public.brand_invitations
  for delete using (public.can_manage_brand(brand_id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.brand_verifications enable row level security;
create policy "brand_verifications_read" on public.brand_verifications
  for select using (
    public.can_manage_brand(brand_id, auth.uid()) or public.is_staff(auth.uid())
  );
create policy "brand_verifications_insert_manager" on public.brand_verifications
  for insert with check (public.can_manage_brand(brand_id, auth.uid()));
create policy "brand_verifications_update_staff" on public.brand_verifications
  for update using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

alter table public.brand_billing_profiles enable row level security;
create policy "brand_billing_profiles_read" on public.brand_billing_profiles
  for select using (
    public.can_manage_brand(brand_id, auth.uid()) or public.is_staff(auth.uid())
  );
create policy "brand_billing_profiles_write_manager" on public.brand_billing_profiles
  for all using (public.can_manage_brand(brand_id, auth.uid()))
  with check (public.can_manage_brand(brand_id, auth.uid()));

------------------------------------------------------------
-- Enable RLS + policies: creators
------------------------------------------------------------

alter table public.creator_categories enable row level security;
create policy "creator_categories_read" on public.creator_categories for select using (true);
create policy "creator_categories_staff_write" on public.creator_categories
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.creator_niches enable row level security;
create policy "creator_niches_read" on public.creator_niches for select using (true);
create policy "creator_niches_staff_write" on public.creator_niches
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.creator_profiles enable row level security;
create policy "creator_profiles_read_public" on public.creator_profiles
  for select using (is_active = true and deleted_at is null);
create policy "creator_profiles_read_owner" on public.creator_profiles
  for select using (public.is_creator_profile_owner(id, auth.uid()) or public.is_staff(auth.uid()));
create policy "creator_profiles_insert_owner" on public.creator_profiles
  for insert with check (public.is_creator_profile_owner(id, auth.uid()));
create policy "creator_profiles_update_owner" on public.creator_profiles
  for update using (public.is_creator_profile_owner(id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_creator_profile_owner(id, auth.uid()) or public.is_staff(auth.uid()));
create policy "creator_profiles_delete_owner_staff" on public.creator_profiles
  for delete using (public.is_creator_profile_owner(id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.creator_profile_categories enable row level security;
create policy "creator_profile_categories_read" on public.creator_profile_categories for select using (true);
create policy "creator_profile_categories_write_owner" on public.creator_profile_categories
  for all using (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  )
  with check (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );

alter table public.creator_profile_niches enable row level security;
create policy "creator_profile_niches_read" on public.creator_profile_niches for select using (true);
create policy "creator_profile_niches_write_owner" on public.creator_profile_niches
  for all using (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  )
  with check (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );

alter table public.creator_social_accounts enable row level security;
create policy "creator_social_accounts_read" on public.creator_social_accounts
  for select using (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "creator_social_accounts_write_owner" on public.creator_social_accounts
  for all using (public.is_creator_profile_owner(creator_profile_id, auth.uid()))
  with check (public.is_creator_profile_owner(creator_profile_id, auth.uid()));

alter table public.creator_portfolios enable row level security;
create policy "creator_portfolios_read_public" on public.creator_portfolios
  for select using (is_public = true);
create policy "creator_portfolios_write_owner" on public.creator_portfolios
  for all using (public.is_creator_profile_owner(creator_profile_id, auth.uid()))
  with check (public.is_creator_profile_owner(creator_profile_id, auth.uid()));

alter table public.creator_media enable row level security;
create policy "creator_media_read" on public.creator_media for select using (true);
create policy "creator_media_write_owner" on public.creator_media
  for all using (public.is_creator_profile_owner(creator_profile_id, auth.uid()))
  with check (public.is_creator_profile_owner(creator_profile_id, auth.uid()));

alter table public.creator_rates enable row level security;
create policy "creator_rates_read_owner" on public.creator_rates
  for select using (public.is_creator_profile_owner(creator_profile_id, auth.uid()) or public.is_staff(auth.uid()));
create policy "creator_rates_write_owner" on public.creator_rates
  for all using (public.is_creator_profile_owner(creator_profile_id, auth.uid()))
  with check (public.is_creator_profile_owner(creator_profile_id, auth.uid()));

alter table public.creator_availability enable row level security;
create policy "creator_availability_read_owner" on public.creator_availability
  for select using (public.is_creator_profile_owner(creator_profile_id, auth.uid()) or public.is_staff(auth.uid()));
create policy "creator_availability_write_owner" on public.creator_availability
  for all using (public.is_creator_profile_owner(creator_profile_id, auth.uid()))
  with check (public.is_creator_profile_owner(creator_profile_id, auth.uid()));

alter table public.creator_verifications enable row level security;
create policy "creator_verifications_read" on public.creator_verifications
  for select using (public.is_creator_profile_owner(creator_profile_id, auth.uid()) or public.is_staff(auth.uid()));
create policy "creator_verifications_insert_owner" on public.creator_verifications
  for insert with check (public.is_creator_profile_owner(creator_profile_id, auth.uid()));
create policy "creator_verifications_update_staff" on public.creator_verifications
  for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

------------------------------------------------------------
-- Enable RLS + policies: campaigns
------------------------------------------------------------

alter table public.campaign_categories enable row level security;
create policy "campaign_categories_read" on public.campaign_categories for select using (true);
create policy "campaign_categories_staff_write" on public.campaign_categories
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.campaign_niches enable row level security;
create policy "campaign_niches_read" on public.campaign_niches for select using (true);
create policy "campaign_niches_staff_write" on public.campaign_niches
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.campaigns enable row level security;
create policy "campaigns_read_public" on public.campaigns
  for select using (
    deleted_at is null and status = 'published' and visibility = 'public'
  );
create policy "campaigns_read_brand" on public.campaigns
  for select using (public.is_campaign_brand_member(id, auth.uid()) or public.is_staff(auth.uid()));
create policy "campaigns_insert_brand" on public.campaigns
  for insert with check (public.is_campaign_brand_member(id, auth.uid()));
create policy "campaigns_update_brand" on public.campaigns
  for update using (public.is_campaign_brand_member(id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_campaign_brand_member(id, auth.uid()) or public.is_staff(auth.uid()));
create policy "campaigns_delete_brand_staff" on public.campaigns
  for delete using (public.is_campaign_brand(id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.campaign_campaign_niches enable row level security;
create policy "campaign_campaign_niches_read" on public.campaign_campaign_niches for select using (true);
create policy "campaign_campaign_niches_write_brand" on public.campaign_campaign_niches
  for all using (
    public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid())
  )
  with check (
    public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid())
  );

alter table public.campaign_requirements enable row level security;
create policy "campaign_requirements_read" on public.campaign_requirements for select using (true);
create policy "campaign_requirements_write_brand" on public.campaign_requirements
  for all using (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.campaign_deliverables enable row level security;
create policy "campaign_deliverables_read" on public.campaign_deliverables for select using (true);
create policy "campaign_deliverables_write_brand" on public.campaign_deliverables
  for all using (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.campaign_media enable row level security;
create policy "campaign_media_read" on public.campaign_media for select using (true);
create policy "campaign_media_write_brand" on public.campaign_media
  for all using (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.campaign_budget_allocations enable row level security;
create policy "campaign_budget_allocations_read" on public.campaign_budget_allocations for select using (true);
create policy "campaign_budget_allocations_write_brand" on public.campaign_budget_allocations
  for all using (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()));

------------------------------------------------------------
-- Enable RLS + policies: applications and collaborations
------------------------------------------------------------

alter table public.campaign_applications enable row level security;
create policy "campaign_applications_read" on public.campaign_applications
  for select using (
    public.is_campaign_brand_member(campaign_id, auth.uid())
    or public.is_creator_profile_owner(
      (select creator_profile_id from public.creator_profiles where id = creator_profile_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "campaign_applications_insert_creator" on public.campaign_applications
  for insert with check (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    and not exists (
      select 1 from public.campaign_applications ca
      where ca.campaign_id = campaign_applications.campaign_id
        and ca.creator_profile_id = campaign_applications.creator_profile_id
    )
  );
create policy "campaign_applications_update" on public.campaign_applications
  for update using (
    public.is_campaign_brand_member(campaign_id, auth.uid())
    or public.is_creator_profile_owner(
      (select creator_profile_id from public.creator_profiles where id = creator_profile_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );

alter table public.collaboration_invitations enable row level security;
create policy "collaboration_invitations_read" on public.collaboration_invitations
  for select using (
    public.can_manage_brand(brand_id, auth.uid())
    or public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "collaboration_invitations_insert_brand" on public.collaboration_invitations
  for insert with check (public.can_manage_brand(brand_id, auth.uid()));
create policy "collaboration_invitations_update_respond" on public.collaboration_invitations
  for update using (
    public.can_manage_brand(brand_id, auth.uid())
    or public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "collaboration_invitations_delete_brand_staff" on public.collaboration_invitations
  for delete using (public.can_manage_brand(brand_id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.collaborations enable row level security;
create policy "collaborations_read" on public.collaborations
  for select using (
    deleted_at is null
    and (public.is_collaboration_participant(id, auth.uid()) or public.is_staff(auth.uid()))
  );
create policy "collaborations_insert" on public.collaborations
  for insert with check (
    public.is_campaign_brand_member(campaign_id, auth.uid())
    or (
      public.is_creator_profile_owner(creator_profile_id, auth.uid())
      and exists (
        select 1 from public.campaign_applications ca
        where ca.campaign_id = collaborations.campaign_id
          and ca.creator_profile_id = collaborations.creator_profile_id
          and ca.status = 'accepted'
      )
    )
    or public.is_staff(auth.uid())
  );
create policy "collaborations_update" on public.collaborations
  for update using (
    public.is_collaboration_participant(id, auth.uid()) or public.is_staff(auth.uid())
  )
  with check (
    public.is_collaboration_participant(id, auth.uid()) or public.is_staff(auth.uid())
  );
create policy "collaborations_delete_staff" on public.collaborations
  for delete using (public.is_staff(auth.uid()));

alter table public.collaboration_deliverables enable row level security;
create policy "collaboration_deliverables_read" on public.collaboration_deliverables
  for select using (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "collaboration_deliverables_insert_brand" on public.collaboration_deliverables
  for insert with check (public.is_collaboration_participant(collaboration_id, auth.uid()) or public.is_staff(auth.uid()));
create policy "collaboration_deliverables_update" on public.collaboration_deliverables
  for update using (
    public.is_collaboration_participant(collaboration_id, auth.uid()) or public.is_staff(auth.uid())
  )
  with check (
    public.is_collaboration_participant(collaboration_id, auth.uid()) or public.is_staff(auth.uid())
  );

alter table public.deliverable_submissions enable row level security;
create policy "deliverable_submissions_read" on public.deliverable_submissions
  for select using (
    public.is_collaboration_participant(
      (select collaboration_id from public.collaboration_deliverables where id = collaboration_deliverable_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "deliverable_submissions_insert_creator" on public.deliverable_submissions
  for insert with check (
    public.is_deliverable_submission_owner(id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "deliverable_submissions_update_owner" on public.deliverable_submissions
  for update using (public.is_deliverable_submission_owner(id, auth.uid()) or public.is_staff(auth.uid()))
  with check (public.is_deliverable_submission_owner(id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.deliverable_reviews enable row level security;
create policy "deliverable_reviews_read" on public.deliverable_reviews
  for select using (
    public.is_collaboration_participant(
      (select cd.collaboration_id from public.deliverable_submissions ds
       join public.collaboration_deliverables cd on cd.id = ds.collaboration_deliverable_id
       where ds.id = deliverable_submission_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "deliverable_reviews_insert_brand" on public.deliverable_reviews
  for insert with check (
    public.is_collaboration_participant(
      (select cd.collaboration_id from public.deliverable_submissions ds
       join public.collaboration_deliverables cd on cd.id = ds.collaboration_deliverable_id
       where ds.id = deliverable_submission_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );

alter table public.collaboration_contracts enable row level security;
create policy "collaboration_contracts_read" on public.collaboration_contracts
  for select using (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "collaboration_contracts_write_brand_staff" on public.collaboration_contracts
  for all using (
    public.is_collaboration_participant(collaboration_id, auth.uid()) or public.is_staff(auth.uid())
  )
  with check (
    public.is_collaboration_participant(collaboration_id, auth.uid()) or public.is_staff(auth.uid())
  );

alter table public.collaboration_status_history enable row level security;
create policy "collaboration_status_history_read" on public.collaboration_status_history
  for select using (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "collaboration_status_history_insert_server" on public.collaboration_status_history
  for insert with check (public.is_staff(auth.uid()) or auth.uid() is null);

------------------------------------------------------------
-- Enable RLS + policies: messaging and notifications
------------------------------------------------------------

alter table public.conversations enable row level security;
create policy "conversations_read" on public.conversations
  for select using (public.is_conversation_participant(id, auth.uid()) or public.is_staff(auth.uid()));
create policy "conversations_insert" on public.conversations
  for insert with check (auth.uid() = created_by);
create policy "conversations_update" on public.conversations
  for update using (public.is_conversation_participant(id, auth.uid()) or public.is_staff(auth.uid()));

alter table public.conversation_participants enable row level security;
create policy "conversation_participants_read" on public.conversation_participants
  for select using (
    public.is_conversation_participant(conversation_id, auth.uid()) or public.is_staff(auth.uid())
  );
create policy "conversation_participants_insert" on public.conversation_participants
  for insert with check (
    public.is_staff(auth.uid())
    or auth.uid() = (select created_by from public.conversations where id = conversation_id limit 1)
  );
create policy "conversation_participants_update_own" on public.conversation_participants
  for update using (auth.uid() = profile_id or public.is_staff(auth.uid()))
  with check (auth.uid() = profile_id or public.is_staff(auth.uid()));
create policy "conversation_participants_delete" on public.conversation_participants
  for delete using (auth.uid() = profile_id or public.is_staff(auth.uid()));

alter table public.messages enable row level security;
create policy "messages_read" on public.messages
  for select using (
    public.is_conversation_participant(conversation_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "messages_insert" on public.messages
  for insert with check (
    public.is_conversation_participant(conversation_id, auth.uid())
    and auth.uid() = sender_id
  );
create policy "messages_update_own" on public.messages
  for update using (auth.uid() = sender_id and deleted_at is null)
  with check (auth.uid() = sender_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = sender_id);

alter table public.message_attachments enable row level security;
create policy "message_attachments_read" on public.message_attachments
  for select using (
    public.is_conversation_participant(
      (select conversation_id from public.messages where id = message_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "message_attachments_insert" on public.message_attachments
  for insert with check (
    public.is_conversation_participant(
      (select conversation_id from public.messages where id = message_id limit 1),
      auth.uid()
    )
    and auth.uid() = (select sender_id from public.messages where id = message_id limit 1)
  );

alter table public.notifications enable row level security;
create policy "notifications_read_own" on public.notifications
  for select using (auth.uid() = recipient_id);
create policy "notifications_update_read_own" on public.notifications
  for update using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);
-- Inserts are server-side only (no client insert policy).

alter table public.notification_preferences enable row level security;
create policy "notification_preferences_owner" on public.notification_preferences
  for all using (auth.uid() = profile_id);

------------------------------------------------------------
-- Enable RLS + policies: payments
------------------------------------------------------------

alter table public.payment_transactions enable row level security;
create policy "payment_transactions_read_parties" on public.payment_transactions
  for select using (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    or exists (
      select 1 from public.invoices i where i.id = invoice_id
        and (i.brand_id = (select id from public.brands where owner_id = auth.uid() limit 1)
             or i.creator_profile_id = public.creator_profile_for_profile(auth.uid()))
    )
    or public.is_staff(auth.uid())
  );
create policy "payment_transactions_insert_server" on public.payment_transactions
  for insert with check (public.is_staff(auth.uid()) or auth.uid() is null);
create policy "payment_transactions_update_server" on public.payment_transactions
  for update using (public.is_staff(auth.uid()) or auth.uid() is null);

alter table public.invoices enable row level security;
create policy "invoices_read_parties" on public.invoices
  for select using (
    auth.uid() = (select owner_id from public.brands where id = brand_id limit 1)
    or auth.uid() = (select profile_id from public.creator_profiles where id = creator_profile_id limit 1)
    or public.is_staff(auth.uid())
  );
create policy "invoices_write_brand_server" on public.invoices
  for all using (
    auth.uid() = (select owner_id from public.brands where id = brand_id limit 1)
    or public.is_staff(auth.uid())
  )
  with check (
    auth.uid() = (select owner_id from public.brands where id = brand_id limit 1)
    or public.is_staff(auth.uid())
  );

alter table public.creator_payouts enable row level security;
create policy "creator_payouts_read" on public.creator_payouts
  for select using (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "creator_payouts_insert_server" on public.creator_payouts
  for insert with check (public.is_staff(auth.uid()) or auth.uid() is null);

alter table public.platform_fees enable row level security;
create policy "platform_fees_read_staff" on public.platform_fees
  for select using (public.is_staff(auth.uid()));
create policy "platform_fees_insert_server" on public.platform_fees
  for insert with check (auth.uid() is null);

alter table public.refunds enable row level security;
create policy "refunds_read_parties" on public.refunds
  for select using (
    exists (
      select 1 from public.payment_transactions pt where pt.id = payment_transaction_id
        and (
          public.is_collaboration_participant(pt.collaboration_id, auth.uid())
          or pt.collaboration_id is null
        )
    )
    or public.is_staff(auth.uid())
  );
create policy "refunds_insert_staff_server" on public.refunds
  for insert with check (public.is_staff(auth.uid()) or auth.uid() is null);

alter table public.payment_webhook_events enable row level security;
create policy "payment_webhook_events_read_staff" on public.payment_webhook_events
  for select using (public.is_staff(auth.uid()));
create policy "payment_webhook_events_insert_server" on public.payment_webhook_events
  for insert with check (auth.uid() is null);

------------------------------------------------------------
-- Enable RLS + policies: analytics
------------------------------------------------------------

alter table public.campaign_analytics enable row level security;
create policy "campaign_analytics_read_brand" on public.campaign_analytics
  for select using (public.is_campaign_brand_member(campaign_id, auth.uid()) or public.is_staff(auth.uid()));
create policy "campaign_analytics_insert_server" on public.campaign_analytics
  for insert with check (auth.uid() is null);

alter table public.creator_analytics enable row level security;
create policy "creator_analytics_read" on public.creator_analytics
  for select using (public.is_creator_profile_owner(creator_profile_id, auth.uid()) or public.is_staff(auth.uid()));
create policy "creator_analytics_insert_server" on public.creator_analytics
  for insert with check (auth.uid() is null);

alter table public.social_metrics_snapshots enable row level security;
create policy "social_metrics_snapshots_read" on public.social_metrics_snapshots
  for select using (
    public.is_creator_profile_owner(
      (select creator_profile_id from public.creator_social_accounts where id = creator_social_account_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "social_metrics_snapshots_insert_server" on public.social_metrics_snapshots
  for insert with check (auth.uid() is null);

alter table public.conversion_events enable row level security;
create policy "conversion_events_read" on public.conversion_events
  for select using (
    (campaign_id is not null and public.is_campaign_brand_member(campaign_id, auth.uid()))
    or (collaboration_id is not null and public.is_collaboration_participant(collaboration_id, auth.uid()))
    or (creator_profile_id is not null and public.is_creator_profile_owner(creator_profile_id, auth.uid()))
    or public.is_staff(auth.uid())
  );
create policy "conversion_events_insert_server" on public.conversion_events
  for insert with check (auth.uid() is null);

alter table public.platform_analytics enable row level security;
create policy "platform_analytics_read_staff" on public.platform_analytics
  for select using (public.is_staff(auth.uid()));
create policy "platform_analytics_insert_server" on public.platform_analytics
  for insert with check (auth.uid() is null);

------------------------------------------------------------
-- Enable RLS + policies: reputation, moderation, support
------------------------------------------------------------

alter table public.reviews enable row level security;
create policy "reviews_read" on public.reviews
  for select using (
    is_public = true
    or public.is_collaboration_participant(collaboration_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "reviews_insert_participant" on public.reviews
  for insert with check (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    and (reviewer_id = auth.uid())
  );
create policy "reviews_update_owner" on public.reviews
  for update using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

alter table public.review_responses enable row level security;
create policy "review_responses_read" on public.review_responses
  for select using (
    public.is_collaboration_participant(
      (select collaboration_id from public.reviews where id = review_id limit 1),
      auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "review_responses_insert_reviewee" on public.review_responses
  for insert with check (
    auth.uid() = responder_id
    and exists (
      select 1 from public.reviews r where r.id = review_id and r.reviewee_id = auth.uid()
    )
  );

alter table public.disputes enable row level security;
create policy "disputes_read" on public.disputes
  for select using (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    or public.is_staff(auth.uid())
  );
create policy "disputes_insert_participant" on public.disputes
  for insert with check (
    public.is_collaboration_participant(collaboration_id, auth.uid())
    and auth.uid() = opened_by
  );
create policy "disputes_update_staff" on public.disputes
  for update using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

alter table public.support_tickets enable row level security;
create policy "support_tickets_read" on public.support_tickets
  for select using (auth.uid() = profile_id or public.is_staff(auth.uid()));
create policy "support_tickets_insert_owner" on public.support_tickets
  for insert with check (auth.uid() = profile_id);
create policy "support_tickets_update" on public.support_tickets
  for update using (auth.uid() = profile_id or public.is_staff(auth.uid()))
  with check (auth.uid() = profile_id or public.is_staff(auth.uid()));

alter table public.support_ticket_messages enable row level security;
create policy "support_ticket_messages_read" on public.support_ticket_messages
  for select using (
    auth.uid() = sender_id
    or public.is_staff(auth.uid())
    or exists (
      select 1 from public.support_tickets st where st.id = support_ticket_id and st.profile_id = auth.uid()
    )
  );
create policy "support_ticket_messages_insert" on public.support_ticket_messages
  for insert with check (auth.uid() = sender_id or public.is_staff(auth.uid()));

alter table public.moderation_reports enable row level security;
create policy "moderation_reports_read" on public.moderation_reports
  for select using (auth.uid() = reporter_id or public.is_staff(auth.uid()));
create policy "moderation_reports_insert" on public.moderation_reports
  for insert with check (auth.uid() = reporter_id);
create policy "moderation_reports_update_staff" on public.moderation_reports
  for update using (public.is_staff(auth.uid()));

alter table public.moderation_actions enable row level security;
create policy "moderation_actions_read_staff" on public.moderation_actions
  for select using (public.is_staff(auth.uid()));
create policy "moderation_actions_insert_staff" on public.moderation_actions
  for insert with check (public.is_staff(auth.uid()));

------------------------------------------------------------
-- Enable RLS + policies: administration
------------------------------------------------------------

alter table public.admin_activity_logs enable row level security;
create policy "admin_activity_logs_read_staff" on public.admin_activity_logs
  for select using (public.is_staff(auth.uid()));
create policy "admin_activity_logs_insert_server" on public.admin_activity_logs
  for insert with check (public.is_staff(auth.uid()) or auth.uid() is null);

alter table public.audit_logs enable row level security;
create policy "audit_logs_read_staff" on public.audit_logs
  for select using (public.is_staff(auth.uid()));
create policy "audit_logs_insert_server" on public.audit_logs
  for insert with check (public.is_staff(auth.uid()) or auth.uid() is null);

alter table public.platform_settings enable row level security;
create policy "platform_settings_read_public" on public.platform_settings
  for select using (is_public = true);
create policy "platform_settings_read_staff" on public.platform_settings
  for select using (public.is_staff(auth.uid()));
create policy "platform_settings_write_staff" on public.platform_settings
  for all using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

alter table public.system_notifications enable row level security;
create policy "system_notifications_read" on public.system_notifications
  for select using (
    target_role = 'all'
    or (target_role = 'admin' and public.is_staff(auth.uid()))
    or (target_role = 'brand' and public.has_any_role(auth.uid(), array['brand_owner','brand_admin','brand_member']))
    or (target_role = 'creator' and exists (
      select 1 from public.creator_profiles cp where cp.profile_id = auth.uid() and cp.deleted_at is null
    ))
  );
create policy "system_notifications_write_staff" on public.system_notifications
  for all using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

alter table public.feature_flags enable row level security;
create policy "feature_flags_read" on public.feature_flags for select using (true);
create policy "feature_flags_write_staff" on public.feature_flags
  for all using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

------------------------------------------------------------
-- Triggers: status transitions and role guards
------------------------------------------------------------

create trigger trg_profile_user_roles_guard
  before insert or update on public.profile_user_roles
  for each row execute function public.trg_guard_privileged_role_assignment();

create trigger trg_audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function public.trg_audit_logs_append_only();

create trigger trg_campaign_status_transition
  before update on public.campaigns
  for each row execute function public.trg_campaign_status_transition();

create trigger trg_collaboration_status_transition
  before update on public.collaborations
  for each row execute function public.trg_collaboration_status_transition();

create trigger trg_collaboration_deliverable_transition
  before update on public.collaboration_deliverables
  for each row execute function public.trg_deliverable_status_transition();

create trigger trg_campaign_application_transition
  before update on public.campaign_applications
  for each row execute function public.trg_application_status_transition();

------------------------------------------------------------
-- Triggers: auto updated_at
------------------------------------------------------------

do $$
declare
  tables text[] := array[
    'profiles','profile_private','brands','brand_members','brand_invitations',
    'brand_verifications','brand_billing_profiles','creator_profiles','creator_social_accounts',
    'creator_portfolios','creator_media','creator_rates','creator_availability',
    'creator_verifications','campaigns','campaign_deliverables','campaign_budget_allocations',
    'collaborations','collaboration_deliverables','deliverable_reviews','collaboration_contracts',
    'conversations','conversation_participants','messages','notifications','notification_preferences',
    'payment_transactions','invoices','creator_payouts','reviews','review_responses','disputes',
    'support_tickets','moderation_reports','platform_settings','feature_flags'
  ];
  t text;
begin
  foreach t in array tables loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

------------------------------------------------------------
-- Composite indexes for common query patterns
------------------------------------------------------------

create index idx_campaigns_brand_status_date on public.campaigns(brand_id, status, created_at desc) where deleted_at is null;
create index idx_collaborations_creator_status on public.collaborations(creator_profile_id, status) where deleted_at is null;
create index idx_collaborations_brand_status on public.collaborations(brand_id, status) where deleted_at is null;
create index idx_messages_conversation_created on public.messages(conversation_id, created_at desc);
create index idx_notifications_recipient_created_unread on public.notifications(recipient_id, created_at desc) where read_at is null;
create index idx_payment_transactions_created on public.payment_transactions(created_at desc);
create index idx_invoices_brand_created on public.invoices(brand_id, created_at desc);
create index idx_invoices_creator_created on public.invoices(creator_profile_id, created_at desc);
create index idx_reviews_reviewee_created on public.reviews(reviewee_id, created_at desc) where is_public = true;
create index idx_support_tickets_profile_created on public.support_tickets(profile_id, created_at desc);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.audit_logs is 'Append-only. Updates/deletes blocked by trigger; inserts restricted to staff/server functions.';
comment on trigger trg_campaign_status_transition on public.campaigns is 'Enforces valid campaign status transitions server-side.';
comment on trigger trg_collaboration_status_transition on public.collaborations is 'Enforces valid collaboration status transitions server-side.';
