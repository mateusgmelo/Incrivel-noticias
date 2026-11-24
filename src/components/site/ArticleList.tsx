import { ArticleCard } from "./ArticleCard";
import { Pagination } from "./Pagination";
import type { ArticleCard as Card } from "@/server/modules/articles/article.repository";
import type { PageMeta } from "@/server/core/http/responses";

export function ArticleList({
  title, subtitle, items, meta, basePath, params,
}: { title: string; subtitle?: string | null; items: Card[]; meta: PageMeta; basePath: string; params?: Record<string, string | undefined> }) {
  return (
    <section>
      <header className="mb-6 border-b-2 border-ink pb-3">
        <h1 className="headline text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </header>
      {items.length === 0 ? (
        <p className="py-12 text-center text-muted">Nenhuma notícia encontrada.</p>
      ) : (
        <div>{items.map((a) => <ArticleCard key={a.id} article={a} variant="list" />)}</div>
      )}
      <Pagination meta={meta} basePath={basePath} params={params} />
    </section>
  );
}
