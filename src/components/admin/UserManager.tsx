"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, fieldErrors } from "@/lib/api-client";

type Role = "REPORTER" | "EDITOR" | "ADMIN";
type User = { id: string; name: string; email: string; role: Role; active: boolean; createdAt: string };

const ROLE_LABEL: Record<Role, string> = { REPORTER: "Repórter", EDITOR: "Editor", ADMIN: "Administrador" };
const ROLE_HELP: Record<Role, string> = {
  REPORTER: "Escreve rascunhos e envia para revisão.",
  EDITOR: "Revisa, publica, arquiva, gerencia categorias e importa RSS.",
  ADMIN: "Tudo do editor + gestão de usuários e auditoria.",
};

export function UserManager({ users, meId }: { users: User[]; meId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "REPORTER" as Role });

  async function patch(id: string, body: Partial<Pick<User, "role" | "active">>) {
    setError(null);
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", body });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha");
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrors({});
    try {
      await api("/api/admin/users", { body: form });
      setForm({ name: "", email: "", password: "", role: "REPORTER" });
      router.refresh();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err instanceof Error ? err.message : "Falha");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Papel</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isMe = u.id === meId;
                return (
                  <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name} {isMe && <span className="text-xs text-muted">(você)</span>}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="input w-auto py-1"
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => patch(u.id, { role: e.target.value as Role })}
                        aria-label={`Papel de ${u.name}`}
                      >
                        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={isMe}
                        onClick={() => patch(u.id, { active: !u.active })}
                        className={u.active ? "btn-ghost py-1" : "btn-primary py-1"}
                      >
                        {u.active ? "Desativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(ROLE_HELP) as Role[]).map((r) => (
            <div key={r} className="rounded-lg border border-line bg-white p-3 text-xs">
              <p className="font-semibold">{ROLE_LABEL[r]}</p>
              <p className="mt-1 text-muted">{ROLE_HELP[r]}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={create} className="h-fit space-y-4 rounded-xl border border-line bg-white p-5">
        <h2 className="font-semibold">Novo usuário</h2>
        {(["name", "email", "password"] as const).map((f) => (
          <label key={f} className="block text-sm font-medium">
            {{ name: "Nome", email: "E-mail", password: "Senha inicial" }[f]}
            <input
              className="input mt-1"
              type={f === "password" ? "password" : f === "email" ? "email" : "text"}
              value={form[f]}
              onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))}
              required
            />
            {errors[f] && <span className="mt-1 block text-xs text-red-600">{errors[f]}</span>}
          </label>
        ))}
        <label className="block text-sm font-medium">
          Papel
          <select className="input mt-1" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
        <button className="btn-primary w-full" type="submit">Criar usuário</button>
      </form>
    </div>
  );
}
