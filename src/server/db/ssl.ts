/**
 * SSL obrigatório para qualquer banco remoto (Neon, RDS…), independente de a URL
 * trazer `sslmode`. Bancos locais (docker compose, localhost) seguem sem SSL.
 * Segurança não deve depender de alguém lembrar de um parâmetro na connection string.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db", "host.docker.internal"]);

export function sslFor(connectionString: string): false | { rejectUnauthorized: true } {
  try {
    const host = new URL(connectionString).hostname.replace(/^\[|\]$/g, "");
    return LOCAL_HOSTS.has(host) ? false : { rejectUnauthorized: true };
  } catch {
    return { rejectUnauthorized: true };
  }
}

/** Remove `sslmode`/`channel_binding` da URL: o SSL passa a ser decidido por `sslFor`. */
export function stripSslParams(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("channel_binding");
    url.searchParams.delete("uselibpqcompat");
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function pgConfig(connectionString: string) {
  return { connectionString: stripSslParams(connectionString), ssl: sslFor(connectionString) };
}
