/**
 * Resolve o usuário da requisição atual. Usado pelas rotas da API (withRoute) e,
 * via `src/lib/auth.ts`, pelas páginas do painel.
 *
 * O JWT prova identidade, mas papel e status "ativo" são relidos do banco:
 * se um admin rebaixa ou desativa alguém, o efeito é imediato — não espera o token expirar.
 */
import { cookies } from "next/headers";
import { usersRepository } from "@/server/modules/users/user.repository";
import type { Actor } from "./rbac";
import { SESSION_COOKIE, verifySession } from "./token";

export async function getCurrentUser(): Promise<Actor | null> {
  const store = await cookies();
  const claims = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!claims) return null;

  const user = await usersRepository.findById(claims.sub);
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
