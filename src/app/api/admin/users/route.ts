import { withRoute } from "@/server/core/http/route";
import { created, ok } from "@/server/core/http/responses";
import { CreateUserInput } from "@/server/modules/users/user.schema";
import { usersService } from "@/server/modules/users/user.service";

export const GET = withRoute({ auth: "ADMIN" }, async ({ actor }) => ok(await usersService.list(actor)));

export const POST = withRoute({ auth: "ADMIN", body: CreateUserInput }, async ({ actor, body }) => {
  return created(await usersService.create(actor, body));
});
