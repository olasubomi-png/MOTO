import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Signature Motors | MOTOR — Driven by Trust. Built for You.",
    template: "%s | Signature Motors",
  },
  description:
    "Signature Motors is a premium automotive dealership. Discover luxury and performance vehicles carefully selected and prepared for you. Driven by trust. Built for you.",
  keywords: [
    "Signature Motors",
    "luxury cars",
    "premium vehicles",
    "car dealership",
    "Mercedes",
    "BMW",
    "Range Rover",
    "Lexus",
    "Nigeria cars",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Signature Motors",
    title: "Signature Motors | MOTOR",
    description: "Driven by Trust. Built for You.",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "Signature Motors" }],
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
