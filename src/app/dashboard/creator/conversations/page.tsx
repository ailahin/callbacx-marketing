"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoResultsState } from "@/components/states/Empty";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatDate, formatRelativeTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Creator Conversations Page Component
// ---------------------------------------------------------------------------

export default function CreatorConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [selectedConversation, setSelectedConversation] = React.useState<any | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    async function fetchConversations() {
      if (authLoading) return;

      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfile;
          const creatorCollaborations = demoData.collaborations.filter(c => c.creator_profile_id === creatorProfile.id);
          const collabIds = creatorCollaborations.map(c => c.id);

          // Get conversations related to creator's collaborations
          let filtered = demoData.conversations.filter(conv => {
            // In demo, we link conversations to collaborations via the demo data
            return demoData.messages.some(m => m.conversation_id === conv.id);
          });

          // Enrich with last message and unread count
          const enriched = filtered.map(conv => {
            const convMessages = demoData.messages
              .filter(m => m.conversation_id === conv.id)
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            const lastMessage = convMessages[convMessages.length - 1] || null;
            const unreadCount = convMessages.filter(m => m.sender_id !== creatorProfile.profile_id).length;

            // Find related collaboration and campaign
            const collab = creatorCollaborations.find(c => 
              conv.title.toLowerCase().includes(c.campaign_id.replace("demo-campaign-", "")) ||
              conv.id === `demo-conv-${c.campaign_id.replace("demo-campaign-", "")}`
            );
            const campaign = collab ? demoData.campaigns.find(c => c.id === collab.campaign_id) : null;

            return {
              ...conv,
              lastMessage,
              unreadCount,
              campaign,
              collab,
            };
          });

          enriched.sort((a, b) => 
            (b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0) - 
            (a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0)
          );

          setConversations(enriched);
        } else {
          setConversations([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [authLoading, user?.id]);

  const handleSelectConversation = (conv: any) => {
    setSelectedConversation(conv);
    const convMessages = demoData.messages
      .filter(m => m.conversation_id === conv.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(convMessages);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      // In production, would call API to send message
      // For demo, just add to local state
      const newMsg = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: selectedConversation.id,
        sender_id: user?.id,
        body: newMessage.trim(),
        message_type: "text" as const,
        created_at: new Date().toISOString(),
        __demo: true,
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Messages"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to access conversations.</p>
          <Button asChild>
            <a href="/dashboard/creator/profile">Create Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Messages"
      description="Communicate with brands and manage conversations"
      user={user}
    >
      <div className="h-[calc(100vh-14rem)] flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-full lg:w-96 flex-shrink-0 border-r border-border-subtle flex flex-col">
          <div className="p-4 border-b border-border-subtle">
            <Input
              placeholder="Search conversations..."
              value=""
              onChange={() => {}}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded mt-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  }
                  title="No conversations yet"
                  description="Start collaborating with brands to begin conversations."
                  action={{
                    label: "Browse Campaigns",
                    onClick: () => window.location.href = "/dashboard/creator/campaigns",
                    variant: "primary"
                  }}
                />
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "w-full p-4 text-left transition-colors",
                      "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      selectedConversation?.id === conv.id
                        ? "bg-brand-50 dark:bg-brand-950/50 border-r-2 border-brand-600"
                        : ""
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
                        {conv.campaign?.title?.charAt(0) || "💬"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-text-primary truncate pr-2">
                            {conv.campaign?.title || conv.title}
                          </h4>
                          {conv.lastMessage && (
                            <span className="text-xs text-text-tertiary whitespace-nowrap">
                              {formatRelativeTime(conv.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary truncate mt-0.5">
                          {conv.campaign?.brand?.name || "Brand"}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-sm text-text-tertiary truncate mt-1 flex items-center gap-2">
                            {conv.lastMessage.sender_id === user?.id ? (
                              <span className="text-xs text-brand-600 dark:text-brand-400">You:</span>
                            ) : (
                              <>
                                {conv.unreadCount > 0 && (
                                  <Badge size="xs" variant="primary">{conv.unreadCount}</Badge>
                                )}
                                <span>Brand:</span>
                              </>
                            )}
                            {conv.lastMessage.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-border-subtle flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg">
                  {selectedConversation.campaign?.title?.charAt(0) || "💬"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">
                    {selectedConversation.campaign?.title || selectedConversation.title}
                  </h3>
                  <p className="text-sm text-text-secondary truncate">
                    {selectedConversation.campaign?.brand?.name || "Brand"}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-text-tertiary">
                    <svg className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
                  ))
                )}
              </div>

              <div className="p-4 border-t border-border-subtle">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    rows={1}
                    maxRows={4}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending} size="lg">
                    {sending ? (
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="h-16 w-16 mx-auto mb-4 text-text-tertiary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h3 className="text-lg font-medium text-text-secondary mb-1">Select a conversation</h3>
                <p className="text-text-tertiary">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const messagesEndRef = React.useRef<HTMLDivElement>(null);

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
        style={isOwn 
          ? { background: "var(--color-brand-100)", color: "var(--color-brand-600)" }
          : { background: "var(--color-neutral-200)", color: "var(--color-text-secondary)" }
        }
      >
        {isOwn ? "You" : "B"}
      </div>
      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        <div className={cn(
          "px-4 py-2 rounded-2xl",
          isOwn
            ? "bg-brand-600 text-white rounded-tr-sm"
            : "bg-neutral-100 dark:bg-neutral-800 text-text-primary rounded-tl-sm"
        )}>
          <p className="whitespace-pre-wrap">{message.body}</p>
        </div>
        <span className={cn("text-xs mt-1 px-1", isOwn ? "text-brand-400" : "text-text-tertiary")}>
          {formatRelativeTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}