import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { auditService } from "@/server/modules/audit/audit.service";

export default async function AuditPage() {
  await requireUser("ADMIN");
  const logs = await auditService.recent(100);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted">Últimas 100 ações registradas no sistema.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3">Quando</th><th className="px-4 py-3">Quem</th><th className="px-4 py-3">Ação</th><th className="px-4 py-3">Detalhes</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-2.5">{l.actorName ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{l.action}</td>
                <td className="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-muted">{l.meta ? JSON.stringify(l.meta) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
