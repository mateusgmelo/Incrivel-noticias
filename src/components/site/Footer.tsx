import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="headline text-xl font-bold text-ink"><span className="text-brand">Incrível</span> Notícias</p>
          <p className="mt-2">Projeto de demonstração. Conteúdo próprio é fictício; manchetes agregadas sempre levam à fonte original.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Navegação</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/busca" className="hover:text-ink">Buscar</Link></li>
            <li><Link href="/admin" className="hover:text-ink">Área do jornalista</Link></li>
            <li><a href="/feed.xml" className="hover:text-ink">Feed RSS</a></li>
            <li><a href="/api/health" className="hover:text-ink">Status da API</a></li>
          </ul>
        </div>
        <p className="sm:text-right">© {new Date().getFullYear()} Incrível Notícias</p>
      </div>
    </footer>
  );
}
