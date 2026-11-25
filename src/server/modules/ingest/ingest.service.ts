import Parser from "rss-parser";
import { and, asc, eq } from "drizzle-orm";
import { can, type Actor } from "@/server/core/auth/rbac";
import { ForbiddenError } from "@/server/core/http/errors";
import { randomSuffix, slugify } from "@/server/core/utils/slug";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { invalidateContent } from "@/server/core/cache/content-cache";
import { auditService } from "@/server/modules/audit/audit.service";
import { articlesRepository } from "@/server/modules/articles/article.repository";
import { categoriesRepository } from "@/server/modules/categories/category.repository";
import { cleanCredit, htmlToBody, isOwnStaff, isReproductionForbidden } from "./ingest.fulltext";
import { mapFeedItem, type FeedItem } from "./ingest.mapper";
import { categoryForUrl, feedSources, IMPORT_CATEGORY, type FeedSource } from "./ingest.sources";

export type SourceResult = {
  source: string;
  fetched: number;
  created: number;
  published: number;
  skipped: number;
  /** Itens fora da licença (agência parceira, "proibida a reprodução") — não importados. */
  blocked: number;
  error?: string;
};

type RawItem = FeedItem & { descriptionHtml?: string };

const parser: Parser<object, RawItem> = new Parser({
  timeout: 8_000,
  headers: { "User-Agent": "IncrivelNoticiasBot/1.0 (agregador de noticias)" },
  customFields: {
    item: [
      ["media:content", "media"],
      ["imagem-destaque", "imagemDestaque"],
      ["description", "descriptionHtml"],
      ["dc:creator", "creator"],
    ],
  },
});

/** Resolve categorias uma vez por execução (fontes rodam em paralelo). */
function categoryResolver() {
  const cache = new Map<string, Promise<string>>();
  return (cat: { name: string; slug: string; description?: string }) => {
    if (!cache.has(cat.slug)) cache.set(cat.slug, categoriesRepository.ensure(cat));
    return cache.get(cat.slug)!;
  };
}

type Ctx = { authorId: string; limit: number; category: ReturnType<typeof categoryResolver> };

async function ingestSource(source: FeedSource, ctx: Ctx): Promise<SourceResult> {
  const result: SourceResult = { source: source.name, fetched: 0, created: 0, published: 0, skipped: 0, blocked: 0 };
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

      let body = item.excerpt;
      let fullText = false;
      let categoryId: string;

      if (source.mode === "full") {
        const html = raw.descriptionHtml ?? raw.content ?? "";
        // Licença: só texto da própria agência e sem aviso de reprodução proibida.
        if (isReproductionForbidden(html) || !isOwnStaff(raw.creator, source.name)) {
          result.blocked++;
          continue;
        }
        const extracted = htmlToBody(html);
        if (extracted) {
          body = extracted;
          fullText = true;
        }
        categoryId = await ctx.category(categoryForUrl(item.sourceUrl));
      } else {
        categoryId = await ctx.category({ ...IMPORT_CATEGORY, description: "Manchetes de outros portais, com link para a matéria original." });
      }

      // Publica direto só se a fonte é confiável E o texto integral foi extraído; senão, fila do editor.
      const publish = source.autoPublish && fullText;

      // Idempotente: ON CONFLICT (source_url) DO NOTHING — rodar 10x não duplica nada.
      const inserted = await articlesRepository.insertIfNewSource({
        ...item,
        body,
        fullText,
        sourceAuthor: cleanCredit(raw.creator),
        slug: `${slugify(item.title, 160)}-${randomSuffix()}`,
        status: publish ? "PUBLISHED" : "IN_REVIEW",
        source: "IMPORTED",
        authorId: ctx.authorId,
        categoryId,
      });
      if (!inserted) result.skipped++;
      else {
        result.created++;
        if (publish) result.published++;
      }
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
    const category = categoryResolver();
    // Fontes em paralelo; a falha de uma não derruba as outras.
    const results = await Promise.all(feedSources().map((s) => ingestSource(s, { authorId, limit, category })));
    const sum = (k: "created" | "published" | "skipped" | "blocked") => results.reduce((n, r) => n + r[k], 0);
    const summary = {
      created: sum("created"),
      published: sum("published"),
      skipped: sum("skipped"),
      blocked: sum("blocked"),
      failedSources: results.filter((r) => r.error).length,
      results,
    };
    if (summary.created) invalidateContent();
    await auditService.record({ actorId: authorId, action: "ingest.run", entity: "ingest", meta: { created: summary.created, published: summary.published, skipped: summary.skipped, blocked: summary.blocked, failedSources: summary.failedSources } });
    return summary;
  },
};
