import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { errorResponse, ok } from "@/server/core/http/responses";

export const dynamic = "force-dynamic";

/** Healthcheck: confirma que a aplicação e o banco respondem. */
export async function GET() {
  const started = Date.now();
  try {
    await db().execute(sql`select 1`);
    return ok({ status: "ok", database: "up", latencyMs: Date.now() - started });
  } catch {
    return errorResponse(503, "UNAVAILABLE", "Banco de dados indisponível");
  }
}
