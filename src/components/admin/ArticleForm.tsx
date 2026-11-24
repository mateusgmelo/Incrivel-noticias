"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, fieldErrors } from "@/lib/api-client";

type Values = {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  categoryId: string;
  featured: boolean;
  tags: string;
};

type Props = {
  categories: { id: string; name: string }[];
  canFeature: boolean;
  readOnly?: boolean;
  initial?: Values;
};

export function ArticleForm({ categories, canFeature, readOnly = false, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(
    initial ?? { title: "", excerpt: "", body: "", coverImageUrl: "", categoryId: categories[0]?.id ?? "", featured: false, tags: "" },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    const payload = {
      title: values.title,
      excerpt: values.excerpt,
      body: values.body,
      coverImageUrl: values.coverImageUrl,
      categoryId: values.categoryId,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      ...(canFeature ? { featured: values.featured } : {}),
    };
    try {
      if (initial?.id) {
        await api(`/api/admin/articles/${initial.id}`, { method: "PATCH", body: payload });
        setMessage({ type: "ok", text: "Alterações salvas." });
        router.refresh();
      } else {
        const created = await api<{ id: string }>("/api/admin/articles", { body: payload });
        router.push(`/admin/artigos/${created.id}`);
        router.refresh();
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Falha ao salvar" });
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => errors[k] && <span className="mt-1 block text-xs text-red-600">{errors[k]}</span>;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <fieldset disabled={readOnly} className="space-y-4 rounded-xl border border-line bg-white p-5 lg:col-span-2">
        <label className="block text-sm font-medium">
          Título
          <input className="input mt-1 text-base" value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={200} required />
          {err("title")}
        </label>
        <label className="block text-sm font-medium">
          Resumo (linha fina)
          <textarea className="input mt-1" rows={2} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={400} required />
          <span className="mt-1 block text-right text-xs text-muted">{values.excerpt.length}/400</span>
          {err("excerpt")}
        </label>
        <label className="block text-sm font-medium">
          Corpo da matéria
          <textarea className="input mt-1 font-serif text-base leading-relaxed" rows={16} value={values.body} onChange={(e) => set("body", e.target.value)} required />
          <span className="mt-1 block text-xs text-muted">Separe parágrafos com uma linha em branco.</span>
          {err("body")}
        </label>
      </fieldset>

      <div className="space-y-4">
        <fieldset disabled={readOnly} className="space-y-4 rounded-xl border border-line bg-white p-5">
          <label className="block text-sm font-medium">
            Editoria
            <select className="input mt-1" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err("categoryId")}
          </label>
          <label className="block text-sm font-medium">
            URL da imagem de capa
            <input className="input mt-1" type="url" value={values.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://…" />
            {err("coverImageUrl")}
          </label>
          {values.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.coverImageUrl} alt="Prévia da capa" className="aspect-video w-full rounded-md object-cover" />
          )}
          <label className="block text-sm font-medium">
            Tags <span className="font-normal text-muted">(separadas por vírgula)</span>
            <input className="input mt-1" value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Recife, Mobilidade" />
            {err("tags")}
          </label>
          {canFeature && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
              Destacar na capa
            </label>
          )}
        </fieldset>

        {!readOnly && (
          <div className="space-y-3">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Salvando…" : initial?.id ? "Salvar alterações" : "Criar rascunho"}
            </button>
            {message && (
              <p role="status" className={`rounded-md px-3 py-2 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                {message.text}
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
