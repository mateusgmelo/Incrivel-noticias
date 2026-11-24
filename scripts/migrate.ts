/**
 * Aplica as migrations SQL versionadas em /drizzle.
 * Usa DIRECT_URL (conexão sem pooler) — recomendado para DDL no Neon.
 */
import "./load-env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { cleanConnectionString, pgConfig } from "../src/server/db/ssl";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL/DATABASE_URL não definida");

  const cfg = pgConfig(url);
  try {
    const u = new URL(cleanConnectionString(url));
    console.log(`→ migrando ${u.hostname}${u.pathname} (ssl: ${cfg.ssl ? "on" : "off"})`);
  } catch {
    console.error("✖ connection string inválida (verifique aspas/espaços no valor da variável)");
  }
  const pool = new Pool({ ...cfg, max: 1 });
  const started = Date.now();
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log(`✔ migrations aplicadas em ${Date.now() - started}ms`);
}

main().catch((err) => {
  console.error("✖ falha ao migrar:", err);
  process.exit(1);
});
