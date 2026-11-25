/**
 * Adaptador de autenticação para as PÁGINAS do painel (camada de UI).
 * O back-end só sabe resolver o usuário; redirecionar e memoizar por renderização
 * são preocupações do front-end, por isso ficam aqui e não em src/server.
 */
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/server/core/auth/session";
import { type Actor, hasRole } from "@/server/core/auth/rbac";
import type { Role } from "@/server/db/schema";

/** Uma consulta por renderização, mesmo que layout e página peçam o usuário. */
export const currentUser = cache(getCurrentUser);

/** Sem sessão → login; sem papel suficiente → painel com aviso. */
export async function requireUser(minimum: Role = "REPORTER"): Promise<Actor> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!hasRole(user, minimum)) redirect("/admin?erro=permissao");
  return user;
}
