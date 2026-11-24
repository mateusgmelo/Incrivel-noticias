/**
 * Gera o feed RSS 2.0 do próprio portal — o mesmo formato que o agregador consome.
 * Função pura: recebe dados, devolve XML (testada em rss.test.ts).
 */
export type FeedEntry = {
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string;
  authorName: string;
  publishedAt: Date | null;
  coverImageUrl: string | null;
};

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // remove caracteres de controle inválidos em XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export function buildRssFeed(opts: {
  site: string;
  title: string;
  description: string;
  entries: FeedEntry[];
  now?: Date;
}): string {
  const { site, title, description, entries } = opts;
  const lastBuild = entries[0]?.publishedAt ?? opts.now ?? new Date();

  const items = entries
    .map((e) => {
      const link = `${site}/noticia/${e.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(e.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${escapeXml(e.excerpt)}</description>`,
        `      <category>${escapeXml(e.categoryName)}</category>`,
        `      <dc:creator>${escapeXml(e.authorName)}</dc:creator>`,
        e.publishedAt ? `      <pubDate>${e.publishedAt.toUTCString()}</pubDate>` : "",
        e.coverImageUrl ? `      <enclosure url="${escapeXml(e.coverImageUrl)}" type="image/jpeg" length="0" />` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(site)}</link>
    <description>${escapeXml(description)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${site}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
