-- Migration 0016: Creator discovery, favorites, collections, audience demographics
--
-- Discovery tables let brands save creators to favourites/collections and store
-- verified audience demographics for filtering. Metrics are never fabricated --
-- every value is either manually claimed or synced from an official provider API,
-- and the `is_verified` / `metrics_source` flags always let consumers distinguish
-- verified data from self-reported information.

------------------------------------------------------------
-- creator_favorites (brands save creators they like)
------------------------------------------------------------

create table public.creator_favorites (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_favorites_pkey primary key (id),
  constraint creator_favorites_profile_creator_key unique (profile_id, creator_profile_id)
);

create index idx_creator_favorites_profile on public.creator_favorites(profile_id);
create index idx_creator_favorites_creator on public.creator_favorites(creator_profile_id);

------------------------------------------------------------
-- creator_collections (named, optionally public collections)
------------------------------------------------------------

create table public.creator_collections (
  id uuid not null default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_collections_pkey primary key (id),
  constraint creator_collections_owner_slug_key unique (owner_profile_id, slug)
);

create index idx_creator_collections_owner on public.creator_collections(owner_profile_id);
create index idx_creator_collections_slug on public.creator_collections(slug);
create index idx_creator_collections_public on public.creator_collections(is_public) where is_public = true;

------------------------------------------------------------
-- creator_collection_items (creators inside a collection)
------------------------------------------------------------

create table public.creator_collection_items (
  id uuid not null default gen_random_uuid(),
  collection_id uuid not null references public.creator_collections(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_collection_items_pkey primary key (id),
  constraint creator_collection_items_collection_creator_key unique (collection_id, creator_profile_id)
);

create index idx_creator_collection_items_collection on public.creator_collection_items(collection_id);
create index idx_creator_collection_items_creator on public.creator_collection_items(creator_profile_id);

------------------------------------------------------------
-- creator_audience_demographics (verified audience data)
--
-- Columns are JSONB so the shape can evolve (age buckets, gender split,
-- top locations, top languages, interests) without migrations. `source`
-- records whether the data was manually claimed or synced from a platform API.
-- `is_verified` lets consumers tell verified data apart from self-reported.
------------------------------------------------------------

create table public.creator_audience_demographics (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  age_range jsonb default '{}'::jsonb,       -- e.g. {"18-24": 25, "25-34": 40, ...}
  gender jsonb default '{}'::jsonb,          -- e.g. {"female": 55, "male": 40, "other": 5}
  top_locations jsonb default '{}'::jsonb,   -- e.g. [{"country":"US","city":"Portland","share": 40}]
  top_languages jsonb default '{}'::jsonb,   -- e.g. {"en": 80, "es": 20}
  interests jsonb default '{}'::jsonb,       -- e.g. {"travel": 0.6, "fashion": 0.3}
  source text not null default 'manual',     -- manual | platform_api
  is_verified boolean not null default false,
  last_updated timestamptz not null default timezone('utc'::text, now()),
  constraint creator_audience_demographics_pkey primary key (id),
  constraint creator_audience_demographics_creator_key unique (creator_profile_id),
  constraint creator_audience_demographics_source_check check (
    source in ('manual', 'platform_api')
  )
);

create index idx_creator_audience_demographics_creator on public.creator_audience_demographics(creator_profile_id);
create index idx_creator_audience_demographics_verified on public.creator_audience_demographics(is_verified) where is_verified = true;

------------------------------------------------------------
-- RLS policies
------------------------------------------------------------

alter table public.creator_favorites enable row level security;
create policy "creator_favorites_read_owner" on public.creator_favorites
  for select using (auth.uid() = profile_id or public.is_staff(auth.uid()));
create policy "creator_favorites_insert_owner" on public.creator_favorites
  for insert with check (auth.uid() = profile_id);
create policy "creator_favorites_delete_owner" on public.creator_favorites
  for delete using (auth.uid() = profile_id or public.is_staff(auth.uid()));

alter table public.creator_collections enable row level security;
create policy "creator_collections_read" on public.creator_collections
  for select using (
    is_public = true
    or auth.uid() = owner_profile_id
    or public.is_staff(auth.uid())
  );
create policy "creator_collections_insert_owner" on public.creator_collections
  for insert with check (auth.uid() = owner_profile_id);
create policy "creator_collections_update_owner" on public.creator_collections
  for update using (auth.uid() = owner_profile_id or public.is_staff(auth.uid()))
  with check (auth.uid() = owner_profile_id or public.is_staff(auth.uid()));
create policy "creator_collections_delete_owner" on public.creator_collections
  for delete using (auth.uid() = owner_profile_id or public.is_staff(auth.uid()));

alter table public.creator_collection_items enable row level security;
create policy "creator_collection_items_read" on public.creator_collection_items
  for select using (
    exists (
      select 1 from public.creator_collections c
      where c.id = collection_id
        and (c.is_public = true or c.owner_profile_id = auth.uid() or public.is_staff(auth.uid()))
    )
  );
create policy "creator_collection_items_insert_owner" on public.creator_collection_items
  for insert with check (
    exists (
      select 1 from public.creator_collections c
      where c.id = collection_id and c.owner_profile_id = auth.uid()
    )
    or public.is_staff(auth.uid())
  );
create policy "creator_collection_items_delete_owner" on public.creator_collection_items
  for delete using (
    exists (
      select 1 from public.creator_collections c
      where c.id = collection_id and c.owner_profile_id = auth.uid()
    )
    or public.is_staff(auth.uid())
  );

alter table public.creator_audience_demographics enable row level security;
create policy "creator_audience_demographics_read" on public.creator_audience_demographics
  for select using (true);
create policy "creator_audience_demographics_write_owner" on public.creator_audience_demographics
  for all using (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  )
  with check (
    public.is_creator_profile_owner(creator_profile_id, auth.uid())
    or public.is_staff(auth.uid())
  );

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.creator_favorites is 'Creators saved to favourites by a brand profile.';
comment on table public.creator_collections is 'Named collections of creators owned by a brand profile.';
comment on table public.creator_collection_items is 'Creators inside a collection.';
comment on table public.creator_audience_demographics is 'Audience demographics for a creator. Never fabricated; source/is_verified flags distinguish verified from self-reported data.';
