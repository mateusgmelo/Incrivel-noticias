import { withRoute } from "@/server/core/http/route";
import { noContent } from "@/server/core/http/responses";
import { SlugParam } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

/** Contador de leituras (chamado pelo front após a página carregar). */
export const POST = withRoute({ params: SlugParam }, async ({ params }) => {
  await articlesService.registerView(params.slug);
  return noContent();
});
