import Parser from "rss-parser";
import { and, asc, eq } from "drizzle-orm";
import { can, type Actor } from "@/server/core/auth/rbac";
import { ForbiddenError } from "@/server/core/http/errors";
import { randomSuffix, slugify } from "@/server/core/utils/slug";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { auditService } from "@/server/modules/audit/audit.service";
import { articlesRepository } from "@/server/modules/articles/article.repository";
import { categoriesRepository } from "@/server/modules/categories/category.repository";
import { mapFeedItem, type FeedItem } from "./ingest.mapper";
import { feedSources, IMPORT_CATEGORY, type FeedSource } from "./ingest.sources";

export type SourceResult = { source: string; fetched: number; created: number; skipped: number; error?: string };

const parser: Parser<object, FeedItem> = new Parser({
  timeout: 8_000,
  headers: { "User-Agent": "IncrivelNoticiasBot/1.0 (agregador de manchetes)" },
  customFields: { item: [["media:content", "media"]] },
});

async function importCategoryId(): Promise<string> {
  const existing = await categoriesRepository.findBySlug(IMPORT_CATEGORY.slug);
  if (existing) return existing.id;
  const created = await categoriesRepository.insert({
    ...IMPORT_CATEGORY,
    description: "Manchetes agregadas de outros portais, com link para a matéria original.",
  });
  return created.id;
}

async function ingestSource(source: FeedSource, ctx: { authorId: string; categoryId: string; limit: number }): Promise<SourceResult> {
  const result: SourceResult = { source: source.name, fetched: 0, created: 0, skipped: 0 };
  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items ?? []).slice(0, ctx.limit);
    result.fetched = items.length;

    for (const raw of items) {
      const item = mapFeedItem(raw, source.name);
      if (!item) {
        result.skipped++;
        continue;
      }
      // Idempotente: ON CONFLICT (source_url) DO NOTHING — rodar 10x não duplica nada.
      const inserted = await articlesRepository.insertIfNewSource({
        ...item,
        body: item.excerpt,
        slug: `${slugify(item.title, 160)}-${randomSuffix()}`,
        status: "IN_REVIEW", // passa por um editor antes de ir ao ar
        source: "IMPORTED",
        authorId: ctx.authorId,
        categoryId: ctx.categoryId,
      });
      if (inserted) result.created++;
      else result.skipped++;
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Falha desconhecida";
  }
  return result;
}

export const ingestService = {
  /** Disparo manual pelo painel. */
  async run(actor: Actor, opts: { limitPerSource?: number } = {}) {
    if (!can.runIngest(actor)) throw new ForbiddenError();
    return this.execute(actor.id, opts.limitPerSource ?? 10);
  },

  /** Disparo pelo cron: atribui a importação ao primeiro admin ativo. */
  async runAsSystem() {
    const [admin] = await db()
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "ADMIN"), eq(users.active, true)))
      .orderBy(asc(users.createdAt))
      .limit(1);
    if (!admin) throw new Error("Nenhum administrador ativo para atribuir a importação");
    return this.execute(admin.id, 10);
  },

  async execute(authorId: string, limit: number) {
    const categoryId = await importCategoryId();
    // Fontes em paralelo; a falha de uma não derruba as outras.
    const results = await Promise.all(feedSources().map((s) => ingestSource(s, { authorId, categoryId, limit })));
    const summary = {
      created: results.reduce((n, r) => n + r.created, 0),
      skipped: results.reduce((n, r) => n + r.skipped, 0),
      failedSources: results.filter((r) => r.error).length,
      results,
    };
    await auditService.record({ actorId: authorId, action: "ingest.run", entity: "ingest", meta: { created: summary.created, skipped: summary.skipped, failedSources: summary.failedSources } });
    return summary;
  },
};
