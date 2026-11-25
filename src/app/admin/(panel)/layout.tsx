import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { NavLink } from "@/components/admin/NavLink";
import { can, ROLE_LABEL } from "@/server/core/auth/rbac";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // O menu é montado a partir das MESMAS permissões que a API aplica.
  const nav = [
    { href: "/admin", label: "Painel", show: true },
    { href: "/admin/artigos", label: can.viewAllArticles(user) ? "Matérias" : "Minhas matérias", show: true },
    { href: "/admin/categorias", label: "Categorias", show: can.manageCategories(user) },
    { href: "/admin/usuarios", label: "Usuários", show: can.manageUsers(user) },
    { href: "/admin/auditoria", label: "Auditoria", show: can.viewAudit(user) },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="headline text-xl font-bold">
              <span className="text-brand">Incrível</span> <span className="text-sm font-sans font-semibold uppercase tracking-wider text-muted">Redação</span>
            </Link>
            <nav className="flex gap-1 overflow-x-auto text-sm">
              {nav.map((i) => <NavLink key={i.href} href={i.href}>{i.label}</NavLink>)}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="text-muted hover:text-ink">Ver site ↗</Link>
            <span className="hidden text-right sm:block">
              <span className="block font-medium leading-tight">{user.name}</span>
              <span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
