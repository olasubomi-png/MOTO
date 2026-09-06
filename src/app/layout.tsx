import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    siteConfig.siteUrl || "https://tosin-signature-motor.vercel.app"
  ),
  title: {
    default: `${siteConfig.businessName} | ${siteConfig.platformName} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.businessName}`,
  },
  description: `${siteConfig.businessName} delivers premium, clean & quality cars at great deals. ${siteConfig.tagline}`,
  keywords: [
    "Tosin Signature Motors",
    "Signature Motors",
    "luxury cars Nigeria",
    "premium vehicles",
    "car dealership Lagos",
    "Mercedes",
    "BMW",
    "Range Rover",
    "Lexus",
    "buy cars Nigeria",
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: siteConfig.businessName,
    title: `${siteConfig.businessName} | ${siteConfig.platformName}`,
    description: siteConfig.tagline,
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.businessName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.businessName} | ${siteConfig.platformName}`,
    description: siteConfig.tagline,
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
