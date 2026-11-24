import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { articlesRepository } from "@/server/modules/articles/article.repository";
import { categoriesService } from "@/server/modules/categories/category.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [categories, articles] = await Promise.all([
    categoriesService.list(),
    articlesRepository.list({ status: "PUBLISHED" }, { limit: 1000 }),
  ]);

  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    ...categories.map((c) => ({ url: `${base}/categoria/${c.slug}`, changeFrequency: "hourly" as const, priority: 0.7 })),
    // Matérias agregadas não entram: o canonical delas aponta para a fonte original.
    ...articles
      .filter((a) => a.source === "ORIGINAL")
      .map((a) => ({
        url: `${base}/noticia/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
