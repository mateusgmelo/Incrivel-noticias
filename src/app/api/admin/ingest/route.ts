import { withRoute } from "@/server/core/http/route";
import { ok } from "@/server/core/http/responses";
import { ingestService } from "@/server/modules/ingest/ingest.service";

export const maxDuration = 30;

/** Importa manchetes dos feeds RSS configurados (entram como IN_REVIEW). */
export const POST = withRoute({ auth: "EDITOR" }, async ({ actor }) => ok(await ingestService.run(actor)));
