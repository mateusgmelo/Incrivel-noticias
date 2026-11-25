"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";

type Result = { created: number; published: number; skipped: number; blocked: number; failedSources: number; results: { source: string; created: number; error?: string }[] };

export function IngestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await api<Result>("/api/admin/ingest", { method: "POST" });
      const failed = r.results.filter((x) => x.error).map((x) => x.source);
      const failedList = [...new Set(failed)];
      setMsg(
        [
          `${r.published} publicada(s) direto (fonte licenciada)`,
          `${r.created - r.published} para revisão`,
          `${r.skipped} já existiam`,
          `${r.blocked} fora da licença`,
          failedList.length ? `falha em: ${failedList.join(", ")}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Falha na importação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={run} disabled={loading} className="btn-ghost" title="Busca notícias nos feeds RSS configurados">
        {loading ? "Importando…" : "↻ Importar notícias (RSS)"}
      </button>
      {msg && <p className="absolute right-0 top-full z-10 mt-2 w-80 rounded-md border border-line bg-white p-3 text-xs shadow">{msg}</p>}
    </div>
  );
}
