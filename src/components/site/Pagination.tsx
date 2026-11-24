import Link from "next/link";
import type { PageMeta } from "@/server/core/http/responses";

export function Pagination({ meta, basePath, params = {} }: { meta: PageMeta; basePath: string; params?: Record<string, string | undefined> }) {
  if (meta.totalPages <= 1) return null;
  const href = (page: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Paginação">
      {meta.page > 1 ? <Link className="btn-ghost" href={href(meta.page - 1)}>← Anteriores</Link> : <span />}
      <span className="text-muted">Página {meta.page} de {meta.totalPages}</span>
      {meta.page < meta.totalPages ? <Link className="btn-ghost" href={href(meta.page + 1)}>Próximas →</Link> : <span />}
    </nav>
  );
}
