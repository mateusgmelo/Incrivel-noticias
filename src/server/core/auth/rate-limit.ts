/**
 * Rate limit simples em memória (janela fixa) para o login.
 * Limitação conhecida: em serverless cada instância tem sua própria memória.
 * Para produção real: Upstash Redis / Vercel KV. Documentado no README.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
