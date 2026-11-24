/** Carrega .env quando existir (dev/local). Em produção as variáveis vêm do ambiente. */
try {
  process.loadEnvFile?.(".env");
} catch {
  /* ignore */
}
