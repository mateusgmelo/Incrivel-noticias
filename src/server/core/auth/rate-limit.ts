/**
 * Rate limit com estado no Postgres (janela fixa).
 *
 * Por que não em memória: na Vercel cada request pode cair numa instância diferente,
 * e cada uma teria seu próprio contador — o limite simplesmente não valeria.
 * Aqui o contador é uma linha por chave, atualizada num único UPSERT atômico:
 * duas requisições simultâneas nunca "ganham" a mesma vaga.
 */
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const fresh = sql`now() + make_interval(secs => ${windowSec})`;
  const expired = sql`${rateLimits.resetAt} < now()`;

  const [row] = await db()
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: fresh })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${expired} THEN ${fresh} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  // Faxina ocasional das janelas vencidas (evita a tabela crescer sem precisar de job).
  if (Math.random() < 0.02) {
    await db().delete(rateLimits).where(lt(rateLimits.resetAt, sql`now() - interval '1 hour'`));
  }

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
  };
}

export async function resetRateLimit(key: string) {
  await db().delete(rateLimits).where(eq(rateLimits.key, key));
}
