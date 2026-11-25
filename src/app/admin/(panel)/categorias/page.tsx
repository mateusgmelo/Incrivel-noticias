import { CategoryManager } from "@/components/admin/CategoryManager";
import { requireUser } from "@/lib/auth";
import { categoriesService } from "@/server/modules/categories/category.service";

export default async function CategoriesPage() {
  await requireUser("EDITOR");
  const categories = await categoriesService.list();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Categorias</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
