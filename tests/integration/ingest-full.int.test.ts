/**
 * Agregador em modo "full" (fonte licenciada): um servidor local imita o feed da Agência Brasil,
 * com uma matéria própria, uma da Reuters e uma marcada como reprodução proibida.
 */
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { articlesService } from "@/server/modules/articles/article.service";
import { ingestService } from "@/server/modules/ingest/ingest.service";
import { seedBase } from "./fixtures";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ownHtml = readFileSync(join(process.cwd(), "src/server/modules/ingest/__fixtures__/agencia-brasil-item.html"), "utf8");
const PHOTO = "https://imagens.ebc.com.br/abc=/1170x700/smart/foto-dolar.jpg";

const item = (title: string, path: string, creator: string, html: string) => `
<item><title>${title}</title><link>https://agenciabrasil.ebc.com.br/${path}</link>
<imagem-destaque>${PHOTO}</imagem-destaque>
<description>${esc(html)}</description>
<pubDate>Tue, 24 Nov 2026 21:00:00 GMT</pubDate>
<dc:creator>${creator}</dc:creator></item>`;

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Agência Brasil</title>
${item("Dólar cai para R$ 5,91 com expectativa de ajuste fiscal", "economia/noticia/2026-11/dolar-cai", "Wellton Máximo - Repórter da Agência Brasil", ownHtml)}
${item("Terremoto atinge o Peru", "internacional/noticia/2026-11/terremoto", "Marco Aquino - Repórter da Reuters*", "<p>Texto longo da Reuters sem aviso explícito no corpo, mas assinado por agência parceira e portanto fora da licença de reprodução da Agência Brasil.</p>")}
${item("Matéria de parceira", "geral/noticia/2026-11/parceira", "Equipe - Agência Brasil", "<p>Texto com tamanho suficiente para ser extraído pelo agregador, mas com aviso no final da matéria.</p><p>*É proibida a reprodução deste material.</p>")}
</channel></rss>`;

let server: Server;
let ctx: Awaited<ReturnType<typeof seedBase>>;

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/rss+xml" });
    res.end(FEED);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  process.env.INGEST_FEEDS = `Agência Brasil|http://127.0.0.1:${port}/feed.xml|full|auto`;
});

afterAll(async () => {
  delete process.env.INGEST_FEEDS;
  await new Promise((r) => server.close(r));
});

beforeEach(async () => {
  ctx = await seedBase();
});

describe("agregador — fonte licenciada (modo full)", () => {
  it("publica só o texto da própria agência; parceiras e 'proibida a reprodução' ficam de fora", async () => {
    const r = await ingestService.run(ctx.editor);
    expect(r).toMatchObject({ created: 1, published: 1, blocked: 2, failedSources: 0 });
  });

  it("guarda texto integral, foto, crédito e editoria certa", async () => {
    await ingestService.run(ctx.editor);
    const { items } = await articlesService.adminList(ctx.editor, { page: 1, pageSize: 20, status: "PUBLISHED" });
    const a = await articlesService.getPublished(items.find((i) => i.title.startsWith("Dólar"))!.slug);

    expect(a.fullText).toBe(true);
    expect(a.categorySlug).toBe("economia");
    expect(a.coverImageUrl).toBe(PHOTO);
    expect(a.sourceAuthor).toBe("Wellton Máximo - Repórter da Agência Brasil");
    expect(a.body).toContain("## Ibovespa");
    expect(a.body).not.toContain("<");
    expect(a.publishedAt).toBeInstanceOf(Date);
  });

  it("continua idempotente", async () => {
    await ingestService.run(ctx.editor);
    expect((await ingestService.run(ctx.editor)).created).toBe(0);
  });
});
