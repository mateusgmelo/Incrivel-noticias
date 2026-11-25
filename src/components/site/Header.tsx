import Link from "next/link";
import { publicContent } from "@/server/modules/articles/article.public";
import { LogoMark } from "@/components/shared/Logo";

export async function Header() {
  // Menu só com editorias que têm matéria no ar (sem links para páginas vazias).
  const categories = (await publicContent.categories()).filter((c) => c.publishedCount > 0);
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Recife",
  }).format(new Date());
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="border-b border-line bg-white">
      <div className="bg-ink text-xs text-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
          <span>{todayLabel}</span>
          <Link href="/admin" className="hover:text-white">Área do jornalista</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="headline flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <LogoMark size={44} />
          <span><span className="text-brand">Incrível</span> Notícias</span>
        </Link>
        <form action="/busca" className="flex w-full max-w-xs gap-2" role="search">
          <input name="q" placeholder="Buscar notícias…" aria-label="Buscar" className="input" />
          <button className="btn-primary" type="submit">Buscar</button>
        </form>
      </div>
      <nav className="border-t border-line" aria-label="Editorias">
        <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2.5 text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
          <li><Link href="/" className="hover:text-brand">Início</Link></li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/categoria/${c.slug}`} className="hover:text-brand">{c.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
