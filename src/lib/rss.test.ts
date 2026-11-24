import Parser from "rss-parser";
import { describe, expect, it } from "vitest";
import { mapFeedItem } from "@/server/modules/ingest/ingest.mapper";
import { buildRssFeed, escapeXml } from "./rss";

const entry = {
  title: 'Prefeitura & Câmara: "acordo" <fechado>',
  slug: "prefeitura-e-camara-acordo-fechado",
  excerpt: "Resumo com acentuação, \"aspas\" & símbolos.",
  categoryName: "Política",
  authorName: "Rita Repórter",
  publishedAt: new Date("2026-11-24T12:00:00Z"),
  coverImageUrl: "https://img.exemplo/capa.jpg?w=1200&h=675",
};

describe("feed RSS do portal", () => {
  it("escapa caracteres especiais de XML", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe("a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;");
  });

  it("gera XML válido que o próprio agregador do projeto consegue ler", async () => {
    const xml = buildRssFeed({ site: "https://site.dev", title: "Teste", description: "Desc", entries: [entry] });
    const feed = await new Parser().parseString(xml); // falharia se o XML fosse inválido
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].title).toBe(entry.title);
    expect(feed.items[0].link).toBe("https://site.dev/noticia/prefeitura-e-camara-acordo-fechado");

    // ida e volta: o que publicamos é importável pelo nosso próprio mapper
    const mapped = mapFeedItem(feed.items[0], "Incrível Notícias");
    expect(mapped?.excerpt).toBe(entry.excerpt);
    expect(mapped?.publishedAt).toEqual(entry.publishedAt);
  });

  it("feed vazio continua válido", async () => {
    const xml = buildRssFeed({ site: "https://site.dev", title: "T", description: "D", entries: [] });
    await expect(new Parser().parseString(xml)).resolves.toMatchObject({ title: "T" });
  });
});
