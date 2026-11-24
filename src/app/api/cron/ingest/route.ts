import { type NextRequest } from "next/server";
import { env } from "@/server/core/config/env";
import { UnauthorizedError } from "@/server/core/http/errors";
import { ok } from "@/server/core/http/responses";
import { toErrorResponse } from "@/server/core/http/route";
import { ingestService } from "@/server/modules/ingest/ingest.service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Chamado pelo Vercel Cron (vercel.json). A Vercel envia "Authorization: Bearer $CRON_SECRET". */
export async function GET(req: NextRequest) {
  try {
    const secret = env().CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) throw new UnauthorizedError();
    return ok(await ingestService.runAsSystem());
  } catch (err) {
    return toErrorResponse(err, req);
  }
}
