import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { assertLocalDatabase } from "./guard";

/** Uma vez por execução: aplica as migrations reais do projeto no banco de teste. */
export default async function globalSetup() {
  const url = assertLocalDatabase();
  const pool = new Pool({ connectionString: url, max: 1 });
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
}
