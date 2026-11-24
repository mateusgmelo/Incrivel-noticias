import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/site/Pagination";
import { formatDateTime, STATUS_LABEL } from "@/lib/format";
import { can } from "@/server/core/auth/rbac";
import { requireUser } from "@/server/core/auth/session";
import { AdminListQuery } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

type Props = { searchParams: Promise<Record<string, string>> };

export default async function ArticlesAdminPage({ searchParams }: Props) {
  const user = await requireUser();
  const sp = await searchParams;
  const parsed = AdminListQuery.safeParse(sp);
  const query = parsed.success ? parsed.data : AdminListQuery.parse({});
  const { items, meta } = await articlesService.adminList(user, query);

  const tabs: { label: string; status?: string }[] = [
    { label: "Todas" },
    ...(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const).map((s) => ({ label: STATUS_LABEL[s], status: s })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{can.viewAllArticles(user) ? "Matérias" : "Minhas matérias"}</h1>
        <Link href="/admin/artigos/novo" className="btn-brand">+ Nova matéria</Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1 text-sm">
          {tabs.map((t) => {
            const active = (query.status ?? undefined) === t.status;
            const href = t.status ? `/admin/artigos?status=${t.status}` : "/admin/artigos";
            return (
              <Link key={t.label} href={href} className={`whitespace-nowrap rounded-md px-3 py-1.5 ${active ? "bg-ink text-white" : "hover:bg-paper"}`}>
                {t.label}
              </Link>
            );
          })}
        </div>
        <form className="flex gap-2">
          {query.status && <input type="hidden" name="status" value={query.status} />}
          <input name="q" defaultValue={query.q} placeholder="Buscar título…" className="input w-56" />
          <button className="btn-ghost">Filtrar</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Editoria</th>
              <th className="px-4 py-3">Autor / Fonte</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Atualizada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhuma matéria encontrada.</td></tr>
            )}
            {items.map((a) => (
              <tr key={a.id} className="hover:bg-paper/60">
                <td className="max-w-md px-4 py-3">
                  <Link href={`/admin/artigos/${a.id}`} className="font-medium hover:text-brand">{a.title}</Link>
                  {a.featured && <span className="ml-2 text-xs font-semibold text-brand">★ destaque</span>}
                </td>
                <td className="px-4 py-3 text-muted">{a.categoryName}</td>
                <td className="px-4 py-3 text-muted">{a.source === "IMPORTED" ? `↳ ${a.sourceName}` : a.authorName}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-right text-muted">{formatDateTime(a.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} basePath="/admin/artigos" params={{ status: query.status, q: query.q }} />
    </div>
  );
}
