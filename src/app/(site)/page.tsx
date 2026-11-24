import Link from "next/link";
import { ArticleCard } from "@/components/site/ArticleCard";
import { articlesService } from "@/server/modules/articles/article.service";

export default async function HomePage() {
  const { featured, latest, mostRead } = await articlesService.homepage();
  const [hero, ...secondary] = featured.length ? featured : latest.slice(0, 1);
  const rest = featured.length ? latest : latest.slice(1);

  if (!hero) {
    return <p className="py-20 text-center text-muted">Nenhuma notícia publicada ainda.</p>;
  }

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ArticleCard article={hero} variant="hero" />
        </div>
        <div className="space-y-6">
          {secondary.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-5 border-b-2 border-ink pb-2 text-sm font-bold uppercase tracking-wider">Últimas notícias</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {rest.slice(0, 10).map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
          <div className="mt-8 text-center">
            <Link href="/busca" className="btn-ghost">Ver todas as notícias</Link>
          </div>
        </section>

        <aside>
          <h2 className="mb-5 border-b-2 border-brand pb-2 text-sm font-bold uppercase tracking-wider">Mais lidas</h2>
          <ol className="space-y-4">
            {mostRead.map((a, i) => (
              <li key={a.id} className="flex gap-3">
                <span className="headline text-3xl font-bold text-brand/70">{i + 1}</span>
                <ArticleCard article={a} variant="compact" />
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
