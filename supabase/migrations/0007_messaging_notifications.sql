-- Migration 0007: Messaging and notifications
-- Participant-based access control; attachments stored privately; preferences per profile.

------------------------------------------------------------
-- conversations
------------------------------------------------------------

create table public.conversations (
  id uuid not null default gen_random_uuid(),
  type public.conversation_type not null default 'direct',
  title text,                                -- only meaningful for group conversations
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint conversations_pkey primary key (id)
);

create index idx_conversations_created_by on public.conversations(created_by);
create index idx_conversations_type on public.conversations(type);

------------------------------------------------------------
-- conversation_participants
------------------------------------------------------------

create table public.conversation_participants (
  id uuid not null default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc'::text, now()),
  left_at timestamptz,                       -- null = still participating
  last_read_at timestamptz,
  is_muted boolean not null default false,
  constraint conversation_participants_pkey primary key (id),
  constraint conversation_participants_conversation_profile_key unique (conversation_id, profile_id)
);

create index idx_conversation_participants_conversation on public.conversation_participants(conversation_id);
create index idx_conversation_participants_profile on public.conversation_participants(profile_id) where left_at is null;
create index idx_conversation_participants_unread on public.conversation_participants(profile_id, last_read_at) where left_at is null;

------------------------------------------------------------
-- messages
------------------------------------------------------------

create table public.messages (
  id uuid not null default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text,
  message_type public.message_type not null default 'text',
  edited_at timestamptz,
  deleted_at timestamptz,                    -- soft delete (tombstone)
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint messages_pkey primary key (id),
  constraint messages_body_or_type check (
    body is not null or message_type <> 'text'
  )
);

create index idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_created_at on public.messages(created_at desc);

------------------------------------------------------------
-- message_attachments
------------------------------------------------------------

create table public.message_attachments (
  id uuid not null default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,                -- private storage (deliverable-submissions-style or messages bucket)
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint message_attachments_pkey primary key (id),
  constraint message_attachments_file_size_check check (file_size > 0)
);

create index idx_message_attachments_message on public.message_attachments(message_id);

------------------------------------------------------------
-- notifications
------------------------------------------------------------

create table public.notifications (
  id uuid not null default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id), -- who triggered the notification (nullable for system)
  type text not null,                        -- e.g. "application.accepted", "deliverable.submitted"
  title text not null,
  body text,
  data jsonb default '{}'::jsonb,            -- deep links, related ids
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint notifications_pkey primary key (id)
);

create index idx_notifications_recipient on public.notifications(recipient_id, created_at desc);
create index idx_notifications_recipient_unread on public.notifications(recipient_id) where read_at is null;
create index idx_notifications_type on public.notifications(type);

------------------------------------------------------------
-- notification_preferences
------------------------------------------------------------

create table public.notification_preferences (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  categories jsonb not null default '{}'::jsonb, -- {campaigns: true, messages: true, payments: true, ...}
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint notification_preferences_pkey primary key (profile_id)
);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.conversation_participants is 'Access control gate: messages readable only via an active participant row.';
comment on table public.notifications is 'Notification feed. read_at marks read/unread status.';
comment on table public.message_attachments is 'Attachments in private storage; access governed by conversation participation.';
