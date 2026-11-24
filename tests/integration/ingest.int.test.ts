/**
 * Agregador RSS ponta a ponta: um servidor HTTP local serve feeds de verdade
 * e o serviço importa, deduplica e isola falhas por fonte.
 */
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/server/core/http/errors";
import { articlesService } from "@/server/modules/articles/article.service";
import { ingestService } from "@/server/modules/ingest/ingest.service";
import { seedBase } from "./fixtures";

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Portal Teste</title>
<item><title>Ponte é reaberta após reforma</title><link>https://portal.teste/ponte</link>
<description>&lt;p&gt;Obra durou seis meses e custou R$ 12 milhões aos cofres públicos.&lt;/p&gt;</description>
<content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/">CORPO INTEGRAL QUE NÃO PODE SER COPIADO</content:encoded>
<pubDate>Mon, 24 Nov 2026 10:00:00 GMT</pubDate></item>
<item><title>Feira de tecnologia abre inscrições</title><link>https://portal.teste/feira</link>
<description>Evento reúne startups do Nordeste em dezembro no Recife.</description></item>
<item><title></title><link>https://portal.teste/sem-titulo</link></item>
</channel></rss>`;

let server: Server;
let ctx: Awaited<ReturnType<typeof seedBase>>;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === "/feed.xml") {
      res.writeHead(200, { "content-type": "application/rss+xml" });
      res.end(FEED);
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  process.env.INGEST_FEEDS = `Portal Teste|http://127.0.0.1:${port}/feed.xml,Fora do Ar|http://127.0.0.1:${port}/404.xml`;
});

afterAll(async () => {
  delete process.env.INGEST_FEEDS;
  await new Promise((r) => server.close(r));
});

beforeEach(async () => {
  ctx = await seedBase();
});

describe("agregador RSS", () => {
  it("repórter não dispara importação", async () => {
    await expect(ingestService.run(ctx.reporter)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("importa manchetes válidas como IN_REVIEW, isolando a fonte que falhou", async () => {
    const r = await ingestService.run(ctx.editor);
    expect(r.created).toBe(2);
    expect(r.failedSources).toBe(1);
    expect(r.results.find((x) => x.source === "Fora do Ar")?.error).toMatch(/404/);

    const review = await articlesService.adminList(ctx.editor, { page: 1, pageSize: 20, status: "IN_REVIEW" });
    expect(review.meta.total).toBe(2);
    expect(review.items.every((a) => a.source === "IMPORTED" && a.categorySlug === "giro-de-noticias")).toBe(true);
  });

  it("guarda só título, resumo e link — nunca o corpo da matéria original", async () => {
    await ingestService.run(ctx.editor);
    const { items } = await articlesService.adminList(ctx.editor, { page: 1, pageSize: 20, q: "Ponte" });
    const full = await articlesService.getForAdmin(ctx.editor, items[0].id);
    expect(full.sourceUrl).toBe("https://portal.teste/ponte");
    expect(full.excerpt).toBe("Obra durou seis meses e custou R$ 12 milhões aos cofres públicos.");
    expect(full.body).not.toContain("CORPO INTEGRAL");
  });

  it("é idempotente: rodar de novo não duplica nada", async () => {
    await ingestService.run(ctx.editor);
    const second = await ingestService.run(ctx.editor);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(3);
  });
});
