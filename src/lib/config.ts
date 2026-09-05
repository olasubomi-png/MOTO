/**
 * Centralized configuration for Tosin Signature Motors / MOTOR platform.
 * Environment variables override defaults for deployment-specific values only.
 */

export const siteConfig = {
  /** Official business name */
  businessName: "Tosin Signature Motors",

  /** Short brand name used in compact contexts */
  brandShort: "Tosin Signature Motors",

  /** Platform / product name */
  platformName: "MOTOR",

  /** Official tagline */
  tagline: "Driven by Trust. Built for You.",

  /** WhatsApp display number (as shown to customers) */
  whatsappDisplay: "08051890334",

  /** WhatsApp number for wa.me links (country code, no + or spaces) */
  whatsappNumber:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[\s+]/g, "") ||
    "2348051890334",

  /** Phone display number */
  phoneDisplay: "08070627688",

  /** Phone for tel: links */
  phone: process.env.NEXT_PUBLIC_PHONE_NUMBER || "+2348070627688",

  /** Contact email — set NEXT_PUBLIC_CONTACT_EMAIL when a real address is confirmed */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",


  /** Official WhatsApp Channel */
  whatsappChannel:
    "https://whatsapp.com/channel/0029Vb8pqKL6BIEdGOcnTN25",

  /** Official TikTok */
  tiktok: "https://www.tiktok.com/@tosin_signature_motors",

  /** Optional public site origin for canonical / absolute OG URLs */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",

  /** Client-supplied marketing copy */
  marketingCopy: {
    headline: "New mentally, new opportunities, and new rides!",
    body: "Tosin Signature Motors delivers premium, clean & quality cars at great deals. Looking for your dream cars? Let’s make it happen.",
    closing: "Tosin Signature Motors — Driven by Trust. Built for You.",
  },
} as const;

/** Build a WhatsApp deep-link with optional pre-filled message */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
