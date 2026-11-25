/**
 * Leituras públicas com cache (usadas pelas páginas do site).
 * Mesmas regras de `articlesService`: só PUBLISHED. O painel e a API usam o service direto.
 */
import { cachedContent } from "@/server/core/cache/content-cache";
import { categoriesService } from "@/server/modules/categories/category.service";
import { articlesService } from "./article.service";

export const publicContent = {
  homepage: cachedContent(() => articlesService.homepage(), "homepage"),
  article: cachedContent((slug: string) => articlesService.getPublished(slug), "article"),
  related: cachedContent((id: string, categorySlug: string) => articlesService.related({ id, categorySlug }), "related"),
  list: cachedContent((q: Parameters<typeof articlesService.listPublished>[0]) => articlesService.listPublished(q), "list"),
  categories: cachedContent(() => categoriesService.list(), "categories"),
  category: cachedContent((slug: string) => categoriesService.getBySlug(slug), "category"),
};
