import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleActions } from "@/components/admin/ArticleActions";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/core/auth/session";
import { ForbiddenError, NotFoundError } from "@/server/core/http/errors";
import { articlesService } from "@/server/modules/articles/article.service";
import { categoriesService } from "@/server/modules/categories/category.service";

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let article: Awaited<ReturnType<typeof articlesService.getForAdmin>>;
  try {
    article = await articlesService.getForAdmin(user, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    if (err instanceof ForbiddenError) redirect("/admin?erro=permissao");
    throw err;
  }
  const categories = await categoriesService.list();
  const { permissions: p } = article;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/artigos" className="text-sm text-muted hover:text-ink">← Matérias</Link>
          <h1 className="text-2xl font-bold">{p.edit ? "Editar matéria" : "Visualizar matéria"}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <StatusBadge status={article.status} />
            <span>por {article.authorName}</span>
            <span>· criada {formatDateTime(article.createdAt)}</span>
            {article.publishedAt && (article.status === "PUBLISHED" || article.status === "ARCHIVED") && <span>· publicada {formatDateTime(article.publishedAt)}</span>}
            {article.status === "PUBLISHED" && (
              <Link href={`/noticia/${article.slug}`} target="_blank" className="font-medium text-brand">ver no site ↗</Link>
            )}
          </div>
        </div>
        <ArticleActions id={article.id} actions={p.actions} canDelete={p.delete} />
      </div>

      {article.source === "IMPORTED" && (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Manchete importada de <strong>{article.sourceName}</strong>. Ao publicar, o site exibe só título e resumo, com link para{" "}
          <a href={article.sourceUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="underline">a matéria original</a>.
        </p>
      )}
      {!p.edit && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Esta matéria está <strong>em revisão</strong> e não pode mais ser editada por você. Um editor irá publicá-la ou devolvê-la.
        </p>
      )}

      <ArticleForm
        categories={categories.map(({ id, name }) => ({ id, name }))}
        canFeature={p.feature}
        readOnly={!p.edit}
        initial={{
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          coverImageUrl: article.coverImageUrl ?? "",
          categoryId: article.categoryId,
          featured: article.featured,
          tags: article.tags.map((t) => t.name).join(", "),
        }}
      />
    </div>
  );
}
