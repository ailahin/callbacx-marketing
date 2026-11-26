import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SWRegister } from "@/components/pwa/SWRegister";
import { QueryProvider } from "@/context/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "CALLBACX MARKETING | Influencer Marketing Agency",
    template: "%s | CALLBACX MARKETING",
  },
  description: "CALLBACX MARKETING is an influencer marketing agency. We find brands, find influencers, negotiate deals, and manage campaigns by email — no dashboards, no logins, no self-serve marketplace.",
  keywords: ["influencer marketing agency", "influencer partnerships", "brand campaigns", "influencer management", "campaign management"],
  authors: [{ name: "CALLBACX MARKETING" }],
  creator: "CALLBACX MARKETING",
  publisher: "CALLBACX MARKETING",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://callbacxmarketing.com",
    siteName: "CALLBACX MARKETING",
    title: "CALLBACX MARKETING | Influencer Marketing Agency",
    description: "CALLBACX MARKETING is an influencer marketing agency. We find brands, find influencers, negotiate deals, and manage campaigns by email — no dashboards, no logins, no self-serve marketplace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CALLBACX MARKETING | Influencer Marketing Agency",
    description: "CALLBACX MARKETING is an influencer marketing agency. We find brands, find influencers, negotiate deals, and manage campaigns by email — no dashboards, no logins, no self-serve marketplace.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
<body className="min-h-full flex flex-col bg-background text-text-primary">
          <ThemeProvider
            defaultTheme="system"
            storageKey="callbacxmarketing-theme"
            attribute="data-theme"
          >
            <QueryProvider>
              <ToastProvider>{children}</ToastProvider>
              <SWRegister />
            </QueryProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}

