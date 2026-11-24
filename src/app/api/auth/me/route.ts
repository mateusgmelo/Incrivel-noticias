import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";

export const GET = withRoute({ auth: "REPORTER" }, async ({ actor }) => ok(actor));
