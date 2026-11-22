-- Migration 0001: Extensions, UUID generation, and shared enum types
-- CALLBACX TECHNOLOGY database foundation
--
-- Runs on: public schema
-- Safe to re-run: uses IF NOT EXISTS / CREATE TYPE IF NOT EXISTS equivalents

------------------------------------------------------------
-- Extensions
------------------------------------------------------------

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

------------------------------------------------------------
-- Helper: stable UTC now
------------------------------------------------------------

-- All timestamp columns use timestamptz with UTC default.
-- do not use `now()` without timezone; Supabase Postgres runs in UTC.

------------------------------------------------------------
-- Enum types (public schema)
------------------------------------------------------------

create type public.account_status as enum (
  'active',
  'suspended',
  'banned',
  'deleted'
);

create type public.verification_status as enum (
  'pending',
  'verified',
  'rejected',
  'expired'
);

create type public.campaign_status as enum (
  'draft',
  'pending_approval',
  'published',
  'paused',
  'completed',
  'archived',
  'cancelled'
);

create type public.collaboration_status as enum (
  'negotiating',
  'active',
  'paused',
  'completed',
  'cancelled',
  'disputed'
);

create type public.application_status as enum (
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn'
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked'
);

create type public.deliverable_status as enum (
  'pending',
  'submitted',
  'approved',
  'revision_requested',
  'rejected'
);

create type public.payment_status as enum (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

create type public.invoice_status as enum (
  'draft',
  'sent',
  'paid',
  'overdue',
  'voided'
);

create type public.payout_status as enum (
  'pending',
  'paid',
  'failed',
  'cancelled'
);

create type public.refund_status as enum (
  'pending',
  'approved',
  'rejected',
  'processed'
);

create type public.dispute_status as enum (
  'open',
  'in_review',
  'resolved',
  'closed'
);

create type public.ticket_status as enum (
  'open',
  'pending',
  'resolved',
  'closed'
);

create type public.ticket_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.report_status as enum (
  'pending',
  'reviewed',
  'dismissed',
  'actioned'
);

create type public.conversation_type as enum (
  'direct',
  'group'
);

create type public.message_type as enum (
  'text',
  'file',
  'system'
);

create type public.media_kind as enum (
  'image',
  'video',
  'document'
);

create type public.compensation_model as enum (
  'flat_fee',
  'per_deliverable',
  'performance',
  'negotiable'
);

create type public.campaign_visibility as enum (
  'public',
  'brand_only',
  'invite_only'
);

create type public.membership_role as enum (
  'owner',
  'admin',
  'member',
  'finance',
  'viewer'
);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on extension pgcrypto is 'Cryptographic functions for hashing/encoding (never for storing raw credentials)';
comment on type public.campaign_status is 'Campaign lifecycle states enforced by server-side transition rules';
comment on type public.collaboration_status is 'Collaboration lifecycle states';
comment on type public.payment_status is 'Payment transaction states; succeeded only reachable server-side after provider confirmation';


