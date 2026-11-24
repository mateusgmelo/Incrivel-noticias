import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { categoriesService } from "@/server/modules/categories/category.service";

export const GET = withRoute({}, async () => ok(await categoriesService.list()));
