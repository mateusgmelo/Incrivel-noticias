/**
 * Fontes RSS do agregador.
 *
 * Cada fonte declara o que a LICENÇA dela permite:
 *   - "full":     reprodução integral autorizada com crédito (ex.: Agência Brasil, agência pública).
 *                 Guardamos texto + foto + crédito do autor e linkamos a original.
 *   - "headline": conteúdo protegido. Guardamos só manchete, resumo do feed, foto de capa e link.
 *
 * `autoPublish`: matérias de fonte licenciada e confiável vão direto ao ar;
 * o resto entra na fila do editor (IN_REVIEW).
 */
export type SourceMode = "full" | "headline";
export type FeedSource = { name: string; url: string; mode: SourceMode; autoPublish: boolean };

const AGENCIA_BRASIL_EDITORIAS = ["geral", "politica", "economia", "saude", "educacao", "esportes", "cultura", "internacional", "meio-ambiente", "justica"];

const DEFAULT_SOURCES: FeedSource[] = [
  ...AGENCIA_BRASIL_EDITORIAS.map((e) => ({
    name: "Agência Brasil",
    url: `https://agenciabrasil.ebc.com.br/rss/${e}/feed.xml`,
    mode: "full" as const,
    autoPublish: true,
  })),
  { name: "g1 Pernambuco", url: "https://g1.globo.com/rss/g1/pernambuco/", mode: "headline", autoPublish: false },
  { name: "g1 Economia", url: "https://g1.globo.com/rss/g1/economia/", mode: "headline", autoPublish: false },
];

/**
 * Troca as fontes sem deploy de código:
 *   INGEST_FEEDS="Nome|https://url,Outro|https://url|full|auto"
 * Modo padrão: "headline" (o seguro); "auto" liga a publicação automática.
 */
export function parseFeedsEnv(raw: string | undefined): FeedSource[] | null {
  if (!raw?.trim()) return null;
  const parsed = raw
    .split(",")
    .map((entry) => entry.split("|").map((s) => s.trim()))
    .filter(([name, url]) => name && url?.startsWith("http"))
    .map(([name, url, mode, auto]) => ({
      name,
      url,
      mode: (mode === "full" ? "full" : "headline") as SourceMode,
      autoPublish: auto === "auto",
    }));
  return parsed.length ? parsed : null;
}

export const feedSources = (): FeedSource[] => parseFeedsEnv(process.env.INGEST_FEEDS) ?? DEFAULT_SOURCES;

/** Categoria das manchetes "headline" (criada sob demanda). */
export const IMPORT_CATEGORY = { name: "Giro de Notícias", slug: "giro-de-noticias" };

/**
 * Editoria da fonte (1º segmento da URL, ex.: /economia/noticia/...) → categoria do portal.
 * Editoria desconhecida cai em "Brasil".
 */
export const EDITORIA_CATEGORIES: Record<string, { name: string; slug: string; description: string }> = {
  politica: { name: "Política", slug: "politica", description: "Poder público, Congresso, governo e eleições." },
  economia: { name: "Economia", slug: "economia", description: "Mercado, emprego, negócios e consumo." },
  esportes: { name: "Esportes", slug: "esportes", description: "Futebol e outras modalidades." },
  cultura: { name: "Cultura", slug: "cultura", description: "Música, cinema, literatura e patrimônio." },
  internacional: { name: "Internacional", slug: "internacional", description: "O que acontece no mundo." },
  saude: { name: "Saúde", slug: "saude", description: "Saúde pública, ciência e bem-estar." },
  educacao: { name: "Educação", slug: "educacao", description: "Escolas, universidades e políticas de ensino." },
  "meio-ambiente": { name: "Meio Ambiente", slug: "meio-ambiente", description: "Clima, natureza e sustentabilidade." },
  justica: { name: "Justiça", slug: "justica", description: "Tribunais, investigações e direitos." },
  geral: { name: "Brasil", slug: "brasil", description: "Notícias do país." },
};

export function categoryForUrl(url: string) {
  let first = "";
  try {
    first = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
  } catch {
    /* URL inválida → categoria padrão */
  }
  return EDITORIA_CATEGORIES[first] ?? EDITORIA_CATEGORIES.geral;
}
