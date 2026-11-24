"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";

const LABEL: Record<string, { text: string; className: string }> = {
  submit: { text: "Enviar para revisão", className: "btn-primary" },
  publish: { text: "Publicar", className: "btn-brand" },
  reject: { text: "Devolver ao autor", className: "btn-ghost" },
  archive: { text: "Arquivar", className: "btn-ghost" },
};

/** Botões vêm de `availableActions` da policy: a UI só oferece o que a API vai aceitar. */
export function ArticleActions({ id, actions, canDelete }: { id: string; actions: string[]; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string) {
    setBusy(action);
    setError(null);
    try {
      await api(`/api/admin/articles/${id}/${action}`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Excluir esta matéria definitivamente?")) return;
    setBusy("delete");
    try {
      await api(`/api/admin/articles/${id}`, { method: "DELETE" });
      router.push("/admin/artigos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((a) => (
          <button key={a} onClick={() => run(a)} disabled={!!busy} className={LABEL[a]?.className ?? "btn-ghost"}>
            {busy === a ? "…" : LABEL[a]?.text ?? a}
          </button>
        ))}
        {canDelete && (
          <button onClick={remove} disabled={!!busy} className="btn-danger">{busy === "delete" ? "…" : "Excluir"}</button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
