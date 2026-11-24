import { withRoute } from "@/server/core/http/route";
import { created, ok } from "@/server/core/http/responses";
import { CategoryInput } from "@/server/modules/categories/category.schema";
import { categoriesService } from "@/server/modules/categories/category.service";

export const GET = withRoute({ auth: "REPORTER" }, async () => ok(await categoriesService.list()));

export const POST = withRoute({ auth: "EDITOR", body: CategoryInput }, async ({ actor, body }) => {
  return created(await categoriesService.create(actor, body));
});
