/**
 * Incrível Notícias — modelo de dados (Drizzle ORM / PostgreSQL)
 *
 * Fonte única da verdade do banco. As migrations SQL em /drizzle são geradas
 * a partir deste arquivo com `npm run db:generate`.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** Hierarquia de acesso: REPORTER < EDITOR < ADMIN */
export const roleEnum = pgEnum("role", ["REPORTER", "EDITOR", "ADMIN"]);

/** Fluxo editorial: DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED */
export const articleStatusEnum = pgEnum("article_status", [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
]);

export const articleSourceEnum = pgEnum("article_source", ["ORIGINAL", "IMPORTED"]);

/** Tipo nativo do Postgres para busca textual. */
const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

/**
 * Vetor de busca gerado pelo próprio banco (sempre consistente, sem trigger):
 * título pesa mais (A) que resumo (B) e corpo (C). `pt_unaccent` é criada na migration.
 */
const searchVectorExpr = sql`
  setweight(to_tsvector('portuguese', pt_unaccent(coalesce(title, ''))), 'A') ||
  setweight(to_tsvector('portuguese', pt_unaccent(coalesce(excerpt, ''))), 'B') ||
  setweight(to_tsvector('portuguese', pt_unaccent(coalesce(body, ''))), 'C')`;

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("REPORTER"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  ...timestamps,
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull().unique(),
    excerpt: varchar("excerpt", { length: 400 }).notNull(),
    body: text("body").notNull(),
    coverImageUrl: text("cover_image_url"),
    status: articleStatusEnum("status").notNull().default("DRAFT"),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    views: integer("views").notNull().default(0),

    source: articleSourceEnum("source").notNull().default("ORIGINAL"),
    sourceName: varchar("source_name", { length: 120 }),
    /** Link da matéria original (só importadas). Único => deduplicação na ingestão. */
    sourceUrl: text("source_url").unique(),
    /** Crédito do autor na fonte (ex.: "Fulano - Repórter da Agência Brasil"). */
    sourceAuthor: varchar("source_author", { length: 200 }),
    /** true = texto integral republicado sob licença da fonte; false = só manchete + link. */
    fullText: boolean("full_text").notNull().default(false),

    searchVector: tsvector("search_vector").generatedAlwaysAs(searchVectorExpr),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => [
    // Home e listagens: "publicadas, mais recentes primeiro"
    index("articles_status_published_at_idx").on(t.status, t.publishedAt.desc()),
    // Página de categoria
    index("articles_category_status_idx").on(t.categoryId, t.status),
    // "Meus artigos" no painel
    index("articles_author_idx").on(t.authorId),
    // Busca full-text
    index("articles_search_idx").using("gin", t.searchVector),
  ],
);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 60 }).notNull().unique(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
});

/** Tabela de junção N:N entre artigos e tags. */
export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tagId] }), index("article_tags_tag_idx").on(t.tagId)],
);

/** Trilha de auditoria: quem fez o quê, em qual entidade, quando. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 60 }).notNull(),
    entity: varchar("entity", { length: 40 }).notNull(),
    entityId: uuid("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
    index("audit_logs_created_at_idx").on(t.createdAt.desc()),
  ],
);

// ---------- Relações (para queries relacionais tipadas) ----------

export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, { fields: [articles.authorId], references: [users.id] }),
  category: one(categories, { fields: [articles.categoryId], references: [categories.id] }),
  tags: many(articleTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articles: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, { fields: [articleTags.articleId], references: [articles.id] }),
  tag: one(tags, { fields: [articleTags.tagId], references: [tags.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

// ---------- Tipos derivados ----------
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type ArticleStatus = (typeof articleStatusEnum.enumValues)[number];
