import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local SVGs and future remote images
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
