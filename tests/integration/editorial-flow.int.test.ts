/**
 * Fluxo editorial completo contra Postgres real:
 * repórter escreve → envia → editor publica → aparece no site → arquiva → some do site.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/core/http/errors";
import { articlesService } from "@/server/modules/articles/article.service";
import { auditService } from "@/server/modules/audit/audit.service";
import { articleInput, seedBase } from "./fixtures";

let ctx: Awaited<ReturnType<typeof seedBase>>;
const page = { page: 1, pageSize: 20 };

beforeEach(async () => {
  ctx = await seedBase();
});

describe("fluxo editorial", () => {
  it("percorre DRAFT → IN_REVIEW → PUBLISHED → ARCHIVED respeitando cada papel", async () => {
    const { reporter, editor, politica } = ctx;

    // Repórter cria: sempre nasce rascunho, com slug derivado do título
    const created = await articlesService.create(reporter, articleInput(politica.id));
    expect(created.slug).toBe("camara-aprova-novo-plano-de-mobilidade-urbana");
    expect((await articlesService.getForAdmin(reporter, created.id)).status).toBe("DRAFT");

    // Rascunho não é público
    await expect(articlesService.getPublished(created.slug)).rejects.toBeInstanceOf(NotFoundError);

    // Repórter não publica; envia para revisão
    await expect(articlesService.transition(reporter, created.id, "publish")).rejects.toBeInstanceOf(ForbiddenError);
    await articlesService.transition(reporter, created.id, "submit");

    // Após enviar, o repórter perde a edição
    await expect(articlesService.update(reporter, created.id, { title: "Tentando mudar o título" }))
      .rejects.toBeInstanceOf(ForbiddenError);

    // Transição inválida para o estado atual = 409, não 403
    await expect(articlesService.transition(editor, created.id, "archive")).rejects.toBeInstanceOf(ConflictError);

    // Editor publica: data de publicação é definida e a matéria fica pública
    await articlesService.transition(editor, created.id, "publish");
    const published = await articlesService.getPublished(created.slug);
    expect(published.publishedAt).toBeInstanceOf(Date);
    expect((await articlesService.listPublished(page)).items.map((a) => a.id)).toContain(created.id);

    // Arquivar tira do ar
    await articlesService.transition(editor, created.id, "archive");
    await expect(articlesService.getPublished(created.slug)).rejects.toBeInstanceOf(NotFoundError);

    // Republicar preserva a data original
    await articlesService.transition(editor, created.id, "publish");
    expect((await articlesService.getPublished(created.slug)).publishedAt).toEqual(published.publishedAt);
  });

  it("registra cada transição na auditoria com estado de origem e destino", async () => {
    const { reporter, editor, politica } = ctx;
    const a = await articlesService.create(reporter, articleInput(politica.id));
    await articlesService.transition(reporter, a.id, "submit");
    await articlesService.transition(editor, a.id, "publish");

    const logs = (await auditService.recent(10)).filter((l) => l.entityId === a.id);
    expect(logs.map((l) => l.action)).toEqual(["article.publish", "article.submit", "article.create"]);
    expect(logs[0].meta).toMatchObject({ from: "IN_REVIEW", to: "PUBLISHED" });
    expect(logs[0].actorName).toBe(editor.name);
  });

  it("slug congela após a primeira publicação (não quebra links)", async () => {
    const { editor, politica } = ctx;
    const a = await articlesService.create(editor, articleInput(politica.id));
    await articlesService.update(editor, a.id, { title: "Título revisado antes de publicar" });
    const draft = await articlesService.getForAdmin(editor, a.id);
    expect(draft.slug).toBe("titulo-revisado-antes-de-publicar");

    await articlesService.transition(editor, a.id, "publish");
    await articlesService.update(editor, a.id, { title: "Correção de título após publicação" });
    expect((await articlesService.getForAdmin(editor, a.id)).slug).toBe("titulo-revisado-antes-de-publicar");
  });

  it("títulos iguais geram slugs únicos", async () => {
    const { editor, politica } = ctx;
    const a = await articlesService.create(editor, articleInput(politica.id));
    const b = await articlesService.create(editor, articleInput(politica.id));
    expect(a.slug).not.toBe(b.slug);
    expect(b.slug.startsWith(a.slug)).toBe(true);
  });
});

describe("visibilidade e permissões por papel", () => {
  it("repórter lista só as próprias matérias; editor vê todas", async () => {
    const { reporter, editor, politica } = ctx;
    await articlesService.create(reporter, articleInput(politica.id, { title: "Matéria escrita pela repórter" }));
    await articlesService.create(editor, articleInput(politica.id, { title: "Matéria escrita pelo editor" }));

    const mine = await articlesService.adminList(reporter, page);
    const all = await articlesService.adminList(editor, page);
    expect(mine.meta.total).toBe(1);
    expect(mine.items[0].authorId).toBe(reporter.id);
    expect(all.meta.total).toBe(2);
  });

  it("repórter não abre a matéria de outro autor", async () => {
    const { reporter, editor, politica } = ctx;
    const a = await articlesService.create(editor, articleInput(politica.id));
    await expect(articlesService.getForAdmin(reporter, a.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("repórter não consegue destacar matéria na capa (campo ignorado)", async () => {
    const { reporter, politica } = ctx;
    const a = await articlesService.create(reporter, articleInput(politica.id, { featured: true }));
    expect((await articlesService.getForAdmin(reporter, a.id)).featured).toBe(false);
  });

  it("publicada não pode ser excluída por editor; admin pode", async () => {
    const { editor, admin, politica } = ctx;
    const a = await articlesService.create(editor, articleInput(politica.id));
    await articlesService.transition(editor, a.id, "publish");
    await expect(articlesService.remove(editor, a.id)).rejects.toBeInstanceOf(ForbiddenError);
    await articlesService.remove(admin, a.id);
    await expect(articlesService.getForAdmin(admin, a.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("leitura pública", () => {
  it("filtra por categoria, tag e termo de busca, com paginação", async () => {
    const { editor, politica, esportes } = ctx;
    const pub = async (input: ReturnType<typeof articleInput>) => {
      const a = await articlesService.create(editor, input);
      await articlesService.transition(editor, a.id, "publish");
    };
    await pub(articleInput(politica.id, { title: "Assembleia vota orçamento estadual", tags: ["Orçamento"] }));
    await pub(articleInput(esportes.id, { title: "Clássico termina empatado no Arruda", tags: ["Futebol"] }));
    await pub(articleInput(esportes.id, { title: "Seleção de vôlei vence torneio regional", tags: ["Vôlei"] }));

    expect((await articlesService.listPublished({ ...page, category: "esportes" })).meta.total).toBe(2);
    expect((await articlesService.listPublished({ ...page, tag: "futebol" })).items[0].title).toMatch(/Clássico/);
    expect((await articlesService.listPublished({ ...page, q: "orçamento" })).meta.total).toBe(1);

    const p = await articlesService.listPublished({ page: 2, pageSize: 2 });
    expect(p.meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
    expect(p.items).toHaveLength(1);
  });

  it("contador de leituras só incrementa matérias publicadas", async () => {
    const { editor, politica } = ctx;
    const draft = await articlesService.create(editor, articleInput(politica.id, { title: "Rascunho que ninguém lê" }));
    await articlesService.registerView(draft.slug);
    expect((await articlesService.getForAdmin(editor, draft.id)).views).toBe(0);

    await articlesService.transition(editor, draft.id, "publish");
    await articlesService.registerView(draft.slug);
    await articlesService.registerView(draft.slug);
    expect((await articlesService.getPublished(draft.slug)).views).toBe(2);
  });
});
