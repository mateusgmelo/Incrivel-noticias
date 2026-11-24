import { defineConfig } from "vitest/config";
import path from "node:path";

/** Testes de integração: rodam contra um Postgres real (local ou service do CI). */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.int.test.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    fileParallelism: false, // banco compartilhado: arquivos em sequência
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
