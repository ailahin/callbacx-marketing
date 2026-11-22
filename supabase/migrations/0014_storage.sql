-- Migration 0014: Supabase Storage buckets and object policies
-- Buckets:
--   brand-logos        (public)   - brand logos
--   creator-avatars    (public)   - creator profile images
--   creator-portfolios (public)   - creator portfolio media
--   campaign-assets    (public)   - campaign images/videos
--   deliverable-submissions (private) - creator content submissions
--   contracts          (private)  - signed contracts and documents
--   messages           (private)  - message attachments
--
-- Object paths are namespaced by owner id so policies can validate ownership
-- from the path alone (e.g. brand-logos/{brand_id}/logo.png).

------------------------------------------------------------
-- Buckets
------------------------------------------------------------

-- Object policies require RLS on storage.objects (enabled by Supabase by
-- default; made explicit here for portability).
alter table storage.objects enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('brand-logos', 'brand-logos', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('creator-avatars', 'creator-avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('creator-portfolios', 'creator-portfolios', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime']),
  ('campaign-assets', 'campaign-assets', true, 20971520, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']),
  ('deliverable-submissions', 'deliverable-submissions', false, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','application/pdf']),
  ('contracts', 'contracts', false, 20971520, array['application/pdf','image/png','image/jpeg']),
  ('messages', 'messages', false, 10485760, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','application/pdf','audio/mpeg','audio/wav'])
on conflict (id) do nothing;

------------------------------------------------------------
-- Public buckets: public read for everyone
------------------------------------------------------------

-- Brand logos are public (brand discovery).
create policy "brand_logos_public_read" on storage.objects
  for select using (bucket_id = 'brand-logos');

-- Creator avatars are public (profile discovery).
create policy "creator_avatars_public_read" on storage.objects
  for select using (bucket_id = 'creator-avatars');

-- Creator portfolios are public (creator discovery).
create policy "creator_portfolios_public_read" on storage.objects
  for select using (bucket_id = 'creator-portfolios');

-- Campaign assets are public for published campaigns.
create policy "campaign_assets_public_read" on storage.objects
  for select using (bucket_id = 'campaign-assets');

------------------------------------------------------------
-- Brand logos: only brand owner/admins may write, scoped to their brand folder
-- Path: brand-logos/{brand_id}/...
------------------------------------------------------------

create policy "brand_logos_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'brand-logos'
    and split_part(name, '/', 2)::uuid = public.current_profile_id()
    and public.can_manage_brand(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

create policy "brand_logos_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'brand-logos'
    and split_part(name, '/', 2)::uuid = public.current_profile_id()
    and public.can_manage_brand(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

create policy "brand_logos_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'brand-logos'
    and split_part(name, '/', 2)::uuid = public.current_profile_id()
    and public.can_manage_brand(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

------------------------------------------------------------
-- Creator avatars: owner only, path creator-avatars/{profile_id}/...
------------------------------------------------------------

create policy "creator_avatars_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'creator-avatars'
    and split_part(name, '/', 2)::uuid = public.current_profile_id()
  );

create policy "creator_avatars_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'creator-avatars'
    and split_part(name, '/', 2)::uuid = public.current_profile_id()
  );

create policy "creator_avatars_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'creator-avatars'
    and split_part(name, '/', 2)::uuid = public.current_profile_id()
  );

------------------------------------------------------------
-- Creator portfolios: creator owner only, path creator-portfolios/{creator_profile_id}/...
------------------------------------------------------------

create policy "creator_portfolios_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'creator-portfolios'
    and public.is_creator_profile_owner(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

create policy "creator_portfolios_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'creator-portfolios'
    and public.is_creator_profile_owner(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

create policy "creator_portfolios_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'creator-portfolios'
    and public.is_creator_profile_owner(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

------------------------------------------------------------
-- Campaign assets: brand manager of the campaign, path campaign-assets/{campaign_id}/...
------------------------------------------------------------

create policy "campaign_assets_insert_brand" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'campaign-assets'
    and public.is_campaign_brand_member(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

create policy "campaign_assets_update_brand" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'campaign-assets'
    and public.is_campaign_brand_member(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

create policy "campaign_assets_delete_brand" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'campaign-assets'
    and public.is_campaign_brand_member(split_part(name, '/', 2)::uuid, public.current_profile_id())
  );

------------------------------------------------------------
-- Private buckets: deliverable submissions, contracts, messages
-- Access limited to collaboration/conversation participants and staff.
------------------------------------------------------------

create policy "deliverable_submissions_private" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'deliverable-submissions'
    and (
      public.is_collaboration_participant(split_part(name, '/', 2)::uuid, public.current_profile_id())
      or public.is_staff(public.current_profile_id())
    )
  );

create policy "contracts_private" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'contracts'
    and (
      public.is_collaboration_participant(split_part(name, '/', 2)::uuid, public.current_profile_id())
      or public.is_staff(public.current_profile_id())
    )
  );

create policy "messages_private" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'messages'
    and (
      public.is_conversation_participant(split_part(name, '/', 2)::uuid, public.current_profile_id())
      or public.is_staff(public.current_profile_id())
    )
  );

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table storage.buckets is 'CALLBACX TECHNOLOGY storage buckets. Private buckets (deliverable-submissions, contracts, messages) are never publicly accessible.';
comment on policy "deliverable_submissions_private" on storage.objects is 'Participant-only access to private creator submissions. Path segment 2 is the collaboration id.';


