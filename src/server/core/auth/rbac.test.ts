import { describe, expect, it } from "vitest";
import { can, hasRole } from "./rbac";

describe("hierarquia de papéis", () => {
  it("papel superior herda permissões dos inferiores", () => {
    expect(hasRole({ role: "ADMIN" }, "REPORTER")).toBe(true);
    expect(hasRole({ role: "ADMIN" }, "EDITOR")).toBe(true);
    expect(hasRole({ role: "EDITOR" }, "REPORTER")).toBe(true);
  });

  it("papel inferior não alcança o superior", () => {
    expect(hasRole({ role: "REPORTER" }, "EDITOR")).toBe(false);
    expect(hasRole({ role: "EDITOR" }, "ADMIN")).toBe(false);
  });

  it("sem ator, nenhuma permissão", () => {
    expect(hasRole(null, "REPORTER")).toBe(false);
  });

  it("permissões nomeadas refletem a matriz documentada", () => {
    expect(can.manageUsers({ role: "EDITOR" })).toBe(false);
    expect(can.manageUsers({ role: "ADMIN" })).toBe(true);
    expect(can.manageCategories({ role: "EDITOR" })).toBe(true);
    expect(can.manageCategories({ role: "REPORTER" })).toBe(false);
    expect(can.runIngest({ role: "REPORTER" })).toBe(false);
  });
});
