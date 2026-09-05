import type { NextConfig } from "next";

/**
 * dangerouslyAllowSVG is required so next/image can serve the local
 * branded placeholder at /vehicles/placeholder.svg when real photos
 * are not yet uploaded. CSP is restricted (script-src 'none'; sandbox).
 * Remove this once placeholders are PNG/WebP or images are always present.
 */
const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
