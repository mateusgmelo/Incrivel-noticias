/**
 * Acesso a dados de artigos. Só SQL/Drizzle aqui — nenhuma regra de negócio.
 */
import { and, count, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  articles,
  articleTags,
  categories,
  tags,
  users,
  type ArticleStatus,
  type NewArticle,
} from "@/server/db/schema";
import { slugify } from "@/server/core/utils/slug";

/** Projeção usada em cards/listagens (sem o corpo, que é pesado). */
const cardColumns = {
  id: articles.id,
  title: articles.title,
  slug: articles.slug,
  excerpt: articles.excerpt,
  coverImageUrl: articles.coverImageUrl,
  status: articles.status,
  featured: articles.featured,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
  views: articles.views,
  source: articles.source,
  sourceName: articles.sourceName,
  authorId: articles.authorId,
  authorName: users.name,
  categoryId: articles.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
};


export type ListFilter = {
  status?: ArticleStatus;
  categorySlug?: string;
  tagSlug?: string;
  authorId?: string;
  q?: string;
  excludeId?: string;
  featured?: boolean;
};

function buildWhere(f: ListFilter): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.status) conds.push(eq(articles.status, f.status));
  if (f.categorySlug) conds.push(eq(categories.slug, f.categorySlug));
  if (f.authorId) conds.push(eq(articles.authorId, f.authorId));
  if (f.excludeId) conds.push(ne(articles.id, f.excludeId));
  if (f.featured !== undefined) conds.push(eq(articles.featured, f.featured));
  if (f.q) {
    const term = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(articles.title, term), ilike(articles.excerpt, term)));
  }
  if (f.tagSlug) {
    conds.push(
      inArray(
        articles.id,
        db()
          .select({ id: articleTags.articleId })
          .from(articleTags)
          .innerJoin(tags, eq(tags.id, articleTags.tagId))
          .where(eq(tags.slug, f.tagSlug)),
      ),
    );
  }
  return and(...conds);
}

type Order = "recent" | "views" | "updated";

const orderBy = (o: Order) =>
  o === "views"
    ? [desc(articles.views), desc(articles.publishedAt)]
    : o === "updated"
      ? [desc(articles.updatedAt)]
      : [sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt)];

export const articlesRepository = {
  async list(filter: ListFilter, opts: { limit: number; offset?: number; order?: Order }) {
    const where = buildWhere(filter);
    const base = db()
      .select(cardColumns)
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .innerJoin(categories, eq(categories.id, articles.categoryId))
      .where(where)
      .orderBy(...orderBy(opts.order ?? "recent"))
      .limit(opts.limit)
      .offset(opts.offset ?? 0);
    return base;
  },

  async count(filter: ListFilter) {
    const [row] = await db()
      .select({ n: count() })
      .from(articles)
      .innerJoin(categories, eq(categories.id, articles.categoryId))
      .where(buildWhere(filter));
    return row?.n ?? 0;
  },

  async findFull(where: { id?: string; slug?: string }) {
    const cond = where.id ? eq(articles.id, where.id) : eq(articles.slug, where.slug!);
    const [row] = await db()
      .select({ ...cardColumns, body: articles.body, sourceUrl: articles.sourceUrl, createdAt: articles.createdAt })
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .innerJoin(categories, eq(categories.id, articles.categoryId))
      .where(cond)
      .limit(1);
    if (!row) return null;
    const tagRows = await db()
      .select({ name: tags.name, slug: tags.slug })
      .from(articleTags)
      .innerJoin(tags, eq(tags.id, articleTags.tagId))
      .where(eq(articleTags.articleId, row.id));
    return { ...row, tags: tagRows };
  },

  async findRef(id: string) {
    const [row] = await db()
      .select({ id: articles.id, authorId: articles.authorId, status: articles.status, slug: articles.slug, title: articles.title, publishedAt: articles.publishedAt })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    return row ?? null;
  },

  async slugExists(slug: string) {
    const [row] = await db().select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1);
    return !!row;
  },

  async insert(data: NewArticle) {
    const [row] = await db().insert(articles).values(data).returning({ id: articles.id, slug: articles.slug });
    return row;
  },

  /** Inserção idempotente para ingestão: ignora se a sourceUrl já existir. */
  async insertIfNewSource(data: NewArticle) {
    const rows = await db()
      .insert(articles)
      .values(data)
      .onConflictDoNothing({ target: articles.sourceUrl })
      .returning({ id: articles.id });
    return rows[0] ?? null;
  },

  async update(id: string, data: Partial<NewArticle>) {
    const [row] = await db().update(articles).set(data).where(eq(articles.id, id)).returning({ id: articles.id, slug: articles.slug, status: articles.status });
    return row ?? null;
  },

  delete: (id: string) => db().delete(articles).where(eq(articles.id, id)),

  incrementViews: (slug: string) =>
    db()
      .update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(and(eq(articles.slug, slug), eq(articles.status, "PUBLISHED"))),

  async countByStatus(authorId?: string) {
    const rows = await db()
      .select({ status: articles.status, n: count() })
      .from(articles)
      .where(authorId ? eq(articles.authorId, authorId) : undefined)
      .groupBy(articles.status);
    return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<ArticleStatus, number>>;
  },

  /** Substitui as tags do artigo (cria as que não existem). */
  async setTags(articleId: string, names: string[]) {
    const unique = [...new Map(names.map((n) => [slugify(n, 80), n.trim()])).entries()].filter(([s]) => s);
    await db().transaction(async (tx) => {
      await tx.delete(articleTags).where(eq(articleTags.articleId, articleId));
      if (!unique.length) return;
      await tx
        .insert(tags)
        .values(unique.map(([slug, name]) => ({ slug, name })))
        .onConflictDoNothing();
      const tagRows = await tx.select({ id: tags.id }).from(tags).where(inArray(tags.slug, unique.map(([s]) => s)));
      await tx.insert(articleTags).values(tagRows.map((t) => ({ articleId, tagId: t.id }))).onConflictDoNothing();
    });
  },
};

export type ArticleCard = Awaited<ReturnType<typeof articlesRepository.list>>[number];
export type ArticleFull = NonNullable<Awaited<ReturnType<typeof articlesRepository.findFull>>>;
