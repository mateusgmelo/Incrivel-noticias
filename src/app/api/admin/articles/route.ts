import { withRoute } from "@/server/core/http/route";
import { created, ok } from "@/server/core/http/responses";
import { AdminListQuery, ArticleInput } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

export const GET = withRoute({ auth: "REPORTER", query: AdminListQuery }, async ({ actor, query }) => {
  const { items, meta } = await articlesService.adminList(actor, query);
  return ok(items, meta);
});

export const POST = withRoute({ auth: "REPORTER", body: ArticleInput }, async ({ actor, body }) => {
  return created(await articlesService.create(actor, body));
});
