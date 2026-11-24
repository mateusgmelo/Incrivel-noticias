/**
 * Popula o banco com dados de demonstração. Idempotente: pode rodar várias vezes.
 *   npm run db:seed
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { SEED_ARTICLES, SEED_CATEGORIES } from "./seed-data";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL, max: 1 });
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

  // 2. Categorias
  const categoryIds = new Map<string, string>();
  for (const c of SEED_CATEGORIES) {
    const [row] = await db
      .insert(schema.categories)
      .values(c)
      .onConflictDoUpdate({ target: schema.categories.slug, set: { name: c.name, description: c.description } })
      .returning({ id: schema.categories.id });
    categoryIds.set(c.slug, row.id);
  }

  // 3. Artigos — datas espalhadas nos últimos dias, mais recentes primeiro
  let created = 0;
  const now = Date.now();
  for (const [i, a] of SEED_ARTICLES.entries()) {
    const status = a.status ?? "PUBLISHED";
    const slug = slugify(a.title);
    const publishedAt = status === "PUBLISHED" || status === "ARCHIVED" ? new Date(now - i * 7 * 3_600_000) : null;

    const [row] = await db
      .insert(schema.articles)
      .values({
        title: a.title,
        slug,
        excerpt: a.excerpt,
        body: a.paragraphs.join("\n\n"),
        coverImageUrl: `https://picsum.photos/seed/${slug.slice(0, 40)}/1200/675`,
        status,
        featured: !!a.featured,
        publishedAt,
        views: status === "PUBLISHED" ? ((i * 7919) % 2400) + 50 : 0,
        authorId: ids[a.by ?? "reporter"],
        categoryId: categoryIds.get(a.category)!,
      })
      .onConflictDoNothing({ target: schema.articles.slug })
      .returning({ id: schema.articles.id });
    if (!row) continue;
    created++;

    for (const name of a.tags ?? []) {
      const tagSlug = slugify(name);
      await db.insert(schema.tags).values({ name, slug: tagSlug }).onConflictDoNothing();
      const [tag] = await db.select({ id: schema.tags.id }).from(schema.tags).where(eq(schema.tags.slug, tagSlug));
      await db.insert(schema.articleTags).values({ articleId: row.id, tagId: tag.id }).onConflictDoNothing();
    }
  }

  await pool.end();
  console.log(`✔ seed concluído: 3 usuários, ${SEED_CATEGORIES.length} categorias, ${created} artigos novos`);
  console.log(`  logins: admin@ / editor@ / reporter@incrivelnoticias.com — senha: ${password}`);
}

main().catch((err) => {
  console.error("✖ falha no seed:", err);
  process.exit(1);
});
