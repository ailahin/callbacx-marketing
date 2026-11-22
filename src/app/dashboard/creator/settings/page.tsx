"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input"
import { Select } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Creator Settings Page Component
// ---------------------------------------------------------------------------

export default function CreatorSettingsPage() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = React.useState<"profile" | "notifications" | "privacy" | "security" | "connected" | "billing">("profile");
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    website: "",
    contact_email: "",
    languages: "en",
    availability_status: "open",
    min_budget: 500,
    preferred_platforms: ["instagram", "tiktok"],
    content_types: ["reels", "stories", "posts", "videos"],
  });
  const [notifications, setNotifications] = React.useState({
    email_campaign_invites: true,
    email_application_updates: true,
    email_collaboration_updates: true,
    email_messages: true,
    email_payouts: true,
    email_marketing: false,
    push_campaign_invites: true,
    push_application_updates: true,
    push_messages: true,
    push_collaboration_updates: true,
  });
  const [privacy, setPrivacy] = React.useState({
    profile_visibility: "public",
    show_earnings: false,
    show_collaborations: true,
    show_social_links: true,
    allow_brand_invites: true,
    data_processing_consent: true,
  });

  React.useEffect(() => {
    if (authLoading) return;
    if (user && isDemoMode && demoData.creatorProfile) {
      const profile = demoData.creatorProfile;
      setFormData({
        full_name: profile.display_name,
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location ? `${profile.location.city}, ${profile.location.state}, ${profile.location.country}` : "",
        website: profile.website_url || "",
        contact_email: profile.contact_email || "",
        languages: profile.languages.join(", "),
        availability_status: profile.availability_status || "open",
        min_budget: profile.collaboration_preferences?.min_budget || 500,
        preferred_platforms: profile.collaboration_preferences?.preferred_platforms || ["instagram", "tiktok"],
        content_types: profile.collaboration_preferences?.content_types || ["reels", "stories", "posts", "videos"],
      });
    }
  }, [authLoading, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isDemoMode) {
        // In demo mode, just simulate save
        await new Promise(r => setTimeout(r, 500));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        await updateProfile({
          full_name: formData.full_name,
          headline: formData.headline,
          // avatar_url would be handled separately
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
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
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Settings"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to access settings.</p>
          <Button asChild>
            <a href="/dashboard/creator/profile">Create Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
    { id: "notifications", label: "Notifications", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    )},
    { id: "privacy", label: "Privacy", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    )},
    { id: "security", label: "Security", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: "connected", label: "Connected Accounts", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
    )},
    { id: "billing", label: "Billing & Tax", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
    )},
  ];

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Settings"
      description="Manage your account settings and preferences"
      user={user}
    >
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="bg-surface rounded-xl border border-border-subtle p-2" aria-label="Settings sections">
            <ul className="space-y-1" role="list">
              {tabs.map(tab => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      activeTab === tab.id
                        ? "bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400"
                        : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab formData={formData} setFormData={setFormData} onSave={handleSaveProfile} saving={saving} saveSuccess={saveSuccess} user={user} />}
          {activeTab === "notifications" && <NotificationsTab notifications={notifications} onChange={handleNotificationChange} />}
          {activeTab === "privacy" && <PrivacyTab privacy={privacy} onChange={handlePrivacyChange} />}
          {activeTab === "security" && <SecurityTab user={user} />}
          {activeTab === "connected" && <ConnectedAccountsTab />}
          {activeTab === "billing" && <BillingTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

function ProfileTab({ formData, setFormData, onSave, saving, saveSuccess, user }: any) {
  return (
    <Card variant="outlined">
      <form onSubmit={onSave} className="p-6 space-y-6">
        <div className="flex items-center gap-6">
          <Avatar size="xl" className="flex-shrink-0">
            <AvatarFallback>{user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AC"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">Profile Photo</h3>
            <p className="text-sm text-text-secondary">JPG, PNG or GIF. Max 5MB.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2">Change Photo</Button>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Display Name *</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Headline</label>
            <Input
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              placeholder="Lifestyle & Tech Content Creator"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            placeholder="Tell brands about yourself, your niche, and what makes your content unique..."
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Los Angeles, CA, US"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Contact Email</label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Languages</label>
            <Input
              value={formData.languages}
              onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
              placeholder="en, es, fr (comma separated)"
            />
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6">
          <h4 className="text-lg font-semibold mb-4">Collaboration Preferences</h4>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Availability</label>
              <Select
                value={formData.availability_status}
                onChange={(e) => setFormData(prev => ({ ...prev, availability_status: e.target.value }))}
                options={[
                  { value: "open", label: "Open to collaborations" },
                  { value: "busy", label: "Currently busy" },
                  { value: "selective", label: "Selective only" },
                  { value: "unavailable", label: "Not accepting" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Minimum Budget (USD)</label>
              <Input
                type="number"
                value={formData.min_budget}
                onChange={(e) => setFormData(prev => ({ ...prev, min_budget: parseInt(e.target.value) || 0 }))}
                min={0}
                step={100}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Preferred Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["instagram", "tiktok", "youtube", "pinterest", "twitter", "linkedin", "twitch"].map(p => (
                <label key={p} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preferred_platforms.includes(p)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferred_platforms: e.target.checked
                        ? [...prev.preferred_platforms, p]
                        : prev.preferred_platforms.filter((x: string) => x !== p)
                    }))}
                    className="rounded border-border"
                  />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Content Types</label>
            <div className="flex flex-wrap gap-2">
              {["reels", "stories", "posts", "videos", "shorts", "live", "carousel"].map(c => (
                <label key={c} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.content_types.includes(c)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content_types: e.target.checked
                        ? [...prev.content_types, c]
                        : prev.content_types.filter((x: string) => x !== c)
                    }))}
                    className="rounded border-border"
                  />
                  <span className="capitalize">{c}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6 flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>Reset</Button>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-sm">
            Profile saved successfully!
          </div>
        )}
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

function NotificationsTab({ notifications, onChange }: any) {
  const sections = [
    {
      title: "Email Notifications",
      items: [
        { key: "email_campaign_invites", label: "New campaign invitations", description: "When brands invite you to campaigns" },
        { key: "email_application_updates", label: "Application status updates", description: "When your application is reviewed" },
        { key: "email_collaboration_updates", label: "Collaboration updates", description: "Milestones, deliverables, and deadlines" },
        { key: "email_messages", label: "New messages", description: "When you receive a message from a brand" },
        { key: "email_payouts", label: "Payout notifications", description: "When a payout is processed or completed" },
        { key: "email_marketing", label: "Marketing emails", description: "Product updates, tips, and platform news" },
      ]
    },
    {
      title: "Push Notifications",
      items: [
        { key: "push_campaign_invites", label: "Campaign invitations", description: "Real-time alerts for new invitations" },
        { key: "push_application_updates", label: "Application updates", description: "Instant status change notifications" },
        { key: "push_messages", label: "Messages", description: "Get notified of new messages instantly" },
        { key: "push_collaboration_updates", label: "Collaboration updates", description: "Important deadline and milestone alerts" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <Card key={section.title} variant="outlined">
          <CardHeader>
            <h3 className="text-lg font-semibold">{section.title}</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                <div>
                  <p className="font-medium text-text-primary">{item.label}</p>
                  <p className="text-sm text-text-tertiary">{item.description}</p>
                </div>
                <Toggle
                  checked={notifications[item.key]}
                  onChange={(checked) => onChange(item.key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Privacy Tab
// ---------------------------------------------------------------------------

function PrivacyTab({ privacy, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Profile Visibility</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Who can see your profile?</label>
            <Select
              value={privacy.profile_visibility}
              onChange={(e) => onChange("profile_visibility", e.target.value)}
              options={[
                { value: "public", label: "Public - Anyone can find and view your profile" },
                { value: "brands_only", label: "Brands only - Only verified brands can view your profile" },
                { value: "invite_only", label: "Invite only - Only brands you've worked with or invited you" },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.show_earnings}
                onChange={(e) => onChange("show_earnings", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Show earnings on public profile</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.show_collaborations}
                onChange={(e) => onChange("show_collaborations", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Show past collaborations</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.show_social_links}
                onChange={(e) => onChange("show_social_links", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Show social media links</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.allow_brand_invites}
                onChange={(e) => onChange("allow_brand_invites", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Allow brands to invite you to campaigns</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Data & Consent</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.data_processing_consent}
              onChange={(e) => onChange("data_processing_consent", e.target.checked)}
              className="rounded border-border"
            />
            <div>
              <p className="font-medium text-text-primary">Data Processing Consent</p>
              <p className="text-sm text-text-tertiary">I agree to the processing of my personal data as described in the Privacy Policy.</p>
            </div>
          </label>
          <div className="flex gap-3 pt-4 border-t border-border-subtle">
            <Button variant="outline" asChild>
              <a href="/privacy" target="_blank" rel="noopener noreferrer">View Privacy Policy</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/terms" target="_blank" rel="noopener noreferrer">View Terms of Service</a>
            </Button>
            <Button variant="outline" className="text-error-600 dark:text-error-400 border-error-200 dark:border-error-800 hover:bg-error-50 dark:hover:bg-error-900/20">
              Request Data Deletion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security Tab
// ---------------------------------------------------------------------------

function SecurityTab({ user }: any) {
  return (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Password</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-secondary">Last changed: {isDemoMode ? "Demo mode" : "Never"}</p>
          <div className="flex gap-3">
            <Button variant="primary" asChild>
              <a href="/settings/password">Change Password</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/settings/password">Enable 2FA</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Active Sessions</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12a6 6 0 01-6 6H6a6 6 0 01-6-6V6a6 6 0 016-6h6a6 6 0 016 6v12z" /></svg>
                </div>
                <div>
                  <p className="font-medium text-text-primary">Current Session</p>
                  <p className="text-sm text-text-tertiary">Chrome on Windows • Active now</p>
                </div>
              </div>
              <Badge variant="success" size="sm">Current</Badge>
            </div>
            <p className="text-sm text-text-tertiary">No other active sessions</p>
          </div>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Danger Zone</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 border border-error-200 dark:border-error-800 rounded-lg bg-error-50 dark:bg-error-900/20">
            <div>
              <p className="font-medium text-error-700 dark:text-error-400">Delete Account</p>
              <p className="text-sm text-error-600 dark:text-error-500">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <Button variant="ghost" className="text-error-600 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-900/30">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connected Accounts Tab
// ---------------------------------------------------------------------------

function ConnectedAccountsTab() {
  const socialAccounts = demoData.creatorSocialAccounts || [];

  return (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Social Accounts</h3>
          <Button variant="outline" size="sm">Connect Account</Button>
        </CardHeader>
        <CardContent>
          {socialAccounts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 mx-auto mb-4 text-text-tertiary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <p className="text-text-secondary mb-4">No social accounts connected</p>
              <Button variant="primary">Connect Your First Account</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {socialAccounts.map(account => (
                <div key={account.id} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: SOCIAL_COLORS[account.platform] || "#6366f1" }}>
                    {account.platform.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary capitalize">{account.platform}</span>
                      {account.is_verified && <Badge variant="success" size="xs">Verified</Badge>}
                    </div>
                    <p className="text-sm text-text-tertiary">@{account.username} • {formatNumber(account.followers_count)} followers • {account.engagement_rate}% engagement</p>
                    <p className="text-xs text-text-tertiary mt-1">Last synced: {formatDate(account.last_synced_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Refresh</Button>
                    <Button variant="ghost" size="sm" className="text-error-600 dark:text-error-400">Disconnect</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Third-Party Integrations</h3>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Google Analytics", description: "Track website traffic from campaigns", connected: false },
              { name: "Shopify", description: "Track sales from affiliate links", connected: false },
              { name: "Linktree", description: "Manage your bio links", connected: false },
              { name: "Calendly", description: "Schedule brand meetings", connected: false },
              { name: "Notion", description: "Organize campaign content", connected: false },
              { name: "Canva", description: "Create campaign assets", connected: false },
            ].map(integration => (
              <div key={integration.name} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{integration.name}</p>
                  <p className="text-sm text-text-tertiary">{integration.description}</p>
                </div>
                <Button variant={integration.connected ? "secondary" : "primary"} size="sm">
                  {integration.connected ? "Connected" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SOCIAL_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  twitch: "#9146FF",
  facebook: "#1877F2",
};

// ---------------------------------------------------------------------------
// Billing Tab
// ---------------------------------------------------------------------------

function BillingTab() {
  return (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Tax Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Tax Form Status</p>
                <p className="text-sm text-text-tertiary">Required for payouts over $600/year (US creators)</p>
              </div>
              <Badge variant="warning">Incomplete</Badge>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Legal Name</label>
              <Input placeholder="As shown on tax documents" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tax ID Type</label>
              <Select
                value="ssn"
                onChange={() => {}}
                options={[
                  { value: "ssn", label: "SSN (Individual)" },
                  { value: "ein", label: "EIN (Business)" },
                  { value: "foreign", label: "Foreign Tax ID" },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">Tax ID Number</label>
              <Input placeholder="XXX-XX-XXXX" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
              <Input placeholder="Street address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
              <Input placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">State/Province</label>
              <Input placeholder="State" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">ZIP/Postal Code</label>
              <Input placeholder="ZIP code" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Country</label>
              <Select
                value="US"
                onChange={() => {}}
                options={[
                  { value: "US", label: "United States" },
                  { value: "CA", label: "Canada" },
                  { value: "UK", label: "United Kingdom" },
                  { value: "AU", label: "Australia" },
                ]}
              />
            </div>
          </div>
          <Button variant="primary">Save Tax Information</Button>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Payout Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Default Payout Currency</label>
            <Select
              value="USD"
              onChange={() => {}}
              options={[
                { value: "USD", label: "USD - US Dollar" },
                { value: "EUR", label: "EUR - Euro" },
                { value: "GBP", label: "GBP - British Pound" },
                { value: "CAD", label: "CAD - Canadian Dollar" },
                { value: "AUD", label: "AUD - Australian Dollar" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Minimum Payout Threshold</label>
            <Select
              value="50"
              onChange={() => {}}
              options={[
                { value: "25", label: "$25" },
                { value: "50", label: "$50" },
                { value: "100", label: "$100" },
                { value: "500", label: "$500" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Payout Schedule</label>
            <Select
              value="weekly"
              onChange={() => {}}
              options={[
                { value: "weekly", label: "Weekly (every Friday)" },
                { value: "biweekly", label: "Bi-weekly" },
                { value: "monthly", label: "Monthly (1st of month)" },
              ]}
            />
          </div>
          <Button variant="primary">Save Payout Settings</Button>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Billing History</h3>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">Platform fees are automatically deducted from brand payments before payouts.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-text-tertiary border-b border-border-subtle">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Description</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                  <th className="p-3 font-medium text-right">Fee</th>
                  <th className="p-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {demoData.creatorPayouts?.slice(0, 5).map((payout, index) => {
                  const tx = demoData.paymentTransactions?.find(t => t.id === payout.payment_transaction_id);
                  return (
                    <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-3 text-sm text-text-tertiary">{formatDate(payout.paid_at || payout.created_at)}</td>
                      <td className="p-3 text-sm text-text-secondary">Platform fee - {payout.currency} {formatCurrency(payout.amount)}</td>
                      <td className="p-3 text-sm text-right text-text-primary">{formatCurrency(tx?.amount || 0)} {tx?.currency}</td>
                      <td className="p-3 text-sm text-right text-warning-600 dark:text-warning-400">-{formatCurrency(tx?.fee_amount || 0)} {tx?.currency}</td>
                      <td className="p-3 text-sm text-right font-medium text-success-600 dark:text-success-400">{formatCurrency(payout.amount)} {payout.currency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}