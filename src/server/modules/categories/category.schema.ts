import { z } from "zod";

export const CategoryInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional().nullable(),
});

export type CategoryInput = z.infer<typeof CategoryInput>;
