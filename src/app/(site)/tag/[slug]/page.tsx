import { ArticleList } from "@/components/site/ArticleList";
import { PublicListQuery } from "@/server/modules/articles/article.schema";
import { publicContent } from "@/server/modules/articles/article.public";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> };

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = PublicListQuery.parse({ ...(await searchParams), tag: slug });
  const { items, meta } = await publicContent.list(query);
  return <ArticleList title={`#${slug}`} subtitle="Notícias marcadas com esta tag" items={items} meta={meta} basePath={`/tag/${slug}`} />;
}
