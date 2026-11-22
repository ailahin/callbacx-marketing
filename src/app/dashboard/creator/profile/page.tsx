"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Creator Profile Page Component
// ---------------------------------------------------------------------------

export default function CreatorProfilePage() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [socialAccounts, setSocialAccounts] = React.useState<any[]>([]);
  const [portfolios, setPortfolios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [activeTab, setActiveTab] = React.useState<"profile" | "social" | "portfolio" | "rates" | "availability">("profile");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function fetchProfile() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfiles.find(c => c.profile_id === user?.id);
          const creatorSocial = demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === creatorProfile?.id);
          const creatorPortfolios = demoData.creatorPortfolios.filter(p => p.creator_profile_id === creatorProfile?.id);
          
          setProfile(creatorProfile);
          setSocialAccounts(creatorSocial);
          setPortfolios(creatorPortfolios);
        } else {
          setProfile(null);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [authLoading, user?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        full_name: formData.get("full_name"),
        headline: formData.get("headline"),
        bio: formData.get("bio"),
        location: formData.get("location"),
        website_url: formData.get("website_url"),
        contact_email: formData.get("contact_email"),
      };
      
      // Update local state
      setProfile(prev => ({ ...prev, ...data }));
      
      // Call update profile API
      await updateProfile({ full_name: data.full_name as string, headline: data.headline as string });
      
      // Show success
      alert("Profile saved successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocial = () => {
    const newSocial = {
      id: `demo-social-${Date.now()}`,
      creator_profile_id: profile?.id,
      platform: "",
      username: "",
      profile_url: "",
      is_verified: false,
      followers_count: 0,
      engagement_rate: 0,
      metrics_source: "manual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSocialAccounts(prev => [...prev, newSocial]);
  };

  const handleRemoveSocial = (id: string) => {
    setSocialAccounts(prev => prev.filter(s => s.id !== id));
  };

  const handleAddPortfolio = () => {
    const newPortfolio = {
      id: `demo-portfolio-${Date.now()}`,
      creator_profile_id: profile?.id,
      title: "",
      description: "",
      is_public: true,
      sort_order: portfolios.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPortfolios(prev => [...prev, newPortfolio]);
  };

  const handleRemovePortfolio = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
  };

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <SkeletonCard showImage={false} showAvatar={false} lines={4} />
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Creator Profile"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No creator profile</h2>
          <Button asChild>
            <a href="/dashboard/creator/profile/edit">Create Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: "social", label: "Social Accounts", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
    { id: "portfolio", label: "Portfolio", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: "rates", label: "Rates", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg> },
    { id: "availability", label: "Availability", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  ];

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Creator Profile"
      description="Manage your creator profile, social accounts, and portfolio"
      user={user}
    >
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-border-subtle overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <Card variant="default" padding="lg">
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
            <CardHeader title="Basic Information" description="Your public profile information" />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Display Name *</label>
                <Input name="full_name" value={profile?.display_name || user?.full_name || ""} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Headline</label>
                <Input name="headline" value={profile?.headline || user?.headline || ""} placeholder="Lifestyle & Tech Content Creator" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Bio</label>
              <Textarea
                name="bio"
                value={profile?.bio || ""}
                placeholder="Tell us about yourself and your content..."
                minRows={4}
                maxRows={8}
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
                <Input name="location" value={profile?.location?.city ? `${profile.location.city}, ${profile.location.state}` : ""} placeholder="Los Angeles, CA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Website</label>
                <Input name="website_url" value={profile?.website_url || ""} type="url" placeholder="https://yourwebsite.com" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Contact Email</label>
              <Input name="contact_email" value={profile?.contact_email || user?.email || ""} type="email" />
            </div>

            <CardFooter divided>
              <Button type="submit" variant="primary" loading={saving} className="w-full sm:w-auto">
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {activeTab === "social" && (
        <Card variant="default" padding="lg">
          <CardHeader
            title="Social Accounts"
            description="Connect and manage your social media accounts"
            action={
              <Button variant="outline" size="sm" onClick={handleAddSocial} leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              }>
                Add Account
              </Button>
            }
          />
          
          {socialAccounts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <h3 className="mt-4 text-lg font-medium text-text-primary">No social accounts connected</h3>
              <p className="mt-1 text-text-secondary">Add your social media accounts to showcase your reach</p>
              <Button className="mt-4" onClick={handleAddSocial} leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              }>
                Add Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {socialAccounts.map((social, index) => (
                <div key={social.id} className="flex items-center gap-4 p-4 bg-surface-subtle rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg">
                    {social.platform.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary capitalize">{social.platform}</span>
                      {social.is_verified && <Badge variant="success" size="xs" dot dotColor="success">Verified</Badge>}
                    </div>
                    <p className="text-sm text-text-secondary truncate">@{social.username}</p>
                    <div className="flex gap-4 mt-1 text-sm text-text-tertiary">
                      <span>{formatNumber(social.followers_count || 0)} followers</span>
                      <span>{social.engagement_rate?.toFixed(1) || 0}% engagement</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={social.username} onChange={(e) => setSocialAccounts(prev => prev.map((s, i) => i === index ? { ...s, username: e.target.value } : s))} className="w-48" placeholder="@username" />
                    <Input value={social.profile_url} onChange={(e) => setSocialAccounts(prev => prev.map((s, i) => i === index ? { ...s, profile_url: e.target.value } : s))} className="w-64" placeholder="Profile URL" />
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveSocial(social.id)}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "portfolio" && (
        <Card variant="default" padding="lg">
          <CardHeader
            title="Portfolio"
            description="Showcase your best work"
            action={
              <Button variant="outline" size="sm" onClick={handleAddPortfolio} leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              }>
                Add Project
              </Button>
            }
          />
          
          {portfolios.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <h3 className="mt-4 text-lg font-medium text-text-primary">No portfolio projects yet</h3>
              <p className="mt-1 text-text-secondary">Add projects to showcase your work to brands</p>
              <Button className="mt-4" onClick={handleAddPortfolio} leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              }>
                Add Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolios.map((portfolio, index) => (
                <div key={portfolio.id} className="flex items-start gap-4 p-4 bg-surface-subtle rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
                    {portfolio.sort_order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Input value={portfolio.title} onChange={(e) => setPortfolios(prev => prev.map((p, i) => i === index ? { ...p, title: e.target.value } : p))} className="w-64" placeholder="Project Title" />
                      <Select
                        value={portfolio.is_public ? "true" : "false"}
                        onChange={(e) => setPortfolios(prev => prev.map((p, i) => i === index ? { ...p, is_public: e.target.value === "true" } : p))}
                        options={[
                          { value: "true", label: "Public" },
                          { value: "false", label: "Private" },
                        ]}
                        className="w-32"
                      />
                    </div>
                    <Textarea
                      value={portfolio.description}
                      onChange={(e) => setPortfolios(prev => prev.map((p, i) => i === index ? { ...p, description: e.target.value } : p))}
                      placeholder="Project description..."
                      minRows={2}
                      maxRows={4}
                      className="mt-2"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemovePortfolio(portfolio.id)}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "rates" && (
        <Card variant="default" padding="lg">
          <CardHeader title="Rates" description="Set your collaboration rates" />
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
            <h3 className="mt-4 text-lg font-medium text-text-primary">Rate Management Coming Soon</h3>
            <p className="mt-1 text-text-secondary">Set your rates for different content types and platforms</p>
          </div>
        </Card>
      )}

      {activeTab === "availability" && (
        <Card variant="default" padding="lg">
          <CardHeader title="Availability" description="Manage your availability for collaborations" />
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <h3 className="mt-4 text-lg font-medium text-text-primary">Availability Management Coming Soon</h3>
            <p className="mt-1 text-text-secondary">Set your available dates and blackout periods</p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}