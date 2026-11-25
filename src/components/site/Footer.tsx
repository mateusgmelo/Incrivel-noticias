import Link from "next/link";
import { LogoMark } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="headline flex items-center gap-2 text-xl font-bold text-ink"><LogoMark size={28} /><span><span className="text-brand">Incrível</span> Notícias</span></p>
          <p className="mt-2">Notícias da Agência Brasil reproduzidas conforme sua política de reprodução, com crédito e link para o original. Manchetes de outros portais levam à fonte.</p>
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
