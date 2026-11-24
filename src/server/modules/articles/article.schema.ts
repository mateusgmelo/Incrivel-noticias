import { z } from "zod";
import { PaginationQuery } from "@/server/core/http/pagination";

const optionalUrl = z
  .string()
  .trim()
  .url("URL da imagem inválida")
  .max(1000)
  .or(z.literal("").transform(() => null))
  .nullable()
  .optional();

export const ArticleInput = z.object({
  title: z.string().trim().min(8, "Título muito curto").max(200),
  excerpt: z.string().trim().min(20, "Resumo deve ter ao menos 20 caracteres").max(400),
  body: z.string().trim().min(50, "Corpo deve ter ao menos 50 caracteres").max(50_000),
  coverImageUrl: optionalUrl,
  categoryId: z.string().uuid("Categoria inválida"),
  featured: z.boolean().optional(),
  tags: z.array(z.string().trim().min(2).max(60)).max(8).optional(),
});

export const ArticleUpdateInput = ArticleInput.partial().refine(
  (v) => Object.keys(v).length > 0,
  "Informe ao menos um campo",
);

export const ArticleActionParam = z.object({
  id: z.string().uuid(),
  action: z.enum(["submit", "publish", "reject", "archive"]),
});

export const PublicListQuery = PaginationQuery.extend({
  category: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(80).optional(),
  q: z.string().trim().max(100).optional(),
});

export const AdminListQuery = PaginationQuery.extend({
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  q: z.string().trim().max(100).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const IdParam = z.object({ id: z.string().uuid() });
export const SlugParam = z.object({ slug: z.string().trim().min(1).max(220) });

export type ArticleInput = z.infer<typeof ArticleInput>;
export type ArticleUpdateInput = z.infer<typeof ArticleUpdateInput>;
export type PublicListQuery = z.infer<typeof PublicListQuery>;
export type AdminListQuery = z.infer<typeof AdminListQuery>;
