"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";

type Category = { id: string; name: string; slug: string; description: string | null; publishedCount: number };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEdit(c: Category | null) {
    setEditing(c);
    setName(c?.name ?? "");
    setDescription(c?.description ?? "");
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = { name, description: description || null };
      if (editing) await api(`/api/admin/categories/${editing.id}`, { method: "PATCH", body });
      else await api("/api/admin/categories", { body });
      startEdit(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha");
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="overflow-hidden rounded-xl border border-line bg-white lg:col-span-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Publicadas</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{c.slug}</td>
                <td className="px-4 py-3">{c.publishedCount}</td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button className="text-sm font-medium hover:text-brand" onClick={() => startEdit(c)}>Editar</button>
                  <button className="text-sm font-medium text-red-700 hover:underline" onClick={() => remove(c)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={save} className="h-fit space-y-4 rounded-xl border border-line bg-white p-5">
        <h2 className="font-semibold">{editing ? `Editar "${editing.name}"` : "Nova categoria"}</h2>
        <label className="block text-sm font-medium">
          Nome
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </label>
        <label className="block text-sm font-medium">
          Descrição
          <textarea className="input mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-primary" type="submit">{editing ? "Salvar" : "Criar"}</button>
          {editing && <button type="button" className="btn-ghost" onClick={() => startEdit(null)}>Cancelar</button>}
        </div>
      </form>
    </div>
  );
}
