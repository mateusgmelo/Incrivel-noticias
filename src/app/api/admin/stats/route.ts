import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { articlesService } from "@/server/modules/articles/article.service";

export const GET = withRoute({ auth: "REPORTER" }, async ({ actor }) => ok(await articlesService.stats(actor)));
