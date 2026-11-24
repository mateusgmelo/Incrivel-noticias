import { buildRssFeed } from "@/lib/rss";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { articlesService } from "@/server/modules/articles/article.service";

export const dynamic = "force-dynamic";

/** GET /feed.xml — RSS 2.0 com as matérias próprias publicadas mais recentes. */
export async function GET() {
  const { items } = await articlesService.listPublished({ page: 1, pageSize: 30 });
  const xml = buildRssFeed({
    site: siteUrl(),
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    entries: items.filter((a) => a.source === "ORIGINAL"), // agregadas pertencem às fontes
  });
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
