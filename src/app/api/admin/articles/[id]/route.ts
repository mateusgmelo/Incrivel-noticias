import { withRoute } from "@/server/core/http/route";
import { noContent, ok } from "@/server/core/http/responses";
import { ArticleUpdateInput, IdParam } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

export const GET = withRoute({ auth: "REPORTER", params: IdParam }, async ({ actor, params }) => {
  return ok(await articlesService.getForAdmin(actor, params.id));
});

export const PATCH = withRoute(
  { auth: "REPORTER", params: IdParam, body: ArticleUpdateInput },
  async ({ actor, params, body }) => ok(await articlesService.update(actor, params.id, body)),
);

export const DELETE = withRoute({ auth: "REPORTER", params: IdParam }, async ({ actor, params }) => {
  await articlesService.remove(actor, params.id);
  return noContent();
});
