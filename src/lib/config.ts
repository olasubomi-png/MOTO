/**
 * Centralized site configuration.
 * Prefer environment variables in production.
 * Fallbacks are safe development placeholders only.
 */

const DEFAULT_WHATSAPP = "2348000000000"; // replace via NEXT_PUBLIC_WHATSAPP_NUMBER
const DEFAULT_PHONE = "+2348000000000";
const DEFAULT_EMAIL = "hello@signaturemotors.com";

export const siteConfig = {
  /** WhatsApp number without + or spaces (e.g. 2348012345678) */
  whatsappNumber:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[\s+]/g, "") ||
    DEFAULT_WHATSAPP,

  /** Display / tel: phone number */
  phone: process.env.NEXT_PUBLIC_PHONE_NUMBER || DEFAULT_PHONE,

  /** Public contact email */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || DEFAULT_EMAIL,

  /** Optional public site URL for server-side metadata (canonical, OG absolute URLs) */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
} as const;

/** Build a WhatsApp deep-link with optional pre-filled message */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
