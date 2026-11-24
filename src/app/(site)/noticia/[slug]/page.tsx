import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/site/ArticleCard";
import { ViewTracker } from "@/components/site/ViewTracker";
import { formatDateTime } from "@/lib/format";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { NotFoundError } from "@/server/core/http/errors";
import { articlesService } from "@/server/modules/articles/article.service";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await articlesService.getPublished(slug);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await load(slug);
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: a.source === "IMPORTED" && a.sourceUrl ? a.sourceUrl : `/noticia/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.excerpt,
      publishedTime: a.publishedAt?.toISOString(),
      images: a.coverImageUrl ? [a.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await load(slug);
  const related = await articlesService.related(article);
  const imported = article.source === "IMPORTED";

  // Dados estruturados (schema.org/NewsArticle): o que buscadores usam para rich results de notícia.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    articleSection: article.categoryName,
    keywords: article.tags.map((t) => t.name).join(", ") || undefined,
    author: imported
      ? { "@type": "Organization", name: article.sourceName }
      : { "@type": "Person", name: article.authorName },
    publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
    mainEntityOfPage: imported && article.sourceUrl ? article.sourceUrl : `${siteUrl()}/noticia/${article.slug}`,
    isAccessibleForFree: true,
  };

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <script
        type="application/ld+json"
        // JSON.stringify + escape de "<" impede injeção de </script> via conteúdo
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ViewTracker slug={article.slug} />
      <article className="lg:col-span-2">
        <Link href={`/categoria/${article.categorySlug}`} className="text-sm font-bold uppercase tracking-wider text-brand">
          {article.categoryName}
        </Link>
        <h1 className="headline mt-2 text-3xl font-bold leading-tight sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-lg text-muted sm:text-xl">{article.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-line py-3 text-sm text-muted">
          <span className="font-semibold text-ink">{imported ? article.sourceName : `Por ${article.authorName}`}</span>
          <span>·</span>
          <time dateTime={article.publishedAt?.toISOString()}>{formatDateTime(article.publishedAt)}</time>
          <span>·</span>
          <span>{article.views.toLocaleString("pt-BR")} leituras</span>
        </div>

        {article.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImageUrl} alt="" className="mt-6 aspect-[16/9] w-full rounded-lg object-cover" />
        )}

        {imported ? (
          <div className="mt-8 rounded-lg border border-line bg-paper p-6">
            <p className="text-sm text-muted">
              Esta é uma manchete agregada. O Incrível Notícias exibe apenas o título e o resumo publicados pela fonte no
              seu feed RSS — o conteúdo integral pertence ao veículo de origem.
            </p>
            {article.sourceUrl && (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-brand mt-4">
                Ler a matéria completa em {article.sourceName} ↗
              </a>
            )}
          </div>
        ) : (
          <div className="prose-news mt-8">
            {article.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}

        {article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <Link key={t.slug} href={`/tag/${t.slug}`} className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-ink">
                #{t.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      <aside>
        <h2 className="mb-5 border-b-2 border-ink pb-2 text-sm font-bold uppercase tracking-wider">Leia também</h2>
        <div className="space-y-6">
          {related.length ? related.map((a) => <ArticleCard key={a.id} article={a} />) : (
            <p className="text-sm text-muted">Sem outras matérias nesta editoria.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
