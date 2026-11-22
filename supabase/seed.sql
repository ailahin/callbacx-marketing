-- Seed data for CALLBACX TECHNOLOGY development
--
-- Usage (local Supabase):
--   supabase start
--   supabase db reset --seed-file supabase/seed.sql
--
-- IMPORTANT: Sample user-bound rows (profiles, brands, creators, campaigns, ...)
-- are guarded by `exists (select 1 from auth.users where id = ...)` because
-- auth.users is managed by Supabase Auth and cannot be populated from SQL.
-- Create the corresponding auth users via the Supabase Auth signup flow (or
-- `supabase auth` APIs) before running the seed, or the user-bound rows will
-- simply be skipped. Reference data (roles, permissions, categories, settings)
-- is always inserted.

------------------------------------------------------------
-- 1. User roles
------------------------------------------------------------

insert into public.user_roles (id, name, slug, description, is_privileged, is_system) values
  ('00000000-0000-0000-0000-000000000001', 'Platform Administrator', 'platform_admin', 'Full platform access. Can manage users, brands, creators, campaigns, payments, moderation.', true, true),
  ('00000000-0000-0000-0000-000000000002', 'Moderator', 'moderator', 'Content moderation, disputes, reports. Cannot manage payments or platform settings.', true, true),
  ('00000000-0000-0000-0000-000000000003', 'Brand Owner', 'brand_owner', 'Owns a brand; manages billing, team members, campaigns.', false, false),
  ('00000000-0000-0000-0000-000000000004', 'Brand Admin', 'brand_admin', 'Manages brand team, campaigns, and billing within a brand.', false, false),
  ('00000000-0000-0000-0000-000000000005', 'Brand Member', 'brand_member', 'Contributes to brand campaigns within permission scope.', false, false),
  ('00000000-0000-0000-0000-000000000006', 'Creator', 'creator', 'Creator/influencer profile owner. Applies to campaigns, manages portfolio.', false, false),
  ('00000000-0000-0000-0000-000000000007', 'Support Agent', 'support', 'Read/write access to support tickets and moderation reports.', false, true)
on conflict (slug) do nothing;

------------------------------------------------------------
-- 2. Permissions
------------------------------------------------------------

insert into public.permissions (id, name, slug, resource, action, description) values
  ('10000000-0000-0000-0000-000000000001', 'Manage users', 'users.manage', 'users', 'manage', 'Create, update, suspend, delete user accounts.'),
  ('10000000-0000-0000-0000-000000000002', 'View users', 'users.read', 'users', 'read', 'Read user profiles.'),
  ('10000000-0000-0000-0000-000000000003', 'Manage roles', 'roles.manage', 'roles', 'manage', 'Assign and revoke roles.'),
  ('10000000-0000-0000-0000-000000000004', 'Manage brands', 'brands.manage', 'brands', 'manage', 'Create/update brands, billing, verification.'),
  ('10000000-0000-0000-0000-000000000005', 'Manage brand members', 'brand_members.manage', 'brand_members', 'manage', 'Invite/remove brand team members.'),
  ('10000000-0000-0000-0000-000000000006', 'Manage campaigns', 'campaigns.manage', 'campaigns', 'manage', 'Create/update/publish/cancel campaigns.'),
  ('10000000-0000-0000-0000-000000000007', 'Moderate campaigns', 'campaigns.moderate', 'campaigns', 'moderate', 'Approve/reject published campaigns.'),
  ('10000000-0000-0000-0000-000000000008', 'Manage applications', 'applications.manage', 'campaign_applications', 'manage', 'Accept/reject creator applications.'),
  ('10000000-0000-0000-0000-000000000009', 'Manage collaborations', 'collaborations.manage', 'collaborations', 'manage', 'Create/update collaborations and contracts.'),
  ('10000000-0000-0000-0000-000000000010', 'Manage payments', 'payments.manage', 'payments', 'manage', 'Process payouts, refunds, invoices.'),
  ('10000000-0000-0000-0000-000000000011', 'View payments', 'payments.read', 'payments', 'read', 'Read payment transactions and invoices.'),
  ('10000000-0000-0000-0000-000000000012', 'Moderate content', 'content.moderate', 'content', 'moderate', 'Review reports, apply moderation actions.'),
  ('10000000-0000-0000-0000-000000000013', 'Manage support tickets', 'support.manage', 'support_tickets', 'manage', 'Assign and resolve support tickets.'),
  ('10000000-0000-0000-0000-000000000014', 'Manage platform settings', 'settings.manage', 'settings', 'manage', 'Update platform configuration and feature flags.'),
  ('10000000-0000-0000-0000-000000000015', 'Read analytics', 'analytics.read', 'analytics', 'read', 'Read campaign, creator, and platform analytics.'),
  ('10000000-0000-0000-0000-000000000016', 'Apply to campaigns', 'applications.create', 'campaign_applications', 'create', 'Creators apply to campaigns.'),
  ('10000000-0000-0000-0000-000000000017', 'Manage own creator profile', 'creator_profiles.manage_own', 'creator_profiles', 'manage', 'Creators manage their own profiles and portfolios.'),
  ('10000000-0000-0000-0000-000000000018', 'Send messages', 'messages.send', 'messages', 'send', 'Send messages in conversations the user participates in.'),
  ('10000000-0000-0000-0000-000000000019', 'Manage own profile', 'profiles.manage_own', 'profiles', 'manage', 'Users manage their own profile.'),
on conflict (slug) do nothing;

------------------------------------------------------------
-- 3. Role -> permission grants
------------------------------------------------------------

insert into public.role_permissions (role_id, permission_id) values
  -- Platform administrator: all permissions
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000014'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000015'),
  -- Moderator
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000015'),
  -- Brand owner
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000018'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000019'),
  -- Brand member
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000018'),
  ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000019'),
  -- Creator
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000016'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000017'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000018'),
  ('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000019'),
  -- Support agent
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000013'),
  ('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000015'),
on conflict do nothing;

------------------------------------------------------------
-- 4. Brand categories
------------------------------------------------------------

insert into public.brand_categories (id, name, slug, description) values
  ('b0000000-0000-0000-0000-000000000001', 'Fashion & Apparel', 'fashion-apparel', 'Clothing, accessories, and fashion brands.'),
  ('b0000000-0000-0000-0000-000000000002', 'Beauty & Personal Care', 'beauty-personal-care', 'Skincare, makeup, and personal care brands.'),
  ('b0000000-0000-0000-0000-000000000003', 'Technology & Electronics', 'technology-electronics', 'Consumer tech, gadgets, software, and electronics brands.'),
  ('b0000000-0000-0000-0000-000000000004', 'Food & Beverage', 'food-beverage', 'Food, beverage, and hospitality brands.'),
  ('b0000000-0000-0000-0000-000000000005', 'Fitness & Wellness', 'fitness-wellness', 'Fitness, nutrition, and wellness brands.'),
on conflict (slug) do nothing;

------------------------------------------------------------
-- 5. Creator categories & niches
------------------------------------------------------------

insert into public.creator_categories (id, name, slug, description) values
  ('c0000000-0000-0000-0000-000000000001', 'Lifestyle', 'lifestyle', 'Everyday life, vlogs, and personal content.'),
  ('c0000000-0000-0000-0000-000000000002', 'Fashion', 'fashion', 'Outfits, styling, and fashion content.'),
  ('c0000000-0000-0000-0000-000000000003', 'Gaming', 'gaming', 'Video game streaming and gaming content.'),
  ('c0000000-0000-0000-0000-000000000004', 'Tech Reviews', 'tech-reviews', 'Gadget reviews and technology explainers.'),
  ('c0000000-0000-0000-0000-000000000005', 'Food & Cooking', 'food-cooking', 'Recipes, cooking, and food exploration.'),
on conflict (slug) do nothing;

insert into public.creator_niches (id, category_id, name, slug, description) values
  ('n0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Travel', 'travel', 'Travel guides and destination content.'),
  ('n0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Streetwear', 'streetwear', 'Streetwear fashion and sneakers.'),
  ('n0000000-0000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Esports', 'esports', 'Competitive gaming content.'),
  ('n0000000-0000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Smartphones', 'smartphones', 'Smartphone reviews and comparisons.'),
  ('n0000000-0000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Baking', 'baking', 'Baking and pastry content.'),
on conflict (category_id, slug) do nothing;

------------------------------------------------------------
-- 6. Campaign categories & niches
------------------------------------------------------------

insert into public.campaign_categories (id, name, slug, description) values
  ('k0000000-0000-0000-0000-000000000001', 'Brand Awareness', 'brand-awareness', 'Campaigns focused on reach and visibility.'),
  ('k0000000-0000-0000-0000-000000000002', 'Product Launch', 'product-launch', 'Campaigns for launching new products.'),
  ('k0000000-0000-0000-0000-000000000003', 'Performance', 'performance', 'Campaigns focused on conversions and sales.'),
on conflict (slug) do nothing;

------------------------------------------------------------
-- 7. Platform settings & feature flags
------------------------------------------------------------

insert into public.platform_settings (id, setting_key, setting_value, category, is_public) values
  ('s0000000-0000-0000-0000-000000000001', 'platform_commission_rate', '{"rate": 0.15}', 'payments', false),
  ('s0000000-0000-0000-0000-000000000002', 'max_campaign_budget_usd', '{"amount": 1000000}', 'campaigns', false),
  ('s0000000-0000-0000-0000-000000000003', 'supported_payment_providers', '{"providers": ["stripe"]}', 'payments', true),
  ('s0000000-0000-0000-0000-000000000004', 'default_currency', '{"currency": "USD"}', 'payments', true),
on conflict (setting_key) do nothing;

insert into public.feature_flags (id, flag_key, enabled, rollout_percentage, conditions) values
  ('f0000000-0000-0000-0000-000000000001', 'social_api_integration', false, 0, '{"providers": []}'),
  ('f0000000-0000-0000-0000-000000000002', 'creator_discovery_beta', true, 100, '{}'),
  ('f0000000-0000-0000-0000-000000000003', 'in_app_payments', false, 0, '{}'),
on conflict (flag_key) do nothing;

------------------------------------------------------------
-- 8. Sample user-bound data (guarded on auth.users existence)
------------------------------------------------------------

do $$
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  brand_owner_id uuid := '22222222-2222-2222-2222-222222222222';
  brand_member_id uuid := '33333333-3333-3333-3333-333333333333';
  creator_id uuid := '44444444-4444-4444-4444-444444444444';
  creator2_id uuid := '55555555-5555-5555-5555-555555555555';
  brand_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  campaign_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
begin
  -- Platform admin profile + role
  if exists (select 1 from auth.users where id = admin_id) then
    insert into public.profiles (id, auth_user_id, full_name, headline, bio, is_public)
    values (admin_id, admin_id, 'Platform Admin', 'CALLBACX TECHNOLOGY Platform Administrator', 'Platform administration account.', true)
    on conflict (id) do nothing;
    insert into public.profile_private (profile_id) values (admin_id) on conflict (profile_id) do nothing;
    insert into public.user_preferences (profile_id) values (admin_id) on conflict (profile_id) do nothing;
    insert into public.profile_user_roles (profile_id, role_id, assigned_by)
    select admin_id, '00000000-0000-0000-0000-000000000001', admin_id
    where not exists (select 1 from public.profile_user_roles where profile_id = admin_id);
  end if;

  -- Brand owner
  if exists (select 1 from auth.users where id = brand_owner_id) then
    insert into public.profiles (id, auth_user_id, full_name, headline, bio, location, is_public)
    values (brand_owner_id, brand_owner_id, 'Alex Rivera', 'Founder, Terra Threads', 'Sustainable apparel brand founder.', 'Austin, TX, US', true)
    on conflict (id) do nothing;
    insert into public.profile_private (profile_id) values (brand_owner_id) on conflict (profile_id) do nothing;
    insert into public.user_preferences (profile_id) values (brand_owner_id) on conflict (profile_id) do nothing;
    insert into public.profile_user_roles (profile_id, role_id, assigned_by)
    select brand_owner_id, '00000000-0000-0000-0000-000000000003', admin_id
    where not exists (select 1 from public.profile_user_roles where profile_id = brand_owner_id);

    insert into public.brands (id, owner_id, name, legal_name, description, website_url, contact_email, brand_category_id, verification_status, is_active)
    values (brand_id, brand_owner_id, 'Terra Threads', 'Terra Threads Inc.', 'Sustainable streetwear made from recycled materials.', 'https://terrathreads.example', 'hello@terrathreads.example', 'b0000000-0000-0000-0000-000000000001', 'verified', true)
    on conflict (id) do nothing;

    -- Brand owner membership is implied by brands.owner_id (brand_members.role
    -- check forbids 'owner'; see 0003_brands.sql). No membership row needed.

    insert into public.brand_billing_profiles (brand_id, company_name, tax_id, billing_email, address)
    values (brand_id, 'Terra Threads Inc.', 'SEED-TAX-PLACEHOLDER', 'billing@terrathreads.example', '{"city":"Austin","region":"TX","country":"US"}')
    on conflict (brand_id) do nothing;
  end if;

  -- Brand member

    -- Campaign
    insert into public.campaigns (id, brand_id, title, description, brief, category_id, status, objective, budget_total, compensation_model, start_date, end_date, application_deadline, visibility, platform_requirements)
    values (campaign_id, brand_id, 'Summer 2027 Creator Program', 'Partner with creators to promote our summer collection.', 'Looking for lifestyle creators with engaged audiences.', 'k0000000-0000-0000-0000-000000000001', 'published', 'Brand awareness and reach for the summer collection.', 25000.00, 'flat_fee', timezone('utc'::text, now()), (timezone('utc'::text, now()) + interval '90 days'), (timezone('utc'::text, now()) + interval '30 days'), 'public', array['instagram','tiktok'])
    on conflict (id) do nothing;

    insert into public.campaign_deliverables (campaign_id, title, description, deliverable_type, platform, due_date, is_required)
    values (campaign_id, 'Instagram Reel', '30-60s Reel featuring the summer collection.', 'reel', 'instagram', timezone('utc'::text, now()) + interval '60 days', true)
    on conflict (id) do nothing;
  end if;

  -- Brand member
  if exists (select 1 from auth.users where id = brand_member_id) then
    insert into public.profiles (id, auth_user_id, full_name, headline, is_public)
    values (brand_member_id, brand_member_id, 'Sam Chen', 'Brand Manager, Terra Threads', true)
    on conflict (id) do nothing;
    insert into public.user_preferences (profile_id) values (brand_member_id) on conflict (profile_id) do nothing;
    insert into public.profile_user_roles (profile_id, role_id, assigned_by)
    select brand_member_id, '00000000-0000-0000-0000-000000000005', brand_owner_id
    where not exists (select 1 from public.profile_user_roles where profile_id = brand_member_id);
    insert into public.brand_members (brand_id, profile_id, role, invited_by)
    values (brand_id, brand_member_id, 'admin', brand_owner_id)
    on conflict (brand_id, profile_id) do nothing;
  end if;

  -- Creator 1
  if exists (select 1 from auth.users where id = creator_id) then
    insert into public.profiles (id, auth_user_id, full_name, headline, bio, location, is_public)
    values (creator_id, creator_id, 'Jamie Ortiz', 'Lifestyle Creator', 'Sharing travel, style, and everyday inspiration.', 'Portland, OR, US', true)
    on conflict (id) do nothing;
    insert into public.profile_private (profile_id) values (creator_id) on conflict (profile_id) do nothing;
    insert into public.user_preferences (profile_id) values (creator_id) on conflict (profile_id) do nothing;
    insert into public.profile_user_roles (profile_id, role_id, assigned_by)
    select creator_id, '00000000-0000-0000-0000-000000000006', admin_id
    where not exists (select 1 from public.profile_user_roles where profile_id = creator_id);

    insert into public.creator_profiles (id, profile_id, display_name, bio, location, languages, contact_email, availability_status, verification_status)
    values (creator_id, creator_id, 'Jamie Ortiz', 'Lifestyle creator focused on travel and streetwear.', '{"city":"Portland","region":"OR","country":"US"}', array['en','es'], 'jamie@example.com', 'open', 'verified')
    on conflict (id) do nothing;

    insert into public.creator_profile_categories (creator_profile_id, creator_category_id) values (creator_id, 'c0000000-0000-0000-0000-000000000001'), (creator_id, 'c0000000-0000-0000-0000-000000000002') on conflict do nothing;
    insert into public.creator_profile_niches (creator_profile_id, creator_niche_id) values (creator_id, 'n0000000-0000-0000-0000-000000000001'), (creator_id, 'n0000000-0000-0000-0000-000000000002') on conflict do nothing;

    insert into public.creator_social_accounts (creator_profile_id, platform, username, profile_url, followers_count, engagement_rate, metrics_source)
    values (creator_id, 'instagram', 'jamieortiz', 'https://instagram.com/jamieortiz', 42000, 3.45, 'manual')
    on conflict (creator_profile_id, platform, username) do nothing;

    insert into public.creator_rates (creator_profile_id, service_type, min_rate, max_rate, currency)
    values (creator_id, 'sponsored_post', 500.00, 1500.00, 'USD')
    on conflict (id) do nothing;

    -- Application to the sample campaign
    insert into public.campaign_applications (campaign_id, creator_profile_id, cover_letter, proposed_rate, status)
    values (campaign_id, creator_id, 'I would love to collaborate on your summer collection.', 1200.00, 'pending')
    on conflict (campaign_id, creator_profile_id) do nothing;
  end if;

  -- Creator 2
  if exists (select 1 from auth.users where id = creator2_id) then
    insert into public.profiles (id, auth_user_id, full_name, headline, is_public)
    values (creator2_id, creator2_id, 'Riley Torres', 'Gaming Creator', true)
    on conflict (id) do nothing;
    insert into public.profile_private (profile_id) values (creator2_id) on conflict (profile_id) do nothing;
    insert into public.user_preferences (profile_id) values (creator2_id) on conflict (profile_id) do nothing;
    insert into public.profile_user_roles (profile_id, role_id, assigned_by)
    select creator2_id, '00000000-0000-0000-0000-000000000006', admin_id
    where not exists (select 1 from public.profile_user_roles where profile_id = creator2_id);

    insert into public.creator_profiles (id, profile_id, display_name, bio, languages, availability_status)
    values (creator2_id, creator2_id, 'Riley Torres', 'Esports and gaming content creator.', array['en'], 'open', 'pending')
    on conflict (id) do nothing;
  end if;
end;
$$;

------------------------------------------------------------
-- End of seed
------------------------------------------------------------


