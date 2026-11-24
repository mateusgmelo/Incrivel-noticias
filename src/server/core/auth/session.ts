/**
 * Resolve o usuário da requisição atual (Server Components e Route Handlers).
 *
 * O JWT prova identidade, mas papel e status "ativo" são relidos do banco:
 * se um admin rebaixa ou desativa alguém, o efeito é imediato — não espera o token expirar.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { usersRepository } from "@/server/modules/users/user.repository";
import type { Role } from "@/server/db/schema";
import { type Actor, hasRole } from "./rbac";
import { SESSION_COOKIE, verifySession } from "./token";

export const getCurrentUser = cache(async (): Promise<Actor | null> => {
  const store = await cookies();
  const claims = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!claims) return null;

  const user = await usersRepository.findById(claims.sub);
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

/** Para páginas do painel: redireciona em vez de lançar erro. */
export async function requireUser(minimum: Role = "REPORTER"): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!hasRole(user, minimum)) redirect("/admin?erro=permissao");
  return user;
}
