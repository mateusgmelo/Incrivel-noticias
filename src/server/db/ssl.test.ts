import { describe, expect, it } from "vitest";
import { pgConfig, sslFor } from "./ssl";

describe("política de SSL do banco", () => {
  it("banco local não usa SSL", () => {
    expect(sslFor("postgresql://u:p@localhost:5433/db")).toBe(false);
    expect(sslFor("postgresql://u:p@db:5432/db")).toBe(false);
  });

  it("banco remoto exige SSL com verificação, mesmo sem sslmode na URL", () => {
    expect(sslFor("postgresql://u:p@ep-x.us-east-1.aws.neon.tech/db")).toEqual({ rejectUnauthorized: true });
  });

  it("remove parâmetros de SSL da URL para não conflitar com a configuração explícita", () => {
    const cfg = pgConfig("postgresql://u:p@ep-x.neon.tech/db?sslmode=require&channel_binding=require");
    expect(cfg.connectionString).toBe("postgresql://u:p@ep-x.neon.tech/db");
    expect(cfg.ssl).toEqual({ rejectUnauthorized: true });
  });
});
