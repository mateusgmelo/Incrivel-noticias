import { withRoute } from "@/server/core/http/route";
import { noContent, ok } from "@/server/core/http/responses";
import { IdParam } from "@/server/modules/articles/article.schema";
import { CategoryInput } from "@/server/modules/categories/category.schema";
import { categoriesService } from "@/server/modules/categories/category.service";

export const PATCH = withRoute(
  { auth: "EDITOR", params: IdParam, body: CategoryInput },
  async ({ actor, params, body }) => ok(await categoriesService.update(actor, params.id, body)),
);

export const DELETE = withRoute({ auth: "EDITOR", params: IdParam }, async ({ actor, params }) => {
  await categoriesService.remove(actor, params.id);
  return noContent();
});
