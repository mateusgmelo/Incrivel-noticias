import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Fronteira da arquitetura: o back-end (src/server) não conhece o front-end.
    // Regras de negócio não importam React, páginas, componentes nem helpers de UI,
    // e por isso podem ser extraídas para um serviço próprio sem reescrita.
    files: ["src/server/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/app/*", "@/components/*", "@/lib/*"], message: "src/server não pode depender do front-end." },
            { group: ["react", "react-dom", "next/navigation", "next/link", "next/image"], message: "src/server não pode depender de UI." },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
