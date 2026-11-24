import { describe, expect, it } from "vitest";
import { articlePolicy } from "./article.policy";

const reporter = { id: "u-reporter", role: "REPORTER" as const };
const otherReporter = { id: "u-other", role: "REPORTER" as const };
const editor = { id: "u-editor", role: "EDITOR" as const };
const admin = { id: "u-admin", role: "ADMIN" as const };

const draftByReporter = { authorId: reporter.id, status: "DRAFT" as const };
const reviewByReporter = { authorId: reporter.id, status: "IN_REVIEW" as const };
const published = { authorId: reporter.id, status: "PUBLISHED" as const };
const archived = { authorId: reporter.id, status: "ARCHIVED" as const };

describe("articlePolicy — visualização e edição", () => {
  it("repórter vê e edita o próprio rascunho", () => {
    expect(articlePolicy.canView(reporter, draftByReporter)).toBe(true);
    expect(articlePolicy.canEdit(reporter, draftByReporter)).toBe(true);
  });

  it("repórter não vê nem edita matéria de outro repórter", () => {
    expect(articlePolicy.canView(otherReporter, draftByReporter)).toBe(false);
    expect(articlePolicy.canEdit(otherReporter, draftByReporter)).toBe(false);
  });

  it("repórter perde a edição após enviar para revisão", () => {
    expect(articlePolicy.canEdit(reporter, reviewByReporter)).toBe(false);
  });

  it("editor e admin editam qualquer matéria em qualquer estado", () => {
    for (const actor of [editor, admin]) {
      for (const article of [draftByReporter, reviewByReporter, published, archived]) {
        expect(articlePolicy.canEdit(actor, article)).toBe(true);
      }
    }
  });
});

describe("articlePolicy — exclusão", () => {
  it("autor exclui apenas o próprio rascunho", () => {
    expect(articlePolicy.canDelete(reporter, draftByReporter)).toBe(true);
    expect(articlePolicy.canDelete(reporter, published)).toBe(false);
  });

  it("editor não exclui publicadas (deve arquivar)", () => {
    expect(articlePolicy.canDelete(editor, published)).toBe(false);
  });

  it("admin pode excluir qualquer matéria", () => {
    expect(articlePolicy.canDelete(admin, published)).toBe(true);
  });
});

describe("articlePolicy — máquina de estados", () => {
  it("autor envia o próprio rascunho para revisão", () => {
    expect(articlePolicy.canTransition(reporter, draftByReporter, "submit")).toEqual({ allowed: true });
  });

  it("repórter não publica, nem a própria matéria", () => {
    expect(articlePolicy.canTransition(reporter, reviewByReporter, "publish")).toEqual({
      allowed: false,
      reason: "FORBIDDEN",
    });
  });

  it("editor publica matéria em revisão", () => {
    expect(articlePolicy.canTransition(editor, reviewByReporter, "publish")).toEqual({ allowed: true });
  });

  it("transição inválida para o estado retorna INVALID_STATE (não FORBIDDEN)", () => {
    expect(articlePolicy.canTransition(editor, draftByReporter, "archive")).toEqual({
      allowed: false,
      reason: "INVALID_STATE",
    });
    expect(articlePolicy.canTransition(editor, published, "reject")).toEqual({
      allowed: false,
      reason: "INVALID_STATE",
    });
  });

  it("matéria arquivada pode ser republicada por editor", () => {
    expect(articlePolicy.canTransition(editor, archived, "publish")).toEqual({ allowed: true });
  });

  it("availableActions lista só o que o ator pode fazer agora", () => {
    expect(articlePolicy.availableActions(reporter, draftByReporter)).toEqual(["submit"]);
    expect(articlePolicy.availableActions(reporter, reviewByReporter)).toEqual([]);
    expect(articlePolicy.availableActions(editor, reviewByReporter).sort()).toEqual(["publish", "reject"]);
    expect(articlePolicy.availableActions(editor, published)).toEqual(["archive"]);
  });
});
