import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanCredit, htmlToBody, isOwnStaff, isReproductionForbidden } from "./ingest.fulltext";
import { categoryForUrl, parseFeedsEnv } from "./ingest.sources";

const html = readFileSync(join(__dirname, "__fixtures__/agencia-brasil-item.html"), "utf8");

describe("htmlToBody (matéria real da Agência Brasil, salva como fixture)", () => {
  const body = htmlToBody(html)!;

  it("extrai o texto em parágrafos, com intertítulo e lista", () => {
    expect(body.startsWith("O dólar fechou em queda")).toBe(true);
    expect(body).toContain("\n\n## Ibovespa\n\n");
    expect(body).toContain("- Dólar comercial: R$ 5,911 (-0,26%);\n- Ibovespa");
    expect(body).toContain("“O cenário segue de cautela”");
  });

  it("descarta logo, pixel de rastreio, script e o bloco 'Notícias relacionadas'", () => {
    expect(body).not.toMatch(/Logo|alert|<|Entenda o pacote|Notícias relacionadas/);
  });

  it("devolve null quando não há texto suficiente (cai para o modo manchete)", () => {
    expect(htmlToBody("<p>Curto.</p>")).toBeNull();
  });
});

describe("licença", () => {
  it("reconhece o aviso de reprodução proibida das agências parceiras", () => {
    expect(isReproductionForbidden("<p>*É proibida a reprodução deste material.</p>")).toBe(true);
    expect(isReproductionForbidden("<p>É proibida a republicação deste conteúdo*</p>")).toBe(true);
    // falso positivo comum: a palavra aparece no texto da matéria
    expect(isReproductionForbidden("<p>Elas poderiam ficar proibidas de favorecer produtos.</p>")).toBe(false);
  });

  it("só aceita texto assinado pela própria agência", () => {
    expect(isOwnStaff("Luciano Nascimento - Repórter da Agência Brasil ", "Agência Brasil")).toBe(true);
    expect(isOwnStaff("Emma Farge - Repórter da Reuters*", "Agência Brasil")).toBe(false);
    expect(isOwnStaff(undefined, "Agência Brasil")).toBe(false);
    expect(cleanCredit("  Fulano  -  Repórter da Agência Brasil ")).toBe("Fulano - Repórter da Agência Brasil");
  });
});

describe("fontes", () => {
  it("categoria vem da editoria na URL", () => {
    expect(categoryForUrl("https://agenciabrasil.ebc.com.br/economia/noticia/2026-11/x").slug).toBe("economia");
    expect(categoryForUrl("https://agenciabrasil.ebc.com.br/meio-ambiente/noticia/2026-11/x").slug).toBe("meio-ambiente");
    expect(categoryForUrl("https://agenciabrasil.ebc.com.br/geral/noticia/2026-11/x").slug).toBe("brasil");
    expect(categoryForUrl("https://agenciabrasil.ebc.com.br/desconhecida/x").slug).toBe("brasil");
  });

  it("INGEST_FEEDS: modo seguro por padrão, 'full' e 'auto' explícitos", () => {
    expect(parseFeedsEnv("A|https://a.com/rss,B|https://b.com/rss|full|auto")).toEqual([
      { name: "A", url: "https://a.com/rss", mode: "headline", autoPublish: false },
      { name: "B", url: "https://b.com/rss", mode: "full", autoPublish: true },
    ]);
    expect(parseFeedsEnv("")).toBeNull();
  });
});
