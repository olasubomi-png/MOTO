import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { getAllVehicles } from "@/lib/vehicles-public";

export default async function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  // Without a configured public origin, emit relative-safe empty absolute URLs
  // only when siteUrl is set — avoids inventing a domain.
  if (!base) {
    return [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/inventory`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const vehicles = (await getAllVehicles()).filter(
    (v) => v.availability === "available" || v.availability === "reserved"
  );

  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${base}/inventory/${v.id}`,
    lastModified: v.updatedAt ? new Date(v.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
