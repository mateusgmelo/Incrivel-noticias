/**
 * Fontes RSS para o agregador.
 * RSS é a interface que os próprios portais publicam para consumo por terceiros:
 * mais estável que parsear HTML e sem ambiguidade jurídica.
 */
export type FeedSource = { name: string; url: string };

const DEFAULT_SOURCES: FeedSource[] = [
  { name: "g1 Pernambuco", url: "https://g1.globo.com/rss/g1/pernambuco/" },
  { name: "g1 Economia", url: "https://g1.globo.com/rss/g1/economia/" },
  { name: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml" },
];

/**
 * Permite trocar as fontes sem deploy de código: INGEST_FEEDS="Nome|https://url,Outro|https://url"
 */
function fromEnv(): FeedSource[] | null {
  const raw = process.env.INGEST_FEEDS?.trim();
  if (!raw) return null;
  const parsed = raw
    .split(",")
    .map((pair) => pair.split("|").map((s) => s.trim()))
    .filter(([name, url]) => name && url?.startsWith("http"))
    .map(([name, url]) => ({ name, url }));
  return parsed.length ? parsed : null;
}

export const feedSources = (): FeedSource[] => fromEnv() ?? DEFAULT_SOURCES;

/** Categoria onde as matérias importadas entram (criada sob demanda). */
export const IMPORT_CATEGORY = { name: "Giro de Notícias", slug: "giro-de-noticias" };
