import { describe, expect, it } from "vitest";
import { reviveDates } from "./content-cache";

describe("reviveDates", () => {
  it("restaura datas que voltaram do cache como string, em qualquer profundidade", () => {
    const out = reviveDates({ featured: [{ publishedAt: "2026-11-25T00:40:32.078Z", title: "x" }], createdAt: null });
    expect(out.featured[0].publishedAt).toBeInstanceOf(Date);
    expect((out.featured[0].publishedAt as unknown as Date).toISOString()).toBe("2026-11-25T00:40:32.078Z");
    expect(out.createdAt).toBeNull();
  });

  it("mantém Date original no cache miss (não vira objeto vazio)", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    expect(reviveDates({ updatedAt: d }).updatedAt).toBe(d);
  });

  it("não mexe em campos que não são data", () => {
    expect(reviveDates({ title: "2026-11-25T00:40:32.078Z" }).title).toBe("2026-11-25T00:40:32.078Z");
  });
});
