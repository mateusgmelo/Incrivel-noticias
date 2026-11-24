import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { SlugParam } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

export const GET = withRoute({ params: SlugParam }, async ({ params }) => {
  return ok(await articlesService.getPublished(params.slug));
});
