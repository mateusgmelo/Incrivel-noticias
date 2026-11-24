import { z } from "zod";

const role = z.enum(["REPORTER", "EDITOR", "ADMIN"]);
const password = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);

export const LoginInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export const CreateUserInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: role.default("REPORTER"),
});

export const UpdateUserInput = z
  .object({
    name: z.string().trim().min(2).max(120),
    role,
    active: z.boolean(),
    password,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo");

export type CreateUserInput = z.infer<typeof CreateUserInput>;
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;
