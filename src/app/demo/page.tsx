"use client";

import * as React from "react";
import { useTheme, ThemeToggle } from "@/context/ThemeProvider";
import {
  Button,
  ButtonGroup,
  IconButton,
  Input,
  Textarea,
  Select,
  Label,
  FormField,
  Checkbox,
  Radio,
  Switch,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardGrid,
  StatCard,
  ProfileCard,
  Badge,
  StatusBadge,
  Tag,
  TagGroup,
  CountBadge,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  Header,
  Footer,
  MobileNavigation,
  BottomNavigation,
  Spinner,
  LoadingDots,
  Skeleton,
  SkeletonCard,
  ButtonLoading,
  EmptyState,
  NoDataState,
  NoResultsState,
  FirstTimeState,
  NoConnectionState,
  ErrorEmptyState,
  ErrorState,
  InlineError,
  SuccessState,
  InlineSuccess,
  ConfirmationDialog,
} from "@/components";
import { cn } from "@/lib/utils";

/**
 * Navigation Items for Demo
 */
const demoNavigation = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "Blog", href: "#blog" },
];

const demoActions = [
  { label: "Sign In", href: "#signin", variant: "ghost" as const },
  { label: "Get Started", href: "#signup", variant: "primary" as const },
];

const mobileNavSections = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "#dashboard", icon: <LayoutIcon /> },
      { label: "Analytics", href: "#analytics", icon: <ChartIcon /> },
      { label: "Campaigns", href: "#campaigns", icon: <MegaphoneIcon />, badge: 3 },
      { label: "Creators", href: "#creators", icon: <UsersIcon /> },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Profile", href: "#profile", icon: <UserIcon /> },
      { label: "Notifications", href: "#notifications", icon: <BellIcon />, badge: 5 },
      { label: "Billing", href: "#billing", icon: <CreditCardIcon /> },
    ],
  },
];

const bottomNavItems = [
  { label: "Home", href: "#", icon: <HomeIcon />, activeIcon: <HomeIcon fill /> },
  { label: "Search", href: "#", icon: <SearchIcon />, activeIcon: <SearchIcon fill /> },
  { label: "Create", href: "#", icon: <PlusIcon />, activeIcon: <PlusIcon fill /> },
  { label: "Profile", href: "#", icon: <UserIcon />, activeIcon: <UserIcon fill />, badge: 2 },
];

/**
 * Demo Page Component
 */
export default function DemoPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(["design", "react"]);
  const [radioValue, setRadioValue] = React.useState("option1");
  const [checkboxValue, setCheckboxValue] = React.useState(false);
  const [switchValue, setSwitchValue] = React.useState(true);

  const tagOptions = [
    { value: "design", label: "Design" },
    { value: "react", label: "React" },
    { value: "typescript", label: "TypeScript" },
    { value: "tailwind", label: "Tailwind" },
    { value: "ui", label: "UI/UX" },
    { value: "accessibility", label: "Accessibility" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Header */}
      <Header
        navigation={demoNavigation}
        actions={demoActions}
        variant="default"
        fixed
        mobileMenuButton={false}
      />

      {/* Theme Toggle Bar */}
      <div className="border-b border-border-subtle bg-surface/50 backdrop-blur-sm sticky top-16 z-sticky md:hidden">
        <div className="mx-auto max-w-[80rem] px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Theme: {resolvedTheme}</span>
          <ThemeToggle variant="button" size="sm" showLabels />
        </div>
      </div>

      <main className="flex-1 pt-20 pb-16">
        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Hero Section */}
          <section className="py-12 sm:py-20 text-center" aria-labelledby="hero-title">
<h1 id="hero-title" className="text-display-md font-bold text-text-primary tracking-tight mb-6">
              CALLBACX MARKETING Design System
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              A premium, sophisticated design system inspired by weaving threads and meaningful connections.
              Built for modern React applications with TypeScript, Tailwind CSS, and accessibility at its core.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="primary" leftIcon={<RocketIcon />}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" rightIcon={<GithubIcon />}>
                View on GitHub
              </Button>
            </div>
          </section>

          {/* Color Palette */}
          <section id="colors" aria-labelledby="colors-title" className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 id="colors-title" className="text-h2 font-semibold text-text-primary">Color Palette</h2>
              <ThemeToggle variant="dropdown" showLabels />
            </div>
            <p className="text-text-secondary">
              Semantic color system with brand, accent, and sage palettes. Supports both light and dark modes.
            </p>
            
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Brand", colors: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"], prefix: "brand" },
                { name: "Accent", colors: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"], prefix: "accent" },
                { name: "Sage", colors: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"], prefix: "sage" },
              ].map(({ name, colors, prefix }) => (
                <Card key={name} variant="outlined" padding="md">
                  <h3 className="text-lg font-medium text-text-primary mb-4">{name}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((shade) => (
                      <div
                        key={shade}
                        className="aspect-square rounded-lg border border-border-subtle"
                        style={{ backgroundColor: `var(--color-${prefix}-${shade})` }}
                        title={`${prefix}-${shade}`}
                      />
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Neutral & Semantic */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card variant="outlined" padding="md">
                <h3 className="text-lg font-medium text-text-primary mb-4">Neutral</h3>
                <div className="grid grid-cols-6 gap-2">
                  {["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"].map((shade) => (
                    <div
                      key={shade}
                      className="aspect-square rounded-lg border border-border-subtle"
                      style={{ backgroundColor: `var(--color-neutral-${shade})` }}
                      title={`neutral-${shade}`}
                    />
                  ))}
                </div>
              </Card>

              <Card variant="outlined" padding="md">
                <h3 className="text-lg font-medium text-text-primary mb-4">Semantic Colors</h3>
                <div className="space-y-3">
                  {[
                    { name: "Success", color: "success", shades: ["50", "100", "500", "600", "700"] },
                    { name: "Warning", color: "warning", shades: ["50", "100", "500", "600", "700"] },
                    { name: "Error", color: "error", shades: ["50", "100", "500", "600", "700"] },
                    { name: "Info", color: "info", shades: ["50", "100", "500", "600", "700"] },
                  ].map(({ name, color, shades }) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-secondary w-24">{name}</span>
                      <div className="flex-1 flex gap-2">
                        {shades.map((shade) => (
                          <div
                            key={shade}
                            className="flex-1 h-8 rounded-lg border border-border-subtle"
                            style={{ backgroundColor: `var(--color-${color}-${shade})` }}
                            title={`${color}-${shade}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>

          {/* Typography */}
          <section id="typography" aria-labelledby="typography-title" className="space-y-8">
            <h2 id="typography-title" className="text-h2 font-semibold text-text-primary">Typography</h2>
            <p className="text-text-secondary">Fluid, responsive type scale using clamp() for seamless scaling across viewports.</p>

            <Card variant="outlined" padding="lg" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Display Styles</h3>
                <div className="space-y-4">
                  {[
                    { label: "Display XL", className: "text-display-xl" },
                    { label: "Display LG", className: "text-display-lg" },
                    { label: "Display MD", className: "text-display-md" },
                    { label: "Display SM", className: "text-display-sm" },
                  ].map(({ label, className }) => (
                    <div key={label} className={cn(className, "font-bold text-text-primary")}>
                      {label} â€” The quick brown fox jumps
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Headings</h3>
                <div className="space-y-3">
                  {[
                    { tag: "h1", className: "text-h1" },
                    { tag: "h2", className: "text-h2" },
                    { tag: "h3", className: "text-h3" },
                    { tag: "h4", className: "text-h4" },
                    { tag: "h5", className: "text-h5" },
                    { tag: "h6", className: "text-h6" },
                  ].map(({ tag, className }) => {
                    const TagEl = tag as keyof React.JSX.IntrinsicElements;
                    return (
                      <div key={tag}>
                        <span className="text-xs font-mono text-text-tertiary mr-3">{tag.toUpperCase()}</span>
                        <TagEl className={cn("font-semibold text-text-primary", className)}>
                          Heading {tag.slice(1)} â€” The quick brown fox jumps over the lazy dog
                        </TagEl>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Body Text</h3>
                <div className="space-y-3">
                  {[
                    { label: "XL", className: "text-xl" },
                    { label: "LG", className: "text-lg" },
                    { label: "Base", className: "text-base" },
                    { label: "SM", className: "text-sm" },
                    { label: "XS", className: "text-xs" },
                  ].map(({ label, className }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-text-tertiary w-12">{label}</span>
                      <p className={cn(className, "text-text-secondary flex-1")}>
                        The quick brown fox jumps over the lazy dog. This is a sample paragraph to demonstrate the type scale.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Font Weights</h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: "Light (300)", weight: "font-weight-light" },
                    { label: "Normal (400)", weight: "font-weight-normal" },
                    { label: "Medium (500)", weight: "font-weight-medium" },
                    { label: "Semibold (600)", weight: "font-weight-semibold" },
                    { label: "Bold (700)", weight: "font-weight-bold" },
                  ].map(({ label, weight }) => (
                    <span key={label} className={cn("text-text-primary", weight)}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* Buttons */}
          <section id="buttons" aria-labelledby="buttons-title" className="space-y-8">
            <h2 id="buttons-title" className="text-h2 font-semibold text-text-primary">Buttons</h2>
            <p className="text-text-secondary">Multiple variants, sizes, and states for all interaction needs.</p>

            <Card variant="outlined" padding="lg" className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { variant: "primary", label: "Primary" },
                    { variant: "secondary", label: "Secondary" },
                    { variant: "outline", label: "Outline" },
                    { variant: "ghost", label: "Ghost" },
                    { variant: "destructive", label: "Destructive" },
                    { variant: "accent", label: "Accent" },
                    { variant: "success", label: "Success" },
                    { variant: "link", label: "Link" },
                  ].map(({ variant, label }) => (
                    <Button key={variant} variant={variant as any}>{label}</Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {["xs", "sm", "md", "lg", "xl"].map((size) => (
                    <Button key={size} size={size as any}>{size.toUpperCase()}</Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">With Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button leftIcon={<PlusIcon />}>Add Item</Button>
                  <Button variant="outline" rightIcon={<ArrowRightIcon />}>Continue</Button>
                  <Button variant="ghost" leftIcon={<DownloadIcon />}>Download</Button>
                  <Button variant="destructive" leftIcon={<TrashIcon />}>Delete</Button>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Loading & Disabled</h3>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading</Button>
                  <Button loading loadingContent="Saving...">Saving</Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="outline" disabled>Disabled Outline</Button>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Button Group</h3>
                <ButtonGroup>
                  <Button variant="outline">Left</Button>
                  <Button variant="outline">Center</Button>
                  <Button variant="outline">Right</Button>
                </ButtonGroup>
                <ButtonGroup vertical className="mt-3">
                  <Button variant="outline">Top</Button>
                  <Button variant="outline">Middle</Button>
                  <Button variant="outline">Bottom</Button>
                </ButtonGroup>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Icon Buttons</h3>
                <div className="flex flex-wrap gap-2">
                  <IconButton aria-label="Search" variant="default"><SearchIcon /></IconButton>
                  <IconButton aria-label="Settings" variant="ghost"><SettingsIcon /></IconButton>
                  <IconButton aria-label="Notifications" variant="subtle"><BellIcon /></IconButton>
                  <IconButton aria-label="Menu" size="sm"><MenuIcon /></IconButton>
                  <IconButton aria-label="Close" size="lg"><CloseIcon /></IconButton>
                </div>
              </div>
            </Card>
          </section>

          {/* Forms */}
          <section id="forms" aria-labelledby="forms-title" className="space-y-8">
            <h2 id="forms-title" className="text-h2 font-semibold text-text-primary">Form Components</h2>
            <p className="text-text-secondary">Accessible form inputs with validation states and consistent styling.</p>

            <Card variant="outlined" padding="lg" className="space-y-8">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField label="First Name" required error="This field is required">
                    <Input placeholder="John" leftIcon={<UserIcon />} />
                  </FormField>
                  <FormField label="Last Name" required>
                    <Input placeholder="Doe" />
                  </FormField>
                </div>

                <FormField label="Email" required>
                  <Input type="email" placeholder="john@example.com" leftIcon={<MailIcon />} helperText="We'll never share your email" />
                </FormField>

                <FormField label="Password" required>
                  <Input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" leftIcon={<LockIcon />} rightIcon={<EyeIcon />} />
                </FormField>

                <FormField label="Bio" helperText="Tell us about yourself (max 200 characters)">
                  <Textarea
                    placeholder="Write something about yourself..."
                    maxLength={200}
                    showCharacterCount
                    minRows={4}
                  />
                </FormField>

                <FormField label="Role" required>
                  <Select
                    placeholder="Select your role"
                    options={[
                      { value: "designer", label: "Designer" },
                      { value: "developer", label: "Developer" },
                      { value: "manager", label: "Product Manager" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </FormField>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField>
                    <Label>Preferences</Label>
                    <div className="space-y-3 mt-2">
                      <Checkbox label="Email notifications" description="Receive updates via email" checked={checkboxValue} onCheckedChange={setCheckboxValue} />
                      <Checkbox label="Push notifications" description="Receive push notifications" />
                      <Checkbox label="Weekly digest" description="Weekly summary email" />
                    </div>
                  </FormField>

                  <FormField>
                    <Label>Plan</Label>
                    <div className="space-y-3 mt-2">
                      <Radio label="Free" description="Basic features" value="free" name="plan" checked={radioValue === "free"} onChange={() => setRadioValue("free")} />
                      <Radio label="Pro" description="Advanced features" value="pro" name="plan" checked={radioValue === "pro"} onChange={() => setRadioValue("pro")} />
                      <Radio label="Enterprise" description="Custom solutions" value="enterprise" name="plan" checked={radioValue === "enterprise"} onChange={() => setRadioValue("enterprise")} />
                    </div>
                  </FormField>

                  <FormField>
                    <Label>Settings</Label>
                    <div className="space-y-3 mt-2">
                      <Switch label="Dark mode" description="Enable dark theme" checked={switchValue} onCheckedChange={setSwitchValue} />
                      <Switch label="Auto-save" description="Automatically save changes" />
                      <Switch label="Analytics" description="Allow usage analytics" disabled />
                    </div>
                  </FormField>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                  <Button type="submit" variant="primary">Save Changes</Button>
                  <Button type="button" variant="outline">Cancel</Button>
                </div>
              </form>
            </Card>
          </section>

          {/* Cards */}
          <section id="cards" aria-labelledby="cards-title" className="space-y-8">
            <h2 id="cards-title" className="text-h2 font-semibold text-text-primary">Cards</h2>
            <p className="text-text-secondary">Versatile content containers with multiple variants and layouts.</p>

            <CardGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="md">
              <Card variant="default" padding="md" hover>
                <CardHeader title="Default Card" description="Standard card with hover effect" />
                <CardContent>
                  <p className="text-text-secondary">This is a default card with subtle shadow and hover elevation.</p>
                </CardContent>
                <CardFooter divided>
                  <Button variant="ghost" size="sm">Learn More</Button>
                </CardFooter>
              </Card>

              <Card variant="elevated" padding="md" hover>
                <CardHeader title="Elevated Card" description="Prominent shadow for emphasis" />
                <CardContent>
                  <p className="text-text-secondary">Elevated cards draw more attention with stronger shadows.</p>
                </CardContent>
                <CardFooter divided>
                  <Button variant="ghost" size="sm">View Details</Button>
                </CardFooter>
              </Card>

              <Card variant="outlined" padding="md" hover>
                <CardHeader title="Outlined Card" description="Border-focused style" />
                <CardContent>
                  <p className="text-text-secondary">Outlined cards work well on colored backgrounds.</p>
                </CardContent>
                <CardFooter divided>
                  <Button variant="ghost" size="sm">Read More</Button>
                </CardFooter>
              </Card>
            </CardGrid>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard value="12,345" label="Total Users" change="+12.5%" changeType="increase" icon={<UsersIcon />} />
              <StatCard value="$48,291" label="Revenue" change="+8.2%" changeType="increase" icon={<DollarIcon />} />
              <StatCard value="3.24%" label="Conversion" change="-0.3%" changeType="decrease" icon={<ChartIcon />} />
              <StatCard value="2m 14s" label="Avg. Session" change="+5s" changeType="increase" icon={<ClockIcon />} />
            </div>

            {/* Profile Card */}
            <Card variant="default" padding="lg" className="max-w-md">
              <ProfileCard
                name="Sarah Chen"
                role="Senior Product Designer"
                email="sarah.chen@callbacxtechnology.com"
                bio="Passionate about creating meaningful digital experiences. 8+ years designing for tech companies."
                avatarFallback="SC"
                metadata={[
                  { label: "Projects", value: "24" },
                  { label: "Followers", value: "1.2K" },
                  { label: "Following", value: "342" },
                ]}
                actions={
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" className="flex-1">Message</Button>
                    <Button variant="outline" size="sm" className="flex-1">Follow</Button>
                  </div>
                }
              />
            </Card>
          </section>

          {/* Badges & Tags */}
          <section id="badges" aria-labelledby="badges-title" className="space-y-8">
            <h2 id="badges-title" className="text-h2 font-semibold text-text-primary">Badges & Tags</h2>
            <p className="text-text-secondary">Status indicators, labels, and interactive tags.</p>

            <Card variant="outlined" padding="lg" className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Badge Variants</h3>
                <div className="flex flex-wrap gap-3">
                  {["default", "primary", "secondary", "success", "warning", "error", "info", "outline", "ghost"].map((variant) => (
                    <Badge key={variant} variant={variant as any}>{variant}</Badge>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {["xs", "sm", "md", "lg"].map((size) => (
                    <Badge key={size} size={size as any}>Size {size}</Badge>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Status Badges</h3>
                <div className="flex flex-wrap gap-3">
                  {["active", "inactive", "pending", "processing", "completed", "failed", "draft", "archived"].map((status) => (
                    <StatusBadge key={status} status={status as any} />
                  ))}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Interactive Tags</h3>
                <TagGroup tags={tagOptions} selected={selectedTags} onChange={setSelectedTags} multiple />
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Count Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <CountBadge count={5} />
                  <CountBadge count={42} />
                  <CountBadge count={156} />
                  <CountBadge count={1234} max={999} />
                  <CountBadge count={0} showZero />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Dot Indicators</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge dot dotColor="success">Online</Badge>
                  <Badge dot dotColor="warning">Away</Badge>
                  <Badge dot dotColor="error">Busy</Badge>
                  <Badge dot dotColor="default">Offline</Badge>
                </div>
              </div>
            </Card>
          </section>

          {/* Loading States */}
          <section id="loading" aria-labelledby="loading-title" className="space-y-8">
            <h2 id="loading-title" className="text-h2 font-semibold text-text-primary">Loading States</h2>
            <p className="text-text-secondary">Skeleton screens, spinners, and progressive loading patterns.</p>

            <Card variant="outlined" padding="lg" className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Spinners</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <Spinner size="xs" />
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                  <Spinner size="xl" />
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <Spinner size="md" variant="brand" />
                  <Spinner size="md" variant="accent" />
                  <Spinner size="md" variant="white" className="bg-neutral-900 p-4 rounded-lg" />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Loading Dots</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <LoadingDots size="sm" />
                  <LoadingDots size="md" />
                  <LoadingDots size="lg" />
                  <LoadingDots size="md" color="brand" />
                  <LoadingDots size="md" color="accent" />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Skeletons</h3>
                <div className="space-y-4">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="circular" width={48} height={48} />
                  <Skeleton variant="rectangular" width="100%" height={120} />
                  <SkeletonCard showImage showAvatar lines={3} />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Button Loading</h3>
                <div className="flex flex-wrap gap-3">
                  <ButtonLoading loading>Saving...</ButtonLoading>
                  <ButtonLoading loading loadingText="Processing...">Submit</ButtonLoading>
                  <ButtonLoading loading variant="outline">Loading</ButtonLoading>
                </div>
              </div>
            </Card>
          </section>

          {/* Empty States */}
          <section id="empty" aria-labelledby="empty-title" className="space-y-8">
            <h2 id="empty-title" className="text-h2 font-semibold text-text-primary">Empty States</h2>
            <p className="text-text-secondary">Meaningful empty states with illustrations and clear actions.</p>

            <CardGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="md">
              <Card variant="outlined" padding="lg">
                <NoDataState
                  title="No projects yet"
                  description="Create your first project to get started."
                  action={{ label: "Create Project", onClick: () => {} }}
                />
              </Card>

              <Card variant="outlined" padding="lg">
                <NoResultsState
                  title="No results found"
                  description="Try adjusting your search terms or filters."
                  action={{ label: "Clear Filters", onClick: () => {}, variant: "outline" }}
                />
              </Card>

              <Card variant="outlined" padding="lg">
<FirstTimeState
                  title="Welcome to CALLBACX MARKETING!"
                  description="Let's set up your workspace. Invite your team and start collaborating."
                  action={{ label: "Get Started", onClick: () => {} }}
                />
              </Card>
            </CardGrid>

            <CardGrid columns={{ base: 1, sm: 2 }} gap="md">
              <Card variant="outlined" padding="lg">
                <NoConnectionState
                  title="No connections yet"
                  description="Start building your network by connecting with other creators."
                  action={{ label: "Find Creators", onClick: () => {} }}
                />
              </Card>

              <Card variant="outlined" padding="lg">
                <ErrorEmptyState
                  title="Failed to load"
                  description="Something went wrong while loading your data."
                  action={{ label: "Retry", onClick: () => {} }}
                />
              </Card>
            </CardGrid>
          </section>

          {/* Error & Success States */}
          <section id="states" aria-labelledby="states-title" className="space-y-8">
            <h2 id="states-title" className="text-h2 font-semibold text-text-primary">Error & Success States</h2>
            <p className="text-text-secondary">Comprehensive feedback components for user actions.</p>

            <CardGrid columns={{ base: 1, sm: 2 }} gap="md">
              <Card variant="outlined" padding="lg">
                <h3 className="text-lg font-medium text-text-primary mb-4">Error States</h3>
                <div className="space-y-4">
                  <ErrorState
                    title="Connection Failed"
                    message="Unable to connect to the server. Please check your internet connection and try again."
                    onRetry={() => {}}
                    variant="inline"
                  />
                  <ErrorState
                    message="Invalid email address format"
                    variant="inline"
                    severity="warning"
                  />
                  <InlineError message="This field is required" />
                </div>
              </Card>

              <Card variant="outlined" padding="lg">
                <h3 className="text-lg font-medium text-text-primary mb-4">Success States</h3>
                <div className="space-y-4">
                  <SuccessState
                    title="Changes Saved"
                    message="Your profile has been updated successfully."
                    action={{ label: "View Profile", onClick: () => {} }}
                    variant="inline"
                  />
                  <SuccessState
                    title="Welcome aboard!"
                    message="Your account has been created. Let's get you set up."
                    action={{ label: "Get Started", onClick: () => {} }}
                    variant="inline"
                    celebrate
                  />
                  <InlineSuccess message="Changes saved automatically" />
                </div>
              </Card>
            </CardGrid>

            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => setConfirmOpen(true)}>
                Show Confirmation Dialog
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(true)}>
                Show Sheet/Drawer
              </Button>
            </div>
          </section>

          {/* Navigation Components */}
          <section id="navigation" aria-labelledby="nav-title" className="space-y-8">
            <h2 id="nav-title" className="text-h2 font-semibold text-text-primary">Navigation Components</h2>
            <p className="text-text-secondary">Responsive headers, footers, and mobile navigation patterns.</p>

            <Card variant="outlined" padding="lg">
              <h3 className="text-lg font-medium text-text-primary mb-4">Mobile Navigation (Sheet)</h3>
              <p className="text-text-secondary mb-4">Click the button below to see the mobile navigation drawer.</p>
              <Button onClick={() => setSheetOpen(true)} leftIcon={<MenuIcon />}>
                Open Mobile Menu
              </Button>
            </Card>

            <Card variant="outlined" padding="lg">
              <h3 className="text-lg font-medium text-text-primary mb-4">Bottom Navigation</h3>
              <p className="text-text-secondary mb-4">Mobile app-style bottom navigation (visible on mobile only).</p>
              <div className="md:hidden">
                <BottomNavigation items={bottomNavItems} activeIndex={0} onChange={console.log} />
              </div>
              <div className="hidden md:block p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center text-text-tertiary">
                {"Bottom navigation is only visible on mobile screens (<md). Resize your browser to see it."}
              </div>
            </Card>
          </section>

          {/* Footer */}
<Footer
            brandName="CALLBACX MARKETING"
            tagline="Connecting brands, influencers, creators and audiences through meaningful partnerships."
            columns={[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "#" },
                  { label: "Pricing", href: "#" },
                  { label: "Integrations", href: "#" },
                  { label: "Changelog", href: "#" },
                  { label: "Roadmap", href: "#" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "Careers", href: "#" },
                  { label: "Press", href: "#" },
                  { label: "Contact", href: "#" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Documentation", href: "#" },
                  { label: "Help Center", href: "#" },
                  { label: "Community", href: "#" },
                  { label: "API Reference", href: "#" },
                  { label: "Status", href: "#" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                  { label: "Security", href: "#" },
                  { label: "Cookies", href: "#" },
                ],
              },
            ]}
            socialLinks={[
              { label: "Twitter", href: "#", icon: <TwitterIcon /> },
              { label: "GitHub", href: "#", icon: <GithubIcon /> },
              { label: "LinkedIn", href: "#", icon: <LinkedinIcon /> },
              { label: "Discord", href: "#", icon: <DiscordIcon /> },
            ]}
            legalLinks={[
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
              { label: "Cookie Policy", href: "#" },
            ]}
            newsletter={{
              title: "Stay Updated",
              description: "Get the latest updates and tips delivered to your inbox.",
              placeholder: "Enter your email",
              buttonText: "Subscribe",
              onSubmit: async (email) => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                console.log("Subscribed:", email);
              },
            }}
            variant="extended"
          />

          {/* Mobile Navigation Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="left" size="lg">
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Main menu navigation</SheetDescription>
                <SheetClose onClick={() => setSheetOpen(false)} />
              </SheetHeader>
              <MobileNavigation
                sections={mobileNavSections}
                header={
                  <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                      <span className="text-brand-600 dark:text-brand-400 font-bold text-lg">JD</span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">John Designer</p>
                      <p className="text-sm text-text-secondary">john@callbacxtechnology.com</p>
                    </div>
                  </div>
                }
                footer={
                  <div className="flex gap-2">
                    <Button variant="primary" className="flex-1">Upgrade to Pro</Button>
                    <Button variant="ghost" className="flex-1">Settings</Button>
                  </div>
                }
                closeOnSelect
              />
            </SheetContent>
          </Sheet>

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Delete Project"
            message="Are you sure you want to delete this project? This action cannot be undone and all data will be permanently lost."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={() => setConfirmOpen(false)}
            variant="danger"
          />
        </div>
      </main>
    </div>
  );
}

/**
 * Icon Components
 */
function LayoutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function ChartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function MegaphoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5", fill }: { className?: string; fill?: boolean }) {
  return (
    <svg className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function CreditCardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function HomeIcon({ className = "h-5 w-5", fill }: { className?: string; fill?: boolean }) {
  return (
    <svg className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5", fill }: { className?: string; fill?: boolean }) {
  return (
    <svg className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PlusIcon({ className = "h-5 w-5", fill }: { className?: string; fill?: boolean }) {
  return (
    <svg className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function RocketIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 19V8a2 2 0 00-2-2H7a2 2 0 00-2 2v11m4-7a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 012-2h10a2 2 0 012 2v2H5v-2z" />
    </svg>
  );
}

function GithubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  );
}

function LinkedinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function DiscordIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.675 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 00.031.057 19.9 19.9 0 005.992 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-6.485.077.077 0 01.006-.128 10.2 10.2 0 013.648-.111.077.077 0 01.07.006c1.331.31 2.591.867 3.765 1.581a.07.07 0 00.063-.013 13.28 13.28 0 001.812-2.807.077.077 0 00-.032-.11 13.27 13.27 0 00-1.696-6.533.074.074 0 01-.013-.105c.459-1.995 1.218-3.96 2.245-5.756a.063.063 0 00.014-.074 21.57 21.57 0 00-.862-4.393.07.07 0 00-.118-.017zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333 1.056-2.419 2.275-2.419 1.22 0 2.252 1.07 2.252 2.42 0 1.333-1.047 2.418-2.37 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333 1.056-2.419 2.275-2.419 1.22 0 2.252 1.07 2.252 2.42 0 1.333-1.047 2.418-2.37 2.418z" />
    </svg>
  );
}

function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function SettingsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function DollarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

