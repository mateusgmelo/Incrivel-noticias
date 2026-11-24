import { describe, expect, it } from "vitest";
import { isLikelyPhoto, mapFeedItem, stripHtml, truncate } from "./ingest.mapper";

const now = new Date("2026-11-24T12:00:00Z");

describe("mapFeedItem", () => {
  it("extrai somente manchete, resumo, link, fonte e imagem", () => {
    const out = mapFeedItem(
      {
        title: "Chuva forte atinge o Recife",
        link: "https://exemplo.com/materia-1",
        contentSnippet: "Defesa Civil emitiu alerta para as próximas 24 horas na região metropolitana.",
        content: '<p>Texto completo <img src="https://exemplo.com/foto.jpg"> que NÃO deve ser copiado.</p>',
        isoDate: "2026-11-24T10:00:00Z",
      },
      "Portal Exemplo",
      now,
    );
    expect(out).toEqual({
      title: "Chuva forte atinge o Recife",
      excerpt: "Defesa Civil emitiu alerta para as próximas 24 horas na região metropolitana.",
      sourceUrl: "https://exemplo.com/materia-1",
      sourceName: "Portal Exemplo",
      coverImageUrl: "https://exemplo.com/foto.jpg",
      publishedAt: new Date("2026-11-24T10:00:00Z"),
    });
    expect(Object.keys(out!)).not.toContain("body");
  });

  it("descarta itens sem título ou com link inválido", () => {
    expect(mapFeedItem({ title: "", link: "https://x.com" }, "X", now)).toBeNull();
    expect(mapFeedItem({ title: "Ok", link: "javascript:alert(1)" }, "X", now)).toBeNull();
  });

  it("data futura ou inválida vira 'agora'", () => {
    const future = mapFeedItem({ title: "Título válido", link: "https://x.com/a", isoDate: "2099-01-01" }, "X", now);
    expect(future?.publishedAt).toEqual(now);
  });

  it("limita o resumo a 280 caracteres", () => {
    const long = "palavra ".repeat(100);
    const out = mapFeedItem({ title: "Título", link: "https://x.com/b", contentSnippet: long }, "X", now);
    expect(out!.excerpt.length).toBeLessThanOrEqual(280);
    expect(out!.excerpt.endsWith("…")).toBe(true);
  });
});

describe("helpers de texto", () => {
  it("stripHtml remove tags e scripts", () => {
    expect(stripHtml("<p>Olá <b>mundo</b><script>x()</script></p>")).toBe("Olá mundo");
  });
  it("truncate não corta texto curto", () => {
    expect(truncate("curto", 10)).toBe("curto");
  });
});

describe("imagem de capa", () => {
  const base = { title: "Manchete de teste", link: "https://exemplo.com/a", contentSnippet: "Resumo com tamanho suficiente." };

  it("descarta o logotipo do veículo usado como imagem", () => {
    const logo = "https://cdn.jsdelivr.net/gh/x/assets-ebc@1.0.0/abr/assets/images/logo-agenciabrasil.svg";
    expect(mapFeedItem({ ...base, content: `<img src="${logo}">` }, "Agência Brasil")?.coverImageUrl).toBeNull();
  });

  it("mantém fotos de verdade", () => {
    const foto = "https://s2.glbimg.com/abc/2026/11/24/foto.jpg";
    expect(mapFeedItem({ ...base, enclosure: { url: foto, type: "image/jpeg" } }, "g1")?.coverImageUrl).toBe(foto);
    expect(isLikelyPhoto(foto)).toBe(true);
    expect(isLikelyPhoto("https://site.com/img/placeholder.png")).toBe(false);
  });
});
