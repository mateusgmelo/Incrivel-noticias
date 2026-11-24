import { hashPassword, verifyPassword } from "@/server/core/auth/password";
import type { Actor } from "@/server/core/auth/rbac";
import { can } from "@/server/core/auth/rbac";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/core/http/errors";
import { auditService } from "@/server/modules/audit/audit.service";
import { usersRepository } from "./user.repository";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

// Quando o e-mail não existe, ainda comparamos contra um hash válido: o tempo de resposta
// fica igual e não revela quais e-mails estão cadastrados (proteção contra enumeração).
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("senha-inexistente"));

export const usersService = {
  async authenticate(email: string, password: string) {
    const user = await usersRepository.findByEmailWithHash(email);
    const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !valid) throw new UnauthorizedError("E-mail ou senha inválidos");
    if (!user.active) throw new ForbiddenError("Usuário desativado. Procure um administrador.");
    await auditService.record({ actorId: user.id, action: "auth.login", entity: "user", entityId: user.id });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  async list(actor: Actor) {
    if (!can.manageUsers(actor)) throw new ForbiddenError();
    return usersRepository.list();
  },

  async create(actor: Actor, input: CreateUserInput) {
    if (!can.manageUsers(actor)) throw new ForbiddenError();
    const existing = await usersRepository.findByEmailWithHash(input.email);
    if (existing) throw new ConflictError("Já existe um usuário com este e-mail");

    const user = await usersRepository.insert({
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    });
    await auditService.record({
      actorId: actor.id, action: "user.create", entity: "user", entityId: user.id, meta: { role: user.role },
    });
    return user;
  },

  async update(actor: Actor, id: string, input: UpdateUserInput) {
    if (!can.manageUsers(actor)) throw new ForbiddenError();
    const target = await usersRepository.findById(id);
    if (!target) throw new NotFoundError("Usuário");

    // Regra de segurança: ninguém tira o próprio acesso de admin (evita "trancar" o sistema).
    if (actor.id === id && (input.active === false || (input.role && input.role !== "ADMIN"))) {
      throw new ConflictError("Você não pode desativar ou rebaixar a própria conta");
    }

    const { password, ...rest } = input;
    const updated = await usersRepository.update(id, {
      ...rest,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    });

    await auditService.record({
      actorId: actor.id,
      action: input.role && input.role !== target.role ? "user.role_change" : "user.update",
      entity: "user",
      entityId: id,
      meta: { from: target.role, to: input.role, active: input.active, passwordChanged: !!password },
    });
    return updated;
  },
};
