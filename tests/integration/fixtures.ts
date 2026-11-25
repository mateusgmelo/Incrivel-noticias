import { sql } from "drizzle-orm";
import { hashPassword } from "@/server/core/auth/password";
import type { Actor } from "@/server/core/auth/rbac";
import { db } from "@/server/db/client";
import { categories, users } from "@/server/db/schema";

export const PASSWORD = "Senha@Teste123";

/** Zera o banco preservando o schema (ordem resolvida pelo CASCADE). */
export async function resetDatabase() {
  await db().execute(
    sql`TRUNCATE article_tags, tags, audit_logs, articles, categories, users, rate_limits RESTART IDENTITY CASCADE`,
  );
}

async function createUser(name: string, role: Actor["role"]): Promise<Actor> {
  const email = `${role.toLowerCase()}@teste.dev`;
  const [u] = await db()
    .insert(users)
    .values({ name, email, role, passwordHash: await hashPassword(PASSWORD) })
    .returning();
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

/** Cenário base: um usuário por nível da hierarquia + duas categorias. */
export async function seedBase() {
  await resetDatabase();
  const [reporter, editor, admin] = [
    await createUser("Rita Repórter", "REPORTER"),
    await createUser("Edu Editor", "EDITOR"),
    await createUser("Ana Admin", "ADMIN"),
  ];
  const [politica, esportes] = await db()
    .insert(categories)
    .values([
      { name: "Política", slug: "politica" },
      { name: "Esportes", slug: "esportes" },
    ])
    .returning();
  return { reporter, editor, admin, politica, esportes };
}

export const articleInput = (categoryId: string, overrides: Record<string, unknown> = {}) => ({
  title: "Câmara aprova novo plano de mobilidade urbana",
  excerpt: "Projeto prevê corredores exclusivos de ônibus e 40 km de ciclovias até 2028.",
  body: "Primeiro parágrafo da matéria com conteúdo suficiente.\n\nSegundo parágrafo com mais detalhes sobre o tema.",
  categoryId,
  ...overrides,
});
