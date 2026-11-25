// Busca não usa cache: cada termo é único e encheria o cache sem reaproveitamento.
import type { Metadata } from "next";
import { ArticleList } from "@/components/site/ArticleList";
import { PublicListQuery } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

export const metadata: Metadata = { title: "Buscar" };

type Props = { searchParams: Promise<Record<string, string>> };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const parsed = PublicListQuery.safeParse(sp);
  const query = parsed.success ? parsed.data : PublicListQuery.parse({});
  const { items, meta } = await articlesService.listPublished(query);
  const title = query.q ? `Resultados para “${query.q}”` : "Todas as notícias";
  return (
    <>
      <form action="/busca" className="mb-8 flex max-w-xl gap-2" role="search">
        <input name="q" defaultValue={query.q} placeholder="Buscar por título ou resumo…" className="input" aria-label="Termo de busca" />
        <button className="btn-primary" type="submit">Buscar</button>
      </form>
      <ArticleList title={title} subtitle={`${meta.total} notícia(s)`} items={items} meta={meta} basePath="/busca" params={{ q: query.q }} />
    </>
  );
}
