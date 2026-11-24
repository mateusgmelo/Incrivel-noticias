import { z } from "zod";
import type { PageMeta } from "./responses";

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type Pagination = z.infer<typeof PaginationQuery>;

export function pageMeta({ page, pageSize }: Pagination, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export const offsetOf = ({ page, pageSize }: Pagination) => (page - 1) * pageSize;
