import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/server/core/config/env";
import * as schema from "./schema";
import { pgConfig } from "./ssl";

export type Database = NodePgDatabase<typeof schema>;

/**
 * Pool único por processo. Em dev o hot-reload recria módulos, então guardamos
 * no globalThis para não abrir conexões novas a cada save.
 * Em serverless (Vercel) usamos poucas conexões por instância + a URL "pooled" do Neon.
 */
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool() {
  return new Pool({
    ...pgConfig(env().DATABASE_URL),
    max: env().NODE_ENV === "production" ? 3 : 10,
    idleTimeoutMillis: 10_000,
  });
}

let instance: Database | null = null;

export function db(): Database {
  if (instance) return instance;
  const pool = globalForDb.pgPool ?? createPool();
  if (env().NODE_ENV !== "production") globalForDb.pgPool = pool;
  instance = drizzle(pool, { schema });
  return instance;
}

/** Encerra o pool (scripts e testes). Em serverless o runtime cuida disso. */
export async function closeDb() {
  const pool = globalForDb.pgPool;
  instance = null;
  globalForDb.pgPool = undefined;
  await pool?.end();
}

export { schema };
