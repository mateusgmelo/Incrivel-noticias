/**
 * Busca full-text em português (tsvector + GIN + ranking) contra Postgres real.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { articlesService } from "@/server/modules/articles/article.service";
import { articleInput, seedBase } from "./fixtures";

const search = async (q: string) =>
  (await articlesService.listPublished({ page: 1, pageSize: 20, q })).items.map((a) => a.title);

beforeAll(async () => {
  const { editor, politica, esportes } = await seedBase();
  const publish = async (title: string, excerpt: string, body: string, categoryId = politica.id) => {
    const a = await articlesService.create(editor, articleInput(categoryId, { title, excerpt, body }));
    await articlesService.transition(editor, a.id, "publish");
  };
  await publish(
    "Assembleia aprova orçamento de 2027",
    "Sessão terminou com 32 votos favoráveis e 9 contrários na terça.",
    "O texto segue para sanção do governador. Deputados da oposição criticaram cortes na área social.",
  );
  await publish(
    "Governo anuncia investimento em escolas",
    "Plano prevê reforma de 120 unidades no interior até o fim do próximo ano letivo.",
    "Segundo a secretaria, o orçamento destinado à educação cresce 8% em relação ao ano anterior.",
  );
  await publish(
    "Sport vence clássico e assume liderança",
    "Gol de cabeça nos acréscimos garantiu a vitória diante de 30 mil torcedores.",
    "A comissão técnica comemorou o resultado e prepara o time para a próxima rodada.",
    esportes.id,
  );
});

describe("busca full-text", () => {
  it("ignora acentos: 'orcamento' encontra 'orçamento'", async () => {
    expect(await search("orcamento")).toHaveLength(2);
  });

  it("entende flexões em português: 'votar' encontra 'votos' (radical vot)", async () => {
    expect(await search("votar")).toEqual(["Assembleia aprova orçamento de 2027"]);
    expect(await search("torcedor")).toEqual(["Sport vence clássico e assume liderança"]); // plural → singular
  });

  it("ordena por relevância: termo no título vem antes de termo só no corpo", async () => {
    const results = await search("orçamento");
    expect(results[0]).toBe("Assembleia aprova orçamento de 2027"); // título (peso A)
    expect(results[1]).toBe("Governo anuncia investimento em escolas"); // corpo (peso C)
  });

  it("aceita sintaxe de busca: exclusão com '-' e frase entre aspas", async () => {
    expect(await search("orçamento -escolas")).toEqual(["Assembleia aprova orçamento de 2027"]);
    expect(await search('"gol de cabeça"')).toEqual(["Sport vence clássico e assume liderança"]);
  });

  it("encontra trecho parcial do título enquanto o usuário digita", async () => {
    expect(await search("Assemb")).toEqual(["Assembleia aprova orçamento de 2027"]);
  });

  it("entrada maliciosa ou só com símbolos não quebra a consulta", async () => {
    await expect(search("'); DROP TABLE articles; --")).resolves.toEqual([]);
    await expect(search("%%%___")).resolves.toEqual([]);
    await expect(search("!!! &&& |||")).resolves.toBeInstanceOf(Array);
  });

  it("matéria não publicada nunca aparece na busca pública", async () => {
    const { editor, politica } = await seedBase();
    await articlesService.create(editor, articleInput(politica.id, { title: "Rascunho secreto sobre orçamento" }));
    expect(await search("secreto")).toEqual([]);
  });
});
