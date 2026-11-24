import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { auditService } from "@/server/modules/audit/audit.service";

export const GET = withRoute({ auth: "ADMIN" }, async () => ok(await auditService.recent(50)));
