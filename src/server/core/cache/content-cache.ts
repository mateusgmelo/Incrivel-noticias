/**
 * Cache das leituras públicas (capa, matérias, editorias) com invalidação por evento.
 *
 * - Leituras: `cachedContent` usa o Data Cache do Next (na Vercel, compartilhado entre
 *   instâncias). Um leitor a mais não gera consulta a mais no Postgres.
 * - Escritas: os services chamam `invalidateContent()` ao publicar, editar, arquivar,
 *   excluir, mexer em editoria ou importar. O próximo leitor já vê a versão nova.
 * - `revalidate` de 10 min é só rede de segurança (ex.: contador de leituras).
 *
 * Os services continuam puros: o cache fica na borda (páginas), e fora do runtime do Next
 * (testes, scripts) a invalidação vira no-op.
 */
import { revalidateTag, unstable_cache } from "next/cache";

export const CONTENT_TAG = "content";
const SAFETY_REVALIDATE_SECONDS = 600;

/** O Data Cache serializa em JSON: datas voltam como string. Restaura as que o app usa. */
const DATE_KEYS = new Set(["publishedAt", "updatedAt", "createdAt"]);

export function reviveDates<T>(value: T): T {
  if (value instanceof Date) return value; // cache miss: o valor ainda é o original
  if (Array.isArray(value)) return value.map(reviveDates) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = DATE_KEYS.has(k) && typeof v === "string" ? new Date(v) : reviveDates(v);
    }
    return out as T;
  }
  return value;
}

export function cachedContent<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) {
  const cached = unstable_cache(fn, ["content", key], { tags: [CONTENT_TAG], revalidate: SAFETY_REVALIDATE_SECONDS });
  return async (...args: A): Promise<R> => reviveDates(await cached(...args));
}

export function invalidateContent() {
  try {
    revalidateTag(CONTENT_TAG);
  } catch {
    // Fora de uma requisição do Next (testes, scripts de linha de comando): não há cache a invalidar.
  }
}
