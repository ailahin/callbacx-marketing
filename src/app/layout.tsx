import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SWRegister } from "@/components/pwa/SWRegister";

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
  title: {
    default: "CALLBACX MARKETING | Connecting Brands, Influencers & Creators",
    template: "%s | CALLBACX MARKETING",
  },
  description: "Connecting brands, influencers, creators and audiences through meaningful partnerships.",
  keywords: ["influencer marketing", "creator economy", "brand partnerships", "social media marketing"],
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
    title: "CALLBACX MARKETING | Connecting Brands, Influencers & Creators",
    description: "Connecting brands, influencers, creators and audiences through meaningful partnerships.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CALLBACX MARKETING - Connecting Brands & Creators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CALLBACX MARKETING | Connecting Brands, Influencers & Creators",
    description: "Connecting brands, influencers, creators and audiences through meaningful partnerships.",
    images: ["/og-image.png"],
    creator: "@callbacxmarketing",
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
          <ToastProvider>{children}</ToastProvider>
          <SWRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

