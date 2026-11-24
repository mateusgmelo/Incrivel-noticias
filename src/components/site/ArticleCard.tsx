import Link from "next/link";
import type { ArticleCard as Card } from "@/server/modules/articles/article.repository";
import { timeAgo } from "@/lib/format";

type Variant = "hero" | "default" | "compact" | "list";

export function ArticleCard({ article, variant = "default" }: { article: Card; variant?: Variant }) {
  const href = `/noticia/${article.slug}`;
  const kicker = (
    <Link href={`/categoria/${article.categorySlug}`} className="text-xs font-bold uppercase tracking-wider text-brand hover:underline">
      {article.categoryName}
    </Link>
  );
  const meta = (
    <p className="text-xs text-muted">
      {article.source === "IMPORTED" ? `via ${article.sourceName}` : article.authorName} · {timeAgo(article.publishedAt)}
    </p>
  );

  if (variant === "hero") {
    return (
      <article className="group">
        <Link href={href} className="block overflow-hidden rounded-lg bg-line">
          {article.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          )}
        </Link>
        <div className="mt-4 space-y-2">
          {kicker}
          <h2 className="headline text-2xl font-bold leading-tight sm:text-4xl">
            <Link href={href} className="hover:text-brand">{article.title}</Link>
          </h2>
          <p className="text-base text-muted sm:text-lg">{article.excerpt}</p>
          {meta}
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="space-y-1 border-b border-line pb-3 last:border-0">
        {kicker}
        <h3 className="headline text-lg font-bold leading-snug">
          <Link href={href} className="hover:text-brand">{article.title}</Link>
        </h3>
        {meta}
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article className="group flex gap-4 border-b border-line py-5 first:pt-0">
        <div className="min-w-0 flex-1 space-y-1.5">
          {kicker}
          <h3 className="headline text-xl font-bold leading-snug">
            <Link href={href} className="hover:text-brand">{article.title}</Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted">{article.excerpt}</p>
          {meta}
        </div>
        {article.coverImageUrl && (
          <Link href={href} className="hidden shrink-0 overflow-hidden rounded-md sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverImageUrl} alt="" className="h-28 w-44 object-cover" loading="lazy" />
          </Link>
        )}
      </article>
    );
  }

  return (
    <article className="group space-y-2">
      <Link href={href} className="block overflow-hidden rounded-md bg-line">
        {article.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImageUrl} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        )}
      </Link>
      {kicker}
      <h3 className="headline text-lg font-bold leading-snug">
        <Link href={href} className="hover:text-brand">{article.title}</Link>
      </h3>
      <p className="line-clamp-2 text-sm text-muted">{article.excerpt}</p>
      {meta}
    </article>
  );
}
