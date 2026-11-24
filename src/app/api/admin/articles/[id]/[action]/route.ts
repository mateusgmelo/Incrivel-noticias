import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { ArticleActionParam } from "@/server/modules/articles/article.schema";
import { articlesService } from "@/server/modules/articles/article.service";

/**
 * POST /api/admin/articles/:id/(submit|publish|reject|archive)
 * Transições de estado são ações explícitas: cada uma tem sua regra de permissão.
 * O papel mínimo aqui é REPORTER; a policy decide caso a caso (ex.: autor pode "submit").
 */
export const POST = withRoute({ auth: "REPORTER", params: ArticleActionParam }, async ({ actor, params }) => {
  return ok(await articlesService.transition(actor, params.id, params.action));
});
