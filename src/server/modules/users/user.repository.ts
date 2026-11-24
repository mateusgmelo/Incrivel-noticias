import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, type User } from "@/server/db/schema";

/** Colunas seguras para expor — passwordHash nunca sai do repository. */
const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
};

export type PublicUser = Omit<User, "passwordHash" | "updatedAt">;

export const usersRepository = {
  findById: async (id: string): Promise<PublicUser | null> => {
    const [row] = await db().select(publicColumns).from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  },

  /** Único método que devolve o hash — usado apenas no login. */
  findByEmailWithHash: async (email: string): Promise<User | null> => {
    const [row] = await db().select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  },

  list: () => db().select(publicColumns).from(users).orderBy(asc(users.name)),

  insert: async (data: typeof users.$inferInsert) => {
    const [row] = await db().insert(users).values(data).returning(publicColumns);
    return row;
  },

  update: async (id: string, data: Partial<typeof users.$inferInsert>) => {
    const [row] = await db().update(users).set(data).where(eq(users.id, id)).returning(publicColumns);
    return row ?? null;
  },

};
