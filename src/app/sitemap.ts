import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.qoliber.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const docs = await getAllDocs();
  const docPages: MetadataRoute.Sitemap = docs
    .filter((doc) => doc.access_tier === "public" && doc.status === "published")
    .map((doc) => ({
      url: `${siteUrl}/docs/${doc.slug}`,
      lastModified: new Date(doc.lastModified),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticPages, ...docPages];
}
