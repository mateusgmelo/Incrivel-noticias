import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { IdParam } from "@/server/modules/articles/article.schema";
import { UpdateUserInput } from "@/server/modules/users/user.schema";
import { usersService } from "@/server/modules/users/user.service";

export const PATCH = withRoute(
  { auth: "ADMIN", params: IdParam, body: UpdateUserInput },
  async ({ actor, params, body }) => ok(await usersService.update(actor, params.id, body)),
);
