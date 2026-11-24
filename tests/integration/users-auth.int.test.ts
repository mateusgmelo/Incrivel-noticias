import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, UnauthorizedError } from "@/server/core/http/errors";
import { categoriesService } from "@/server/modules/categories/category.service";
import { articlesService } from "@/server/modules/articles/article.service";
import { usersService } from "@/server/modules/users/user.service";
import { usersRepository } from "@/server/modules/users/user.repository";
import { articleInput, PASSWORD, seedBase } from "./fixtures";

let ctx: Awaited<ReturnType<typeof seedBase>>;
beforeEach(async () => {
  ctx = await seedBase();
});

describe("autenticação", () => {
  it("autentica com senha correta e nunca expõe o hash", async () => {
    const user = await usersService.authenticate(ctx.editor.email, PASSWORD);
    expect(user).toEqual({ id: ctx.editor.id, name: ctx.editor.name, email: ctx.editor.email, role: "EDITOR" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("senha errada e e-mail inexistente retornam o mesmo erro (sem enumeração)", async () => {
    const wrong = usersService.authenticate(ctx.editor.email, "senha-errada");
    const ghost = usersService.authenticate("ninguem@teste.dev", "qualquer");
    await expect(wrong).rejects.toThrow(new UnauthorizedError("E-mail ou senha inválidos"));
    await expect(ghost).rejects.toThrow(new UnauthorizedError("E-mail ou senha inválidos"));
  });

  it("usuário desativado não entra", async () => {
    await usersService.update(ctx.admin, ctx.reporter.id, { active: false });
    await expect(usersService.authenticate(ctx.reporter.email, PASSWORD)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("gestão de usuários", () => {
  it("só admin gerencia usuários", async () => {
    await expect(usersService.list(ctx.editor)).rejects.toBeInstanceOf(ForbiddenError);
    expect(await usersService.list(ctx.admin)).toHaveLength(3);
  });

  it("e-mail duplicado é conflito", async () => {
    const input = { name: "Outra Pessoa", email: ctx.reporter.email, password: "Senha@1234", role: "REPORTER" as const };
    await expect(usersService.create(ctx.admin, input)).rejects.toBeInstanceOf(ConflictError);
  });

  it("admin não pode rebaixar nem desativar a si mesmo", async () => {
    await expect(usersService.update(ctx.admin, ctx.admin.id, { role: "EDITOR" })).rejects.toBeInstanceOf(ConflictError);
    await expect(usersService.update(ctx.admin, ctx.admin.id, { active: false })).rejects.toBeInstanceOf(ConflictError);
  });

  it("troca de papel vale imediatamente e a nova senha passa a funcionar", async () => {
    await usersService.update(ctx.admin, ctx.reporter.id, { role: "EDITOR", password: "NovaSenha@2026" });
    expect((await usersRepository.findById(ctx.reporter.id))?.role).toBe("EDITOR");
    await expect(usersService.authenticate(ctx.reporter.email, "NovaSenha@2026")).resolves.toMatchObject({ role: "EDITOR" });
  });
});

describe("categorias", () => {
  it("repórter não cria categoria; editor cria com slug gerado", async () => {
    await expect(categoriesService.create(ctx.reporter, { name: "Cultura" })).rejects.toBeInstanceOf(ForbiddenError);
    const c = await categoriesService.create(ctx.editor, { name: "Ciência & Saúde" });
    expect(c.slug).toBe("ciencia-e-saude");
  });

  it("não exclui categoria com matérias (integridade referencial)", async () => {
    await articlesService.create(ctx.editor, articleInput(ctx.politica.id));
    await expect(categoriesService.remove(ctx.editor, ctx.politica.id)).rejects.toBeInstanceOf(ConflictError);
    await categoriesService.remove(ctx.editor, ctx.esportes.id);
  });
});
