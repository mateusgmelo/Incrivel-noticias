import { ArticleForm } from "@/components/admin/ArticleForm";
import { requireUser } from "@/lib/auth";
import { articlePolicy } from "@/server/modules/articles/article.policy";
import { categoriesService } from "@/server/modules/categories/category.service";

export default async function NewArticlePage() {
  const user = await requireUser();
  const categories = await categoriesService.list();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nova matéria</h1>
      <ArticleForm categories={categories.map(({ id, name }) => ({ id, name }))} canFeature={articlePolicy.canFeature(user)} />
    </div>
  );
}
