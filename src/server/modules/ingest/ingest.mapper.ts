/**
 * Converte um item de feed RSS em dados de artigo.
 * Função pura (testável sem rede). Política de conteúdo:
 *   guardamos SOMENTE manchete, resumo publicado no próprio feed, link e fonte.
 *   O corpo da matéria original nunca é copiado — o leitor é levado ao site de origem.
 */
export type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string; type?: string };
  media?: { $?: { url?: string } };
  /** Campo próprio da Agência Brasil com a foto principal. */
  imagemDestaque?: string;
  /** dc:creator — crédito do autor. */
  creator?: string;
};

export type MappedItem = {
  title: string;
  excerpt: string;
  sourceUrl: string;
  sourceName: string;
  coverImageUrl: string | null;
  publishedAt: Date;
};

const MAX_EXCERPT = 280;

export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max = MAX_EXCERPT): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function firstImage(html?: string): string | null {
  const m = html?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

function isHttpUrl(value?: string | null): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Alguns feeds (ex.: Agência Brasil) mandam o logotipo do veículo quando a matéria
 * não tem foto. Logo não é capa: nesses casos preferimos ficar sem imagem.
 */
const NOT_A_PHOTO = /(logo|placeholder|default[-_]?image|sem[-_]?imagem)|\.svg(\?|$)/i;

export function isLikelyPhoto(url: string): boolean {
  return !NOT_A_PHOTO.test(url);
}

export function mapFeedItem(item: FeedItem, sourceName: string, now = new Date()): MappedItem | null {
  const title = stripHtml(item.title ?? "");
  const link = item.link?.trim();
  if (!title || !isHttpUrl(link)) return null;

  const rawSummary = item.contentSnippet || item.summary || stripHtml(item.content ?? "");
  const summary = truncate(stripHtml(rawSummary || title));
  const excerpt = summary.length >= 20 ? summary : truncate(`${title}. Leia a matéria completa na fonte.`);

  const enclosureImage =
    item.enclosure?.type?.startsWith("image") || !item.enclosure?.type ? item.enclosure?.url : undefined;
  const image = item.imagemDestaque?.trim() || enclosureImage || item.media?.$?.url || firstImage(item.content);

  const date = new Date(item.isoDate ?? item.pubDate ?? now);
  return {
    title: truncate(title, 200),
    excerpt,
    sourceUrl: link,
    sourceName,
    coverImageUrl: isHttpUrl(image) && isLikelyPhoto(image) ? image : null,
    publishedAt: Number.isNaN(date.getTime()) || date > now ? now : date,
  };
}
