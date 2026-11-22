"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoDataState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatDate, formatRelativeTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Brand Conversations Page Component
// ---------------------------------------------------------------------------

export default function BrandConversationsPage() {
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
          const brandCollabs = demoData.collaborations.filter(c => c.brand_id === user?.brand_id);
          const enriched = demoData.conversations
            .filter(conv => brandCollabs.some(c => c.id === conv.id || c.creator_profile_id === conv.id))
            .map(conv => {
              const collab = brandCollabs.find(c => c.id === conv.id);
              const creator = demoData.creatorProfiles.find(c => c.id === collab?.creator_profile_id);
              const convMessages = demoData.messages.filter(m => m.conversation_id === conv.id);
              const unreadCount = convMessages.filter(m => m.sender_id !== user?.id && new Date(m.created_at) > new Date(Date.now() - 86400000)).length;
              
              return {
                ...conv,
                creator,
                collab,
                lastMessage: convMessages[convMessages.length - 1],
                unreadCount,
                messages: convMessages,
              };
            })
            .sort((a, b) => new Date(b.lastMessage?.created_at || b.created_at).getTime() - new Date(a.lastMessage?.created_at || a.created_at).getTime());
          
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
  }, [authLoading, user?.brand_id]);

  const handleSelectConversation = (conv: any) => {
    setSelectedConversation(conv);
    setMessages(conv.messages || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    setSending(true);
    try {
      // In demo mode, add to local state
      const message = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: selectedConversation.id,
        sender_id: user?.id,
        body: newMessage,
        message_type: "text" as const,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, message]);
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, lastMessage: message, unreadCount: 0 }
          : c
      ));
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
        navSections={BRAND_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="h-[calc(100vh-200px)] flex items-center justify-center">
          <SkeletonCard showImage={false} showAvatar={false} lines={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.brand_id) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Conversations"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Conversations"
      description="Manage messages with creators"
      user={user}
    >
      <div className="h-[calc(100vh-200px)] flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-full lg:w-96 flex-shrink-0 border-r border-border-subtle bg-surface flex flex-col">
          <div className="p-4 border-b border-border-subtle">
            <Input
              placeholder="Search conversations..."
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <SkeletonCard key={i} showImage={false} showAvatar={true} lines={2} />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <NoDataState
                  title="No conversations yet"
                  description="Start collaborating with creators to begin messaging."
                  illustration="connection"
                />
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "w-full p-4 text-left flex items-start gap-3 hover:bg-surface-hover transition-colors",
                      selectedConversation?.id === conv.id && "bg-brand-50 dark:bg-brand-950/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium flex-shrink-0">
                      {conv.creator?.avatar_url ? (
                        <img src={conv.creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        conv.creator?.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-text-primary truncate">{conv.creator?.display_name}</h4>
                        {conv.unreadCount > 0 && (
                          <Badge size="xs" variant="primary">{conv.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-0.5">{conv.lastMessage?.body || "No messages yet"}</p>
                      <p className="text-xs text-text-tertiary mt-1">{conv.lastMessage ? formatRelativeTime(conv.lastMessage.created_at) : formatRelativeTime(conv.created_at)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-border-subtle flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium">
                  {selectedConversation.creator?.avatar_url ? (
                    <img src={selectedConversation.creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedConversation.creator?.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{selectedConversation.creator?.display_name}</h3>
                  <p className="text-sm text-text-secondary">{selectedConversation.collab?.campaign?.title || "General Discussion"}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={React.useRef<HTMLDivElement>((el) => { if (el) el.scrollIntoView(); })} />
              </div>
              
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border-subtle bg-surface/50 backdrop-blur-sm">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} loading={sending}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-tertiary">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h3 className="mt-4 text-lg font-medium text-text-primary">Select a conversation</h3>
                <p className="mt-1 text-text-secondary">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble Component
// ---------------------------------------------------------------------------

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-medium flex-shrink-0">
          {message.sender_id === "demo-brand-1" ? "B" : "C"}
        </div>
      )}
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2",
        isOwn 
          ? "bg-brand-600 text-white rounded-tr-sm" 
          : "bg-neutral-100 dark:bg-neutral-800 text-text-primary rounded-tl-sm"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <p className={cn("text-xs mt-1", isOwn ? "text-brand-100" : "text-text-tertiary")}>
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
      {isOwn && (
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-medium flex-shrink-0">
          B
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}