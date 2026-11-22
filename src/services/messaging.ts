/**
 * CALLBACX MARKETING — Messaging service
 *
 * Conversations, messages, and attachments. Access is participant-scoped:
 * only conversation participants (and staff) can read/write.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  Conversations,
  Messages,
  ConversationParticipants,
  MessageAttachments,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { ConversationCreateInput, MessageSendInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/**
 * List conversations for the current user (participants only).
 */
export async function listConversations(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<Conversations[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        participants:conversation_participants(
          profile_id,
          left_at,
          profile:profiles(id, full_name, avatar_url, headline)
        )
      `)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a conversation by ID (participants + staff).
 */
export async function getConversation(
  conversationId: string,
  client?: Client
): Promise<ServiceResult<Conversations | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create a conversation and add participants.
 * RLS: conversations_insert (auth.uid() = created_by).
 */
export async function createConversation(
  input: ConversationCreateInput,
  client?: Client
): Promise<ServiceResult<Conversations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: input.type,
        title: input.title ?? null,
        created_by: profileId,
      })
      .select("*")
      .single();

    if (convError) return fail(mapSupabaseError(convError));
    if (!conversation) return fail(Errors.internal("Conversation was not created."));

    const participantIds = Array.from(new Set([profileId, ...input.participant_ids]));

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert(
        participantIds.map((pid) => ({
          conversation_id: conversation.id,
          profile_id: pid,
        }))
      );

    if (partError) return fail(mapSupabaseError(partError));

    return ok(conversation);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * List messages in a conversation (participants only). Paginated, newest first.
 */
export async function listMessages(
  params: {
    conversationId: string;
    limit?: number;
    before?: string;
  },
  client?: Client
): Promise<ServiceResult<Messages[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const participant = await isConversationParticipant(supabase, params.conversationId, profileId);
  if (!participant) {
    return fail(Errors.conversationNotParticipant());
  }

  try {
    let query = supabase
      .from("messages")
      .select("*, sender:profiles(id, full_name, avatar_url)")
      .eq("conversation_id", params.conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(params.limit ?? 50);

    if (params.before) {
      query = query.lt("created_at", params.before);
    }

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Send a message. Sender must be a participant.
 * RLS: messages_insert (is_conversation_participant AND auth.uid() = sender_id).
 */
export async function sendMessage(
  input: MessageSendInput,
  client?: Client
): Promise<ServiceResult<Messages>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const participant = await isConversationParticipant(supabase, input.conversation_id, profileId);
  if (!participant) {
    return fail(Errors.conversationNotParticipant());
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: input.conversation_id,
        sender_id: profileId,
        body: input.body ?? null,
        message_type: input.message_type,
      })
      .select("*, sender:profiles(id, full_name, avatar_url)")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Message was not sent."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Edit a message (sender only).
 */
export async function updateMessage(
  messageId: string,
  body: string,
  client?: Client
): Promise<ServiceResult<Messages>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .update({ body, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", profileId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.messageNotSender());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Soft-delete a message (sender only).
 */
export async function deleteMessage(
  messageId: string,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", profileId);

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

/**
 * List attachments for a message (participants only).
 */
export async function listMessageAttachments(
  messageId: string,
  client?: Client
): Promise<ServiceResult<MessageAttachments[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data: message } = await supabase
    .from("messages")
    .select("conversation_id")
    .eq("id", messageId)
    .maybeSingle();

  if (!message) {
    return fail(Errors.messageNotFound());
  }

  const participant = await isConversationParticipant(supabase, message.conversation_id, profileId);
  if (!participant) {
    return fail(Errors.conversationNotParticipant());
  }

  try {
    const { data, error } = await supabase
      .from("message_attachments")
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
}

async function isConversationParticipant(
  supabase: Client,
  conversationId: string,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_conversation_participant", {
    p_conversation: conversationId,
    p_profile: profileId,
  });
  return data === true;
}


