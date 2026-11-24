import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { articles, categories } from "@/server/db/schema";

export const categoriesRepository = {
  list: () => db().select().from(categories).orderBy(asc(categories.name)),

  /** Lista com contagem de artigos publicados (para menu e painel). */
  listWithCounts: () =>
    db()
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        publishedCount: count(articles.id),
      })
      .from(categories)
      .leftJoin(articles, and(eq(articles.categoryId, categories.id), eq(articles.status, "PUBLISHED")))
      .groupBy(categories.id)
      .orderBy(asc(categories.name)),

  findById: async (id: string) => {
    const [row] = await db().select().from(categories).where(eq(categories.id, id)).limit(1);
    return row ?? null;
  },

  findBySlug: async (slug: string) => {
    const [row] = await db().select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return row ?? null;
  },

  insert: async (data: typeof categories.$inferInsert) => {
    const [row] = await db().insert(categories).values(data).returning();
    return row;
  },

  update: async (id: string, data: Partial<typeof categories.$inferInsert>) => {
    const [row] = await db().update(categories).set(data).where(eq(categories.id, id)).returning();
    return row ?? null;
  },

  delete: (id: string) => db().delete(categories).where(eq(categories.id, id)),

  countArticles: async (id: string) => {
    const [row] = await db().select({ n: count() }).from(articles).where(eq(articles.categoryId, id));
    return row?.n ?? 0;
  },
};
