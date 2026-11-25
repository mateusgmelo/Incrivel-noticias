import { defineConfig } from "vitest/config";
import path from "node:path";

/** Testes unitários: rápidos, sem banco. */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.int.test.ts", "node_modules/**"],
  },
});
