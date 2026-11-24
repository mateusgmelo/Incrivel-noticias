import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { PublicListQuery } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

/** GET /api/articles?page=&pageSize=&category=&tag=&q= — somente publicadas */
export const GET = withRoute({ query: PublicListQuery }, async ({ query }) => {
  const { items, meta } = await articlesService.listPublished(query);
  return ok(items, meta);
});
