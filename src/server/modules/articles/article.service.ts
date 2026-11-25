/**
 * Regras de negócio de artigos. Orquestra policy + repository + auditoria.
 * Não conhece HTTP: lança AppErrors que a camada de rota traduz.
 */
import type { Actor } from "@/server/core/auth/rbac";
import { can } from "@/server/core/auth/rbac";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/core/http/errors";
import { offsetOf, pageMeta, type Pagination } from "@/server/core/http/pagination";
import { randomSuffix, slugify } from "@/server/core/utils/slug";
import { invalidateContent } from "@/server/core/cache/content-cache";
import { auditService } from "@/server/modules/audit/audit.service";
import { categoriesRepository } from "@/server/modules/categories/category.repository";
import { articlePolicy, TRANSITIONS, type ArticleAction } from "./article.policy";
import { articlesRepository, type ListFilter } from "./article.repository";
import type { AdminListQuery, ArticleInput, ArticleUpdateInput, PublicListQuery } from "./article.schema";

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "materia";
  if (!(await articlesRepository.slugExists(base))) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await articlesRepository.slugExists(candidate))) return candidate;
  }
  throw new ConflictError("Não foi possível gerar um slug único");
}

async function ensureCategory(categoryId: string) {
  if (!(await categoriesRepository.findById(categoryId))) {
    throw new ValidationError({ fieldErrors: { categoryId: ["Categoria não existe"] } });
  }
}

async function paginate(filter: ListFilter, p: Pagination) {
  const [items, total] = await Promise.all([
    articlesRepository.list(filter, { limit: p.pageSize, offset: offsetOf(p) }),
    articlesRepository.count(filter),
  ]);
  return { items, meta: pageMeta(p, total) };
}

export const articlesService = {
  // ------------------------------------------------------------------
  // Leitura pública — só PUBLISHED, nunca vaza rascunho.
  // ------------------------------------------------------------------
  listPublished(q: PublicListQuery) {
    return paginate(
      { status: "PUBLISHED", categorySlug: q.category, tagSlug: q.tag, q: q.q },
      q,
    );
  },

  async getPublished(slug: string) {
    const article = await articlesRepository.findFull({ slug });
    if (!article || article.status !== "PUBLISHED") throw new NotFoundError("Matéria", "f");
    return article;
  },

  /** Dados da home em uma chamada: destaque, últimas, mais lidas. */
  async homepage() {
    const [featured, latest, mostRead] = await Promise.all([
      articlesRepository.list({ status: "PUBLISHED", featured: true }, { limit: 3 }),
      articlesRepository.list({ status: "PUBLISHED" }, { limit: 18 }),
      articlesRepository.list({ status: "PUBLISHED" }, { limit: 5, order: "views" }),
    ]);
    const heroIds = new Set(featured.map((a) => a.id));
    return { featured, latest: latest.filter((a) => !heroIds.has(a.id)), mostRead };
  },

  related(article: { id: string; categorySlug: string }, limit = 4) {
    return articlesRepository.list(
      { status: "PUBLISHED", categorySlug: article.categorySlug, excludeId: article.id },
      { limit },
    );
  },

  registerView: (slug: string) => articlesRepository.incrementViews(slug),

  // ------------------------------------------------------------------
  // Painel administrativo
  // ------------------------------------------------------------------
  adminList(actor: Actor, q: AdminListQuery) {
    // Repórter enxerga apenas as próprias matérias.
    const authorId = can.viewAllArticles(actor) ? undefined : actor.id;
    return paginate({ status: q.status, q: q.q, authorId }, q);
  },

  async getForAdmin(actor: Actor, id: string) {
    const article = await articlesRepository.findFull({ id });
    if (!article) throw new NotFoundError("Matéria", "f");
    if (!articlePolicy.canView(actor, article)) throw new ForbiddenError();
    return {
      ...article,
      permissions: {
        edit: articlePolicy.canEdit(actor, article),
        delete: articlePolicy.canDelete(actor, article),
        feature: articlePolicy.canFeature(actor),
        actions: articlePolicy.availableActions(actor, article),
      },
    };
  },

  async stats(actor: Actor) {
    const authorId = can.viewAllArticles(actor) ? undefined : actor.id;
    const byStatus = await articlesRepository.countByStatus(authorId);
    return {
      DRAFT: byStatus.DRAFT ?? 0,
      IN_REVIEW: byStatus.IN_REVIEW ?? 0,
      PUBLISHED: byStatus.PUBLISHED ?? 0,
      ARCHIVED: byStatus.ARCHIVED ?? 0,
    };
  },

  async create(actor: Actor, input: ArticleInput) {
    await ensureCategory(input.categoryId);
    const { tags, featured, ...data } = input;
    const created = await articlesRepository.insert({
      ...data,
      coverImageUrl: data.coverImageUrl ?? null,
      featured: articlePolicy.canFeature(actor) ? !!featured : false,
      slug: await uniqueSlug(input.title),
      authorId: actor.id,
      status: "DRAFT",
    });
    if (tags?.length) await articlesRepository.setTags(created.id, tags);
    await auditService.record({ actorId: actor.id, action: "article.create", entity: "article", entityId: created.id });
    invalidateContent();
    return created;
  },

  async update(actor: Actor, id: string, input: ArticleUpdateInput) {
    const current = await articlesRepository.findRef(id);
    if (!current) throw new NotFoundError("Matéria", "f");
    if (!articlePolicy.canEdit(actor, current)) throw new ForbiddenError("Você não pode editar esta matéria no estado atual");
    if (input.categoryId) await ensureCategory(input.categoryId);

    const { tags, featured, ...data } = input;
    const patch: Parameters<typeof articlesRepository.update>[1] = { ...data };
    if (featured !== undefined && articlePolicy.canFeature(actor)) patch.featured = featured;
    // Slug estável depois de publicada (não quebrar links/SEO); rascunho acompanha o título.
    if (input.title && input.title !== current.title && !current.publishedAt) {
      patch.slug = await uniqueSlug(input.title);
    }

    const updated = await articlesRepository.update(id, patch);
    if (tags) await articlesRepository.setTags(id, tags);
    await auditService.record({
      actorId: actor.id, action: "article.update", entity: "article", entityId: id, meta: { fields: Object.keys(input) },
    });
    invalidateContent();
    return updated;
  },

  async transition(actor: Actor, id: string, action: ArticleAction) {
    const current = await articlesRepository.findRef(id);
    if (!current) throw new NotFoundError("Matéria", "f");

    const decision = articlePolicy.canTransition(actor, current, action);
    if (!decision.allowed) {
      if (decision.reason === "FORBIDDEN") throw new ForbiddenError();
      throw new ConflictError(
        `Ação "${TRANSITIONS[action].label}" não é válida para uma matéria com status ${current.status}`,
        { status: current.status, allowedFrom: TRANSITIONS[action].from },
      );
    }

    const to = TRANSITIONS[action].to;
    const updated = await articlesRepository.update(id, {
      status: to,
      // Primeira publicação define a data; republicar (de ARCHIVED) preserva a original.
      ...(to === "PUBLISHED" && !current.publishedAt ? { publishedAt: new Date() } : {}),
    });
    await auditService.record({
      actorId: actor.id, action: `article.${action}`, entity: "article", entityId: id, meta: { from: current.status, to },
    });
    invalidateContent();
    return updated;
  },

  async remove(actor: Actor, id: string) {
    const current = await articlesRepository.findRef(id);
    if (!current) throw new NotFoundError("Matéria", "f");
    if (!articlePolicy.canDelete(actor, current)) throw new ForbiddenError("Matérias publicadas devem ser arquivadas, não excluídas");
    await articlesRepository.delete(id);
    await auditService.record({ actorId: actor.id, action: "article.delete", entity: "article", entityId: id, meta: { title: current.title } });
    invalidateContent();
  },
};
