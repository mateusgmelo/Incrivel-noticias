/**
 * Rate limit com estado no Postgres: vale entre instâncias e é atômico sob concorrência.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimit } from "@/server/core/auth/rate-limit";
import { resetDatabase } from "./fixtures";

beforeEach(resetDatabase);

describe("rate limit (Postgres)", () => {
  it("permite até o limite e bloqueia a partir daí, informando quando tentar de novo", async () => {
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await rateLimit("k", 5, 60_000));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, true, true, false]);
    expect(results[5].remaining).toBe(0);
    expect(results[5].retryAfterSeconds).toBeGreaterThan(50);
  });

  it("é atômico: 20 requisições simultâneas, exatamente 5 passam", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => rateLimit("paralelo", 5, 60_000)));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("chaves são independentes e o reset libera na hora", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("a", 5, 60_000);
    expect((await rateLimit("a", 5, 60_000)).allowed).toBe(false);
    expect((await rateLimit("b", 5, 60_000)).allowed).toBe(true);
    await resetRateLimit("a");
    expect((await rateLimit("a", 5, 60_000)).allowed).toBe(true);
  });

  it("a janela vence e o contador recomeça", async () => {
    await rateLimit("curta", 1, 1_000);
    expect((await rateLimit("curta", 1, 1_000)).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 1_100));
    expect((await rateLimit("curta", 1, 1_000)).allowed).toBe(true);
  });
});
