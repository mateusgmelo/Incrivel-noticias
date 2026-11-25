import { can, type Actor } from "@/server/core/auth/rbac";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/core/http/errors";
import { slugify } from "@/server/core/utils/slug";
import { invalidateContent } from "@/server/core/cache/content-cache";
import { auditService } from "@/server/modules/audit/audit.service";
import { categoriesRepository } from "./category.repository";
import type { CategoryInput } from "./category.schema";

export const categoriesService = {
  list: () => categoriesRepository.listWithCounts(),

  async getBySlug(slug: string) {
    const category = await categoriesRepository.findBySlug(slug);
    if (!category) throw new NotFoundError("Categoria", "f");
    return category;
  },

  async create(actor: Actor, input: CategoryInput) {
    if (!can.manageCategories(actor)) throw new ForbiddenError();
    const category = await categoriesRepository.insert({ ...input, slug: slugify(input.name, 100) });
    await auditService.record({ actorId: actor.id, action: "category.create", entity: "category", entityId: category.id });
    invalidateContent();
    return category;
  },

  async update(actor: Actor, id: string, input: CategoryInput) {
    if (!can.manageCategories(actor)) throw new ForbiddenError();
    const updated = await categoriesRepository.update(id, { ...input, slug: slugify(input.name, 100) });
    if (!updated) throw new NotFoundError("Categoria", "f");
    await auditService.record({ actorId: actor.id, action: "category.update", entity: "category", entityId: id });
    invalidateContent();
    return updated;
  },

  async remove(actor: Actor, id: string) {
    if (!can.manageCategories(actor)) throw new ForbiddenError();
    const category = await categoriesRepository.findById(id);
    if (!category) throw new NotFoundError("Categoria", "f");
    // Integridade: não apagamos categoria com matérias (a FK é RESTRICT, aqui damos a mensagem amigável).
    const inUse = await categoriesRepository.countArticles(id);
    if (inUse > 0) throw new ConflictError(`Categoria possui ${inUse} matéria(s). Mova-as antes de excluir.`);
    await categoriesRepository.delete(id);
    await auditService.record({ actorId: actor.id, action: "category.delete", entity: "category", entityId: id, meta: { name: category.name } });
    invalidateContent();
  },
};
