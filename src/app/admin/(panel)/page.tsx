import Link from "next/link";
import { IngestButton } from "@/components/admin/IngestButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, STATUS_LABEL } from "@/lib/format";
import { can } from "@/server/core/auth/rbac";
import { requireUser } from "@/lib/auth";
import { articlesService } from "@/server/modules/articles/article.service";
import type { ArticleStatus } from "@/server/db/schema";

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const { erro } = await searchParams;
  const [stats, review, recent] = await Promise.all([
    articlesService.stats(user),
    articlesService.adminList(user, { status: "IN_REVIEW", page: 1, pageSize: 6 }),
    articlesService.adminList(user, { page: 1, pageSize: 6 }),
  ]);

  return (
    <div className="space-y-8">
      {erro === "permissao" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seu perfil não tem acesso àquela área.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">{can.viewAllArticles(user) ? "Visão geral da redação." : "Visão geral das suas matérias."}</p>
        </div>
        <div className="flex gap-2">
          {can.runIngest(user) && <IngestButton />}
          <Link href="/admin/artigos/novo" className="btn-brand">+ Nova matéria</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(Object.keys(stats) as ArticleStatus[]).map((s) => (
          <Link key={s} href={`/admin/artigos?status=${s}`} className="rounded-xl border border-line bg-white p-5 hover:border-ink">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{STATUS_LABEL[s]}</p>
            <p className="mt-2 text-3xl font-bold">{stats[s]}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Aguardando revisão" empty="Nada aguardando revisão." items={review.items} />
        <Panel title="Atualizadas recentemente" empty="Nenhuma matéria ainda." items={recent.items} />
      </div>
    </div>
  );
}

function Panel({ title, items, empty }: { title: string; empty: string; items: Awaited<ReturnType<typeof articlesService.adminList>>["items"] }) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <Link href={`/admin/artigos/${a.id}`} className="block truncate font-medium hover:text-brand">{a.title}</Link>
                <p className="text-xs text-muted">{a.source === "IMPORTED" ? `Importada de ${a.sourceName}` : a.authorName} · {formatDateTime(a.updatedAt)}</p>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
