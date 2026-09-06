import type { NextConfig } from "next";

/**
 * dangerouslyAllowSVG is required so next/image can serve the local
 * branded placeholder at /vehicles/placeholder.svg when real photos
 * are not yet uploaded. CSP is restricted (script-src 'none'; sandbox).
 */
const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
