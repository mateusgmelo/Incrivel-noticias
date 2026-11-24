import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/site/ArticleList";
import { NotFoundError } from "@/server/core/http/errors";
import { PublicListQuery } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";
import { categoriesService } from "@/server/modules/categories/category.service";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> };

async function loadCategory(slug: string) {
  try {
    return await categoriesService.getBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await loadCategory((await params).slug);
  return { title: c.name, description: c.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await loadCategory(slug);
  const query = PublicListQuery.parse({ ...(await searchParams), category: slug });
  const { items, meta } = await articlesService.listPublished(query);
  return <ArticleList title={category.name} subtitle={category.description} items={items} meta={meta} basePath={`/categoria/${slug}`} />;
}
