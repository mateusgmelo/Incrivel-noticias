/**
 * Trava de segurança: os testes de integração APAGAM dados.
 * Só rodam contra banco local (docker, localhost ou service do CI).
 */
const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "db", "postgres"]);

export function assertLocalDatabase(): string {
  try {
    process.loadEnvFile?.(".env.test");
  } catch {
    /* opcional */
  }
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Defina TEST_DATABASE_URL (ou DATABASE_URL) apontando para um Postgres local");
  const host = new URL(url.replace(/^['"]|['"]$/g, "")).hostname;
  if (!LOCAL.has(host)) {
    throw new Error(`Recusado: testes de integração apagam dados e o banco "${host}" não é local.`);
  }
  process.env.DATABASE_URL = url;
  process.env.JWT_SECRET ??= "integration-secret-integration-secret-123";
  return url;
}
