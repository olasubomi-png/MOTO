import type { NextConfig } from "next";

/**
 * dangerouslyAllowSVG is required so next/image can serve the local
 * branded placeholder at /vehicles/placeholder.svg.
 * remotePatterns limited to hosts actually used by demo assets.
 */
const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
