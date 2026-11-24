import type { Role } from "@/server/db/schema";

/** Usuário autenticado, como os services o enxergam. */
export type Actor = { id: string; name: string; email: string; role: Role };

/**
 * Hierarquia numérica: um papel "contém" os de nível inferior.
 * Comparar números evita listas de papéis espalhadas pelo código.
 */
const RANK: Record<Role, number> = { REPORTER: 1, EDITOR: 2, ADMIN: 3 };

export const ROLES: readonly Role[] = ["REPORTER", "EDITOR", "ADMIN"] as const;

export const ROLE_LABEL: Record<Role, string> = {
  REPORTER: "Repórter",
  EDITOR: "Editor",
  ADMIN: "Administrador",
};

export function hasRole(actor: Pick<Actor, "role"> | null | undefined, minimum: Role): boolean {
  return !!actor && RANK[actor.role] >= RANK[minimum];
}

/** Permissões nomeadas — a UI e a API consultam a mesma fonte. */
export const can = {
  manageUsers: (a: Pick<Actor, "role">) => hasRole(a, "ADMIN"),
  manageCategories: (a: Pick<Actor, "role">) => hasRole(a, "EDITOR"),
  runIngest: (a: Pick<Actor, "role">) => hasRole(a, "EDITOR"),
  viewAllArticles: (a: Pick<Actor, "role">) => hasRole(a, "EDITOR"),
  viewAudit: (a: Pick<Actor, "role">) => hasRole(a, "ADMIN"),
};
