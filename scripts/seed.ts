/**
 * Cria a estrutura mínima: os 3 usuários de demonstração (um por papel) e as editorias.
 * Não há matérias inventadas: o conteúdo vem do agregador (npm run ingest).
 * Idempotente: pode rodar várias vezes.
 *   npm run db:seed
 */
import "./load-env";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { pgConfig } from "../src/server/db/ssl";
import { EDITORIA_CATEGORIES, IMPORT_CATEGORY } from "../src/server/modules/ingest/ingest.sources";

async function main() {
  const pool = new Pool({ ...pgConfig((process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!), max: 1 });
  const db = drizzle(pool, { schema });
  const password = process.env.SEED_DEFAULT_PASSWORD ?? "Incrivel@2026";
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Usuários — um por nível da hierarquia
  const seedUsers = {
    admin: { name: "Ana Administradora", email: "admin@incrivelnoticias.com", role: "ADMIN" as const },
    editor: { name: "Eduardo Editor", email: "editor@incrivelnoticias.com", role: "EDITOR" as const },
    reporter: { name: "Rita Repórter", email: "reporter@incrivelnoticias.com", role: "REPORTER" as const },
  };
  const ids: Record<keyof typeof seedUsers, string> = { admin: "", editor: "", reporter: "" };
  for (const [key, u] of Object.entries(seedUsers) as [keyof typeof seedUsers, (typeof seedUsers)["admin"]][]) {
    const [row] = await db
      .insert(schema.users)
      .values({ ...u, passwordHash })
      .onConflictDoUpdate({ target: schema.users.email, set: { name: u.name, role: u.role, active: true } })
      .returning({ id: schema.users.id });
    ids[key] = row.id;
  }

  // 2. Editorias (as mesmas para onde o agregador distribui as matérias)
  const SEED_CATEGORIES = [
    ...Object.values(EDITORIA_CATEGORIES),
    { ...IMPORT_CATEGORY, description: "Manchetes de outros portais, com link para a matéria original." },
  ];
  for (const c of SEED_CATEGORIES) {
    await db
      .insert(schema.categories)
      .values(c)
      .onConflictDoUpdate({ target: schema.categories.slug, set: { name: c.name, description: c.description } });
  }

  await pool.end();
  console.log(`✔ seed concluído: 3 usuários e ${SEED_CATEGORIES.length} editorias`);
  console.log("  matérias reais: npm run ingest (ou \"Importar notícias\" no painel)");
  console.log(`  logins: admin@ / editor@ / reporter@incrivelnoticias.com — senha: ${password}`);
}

main().catch((err) => {
  console.error("✖ falha no seed:", err);
  process.exit(1);
});
