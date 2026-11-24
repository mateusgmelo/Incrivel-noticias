import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" só no build Docker (no Windows o tracing com symlinks pode falhar).
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  // Fixa a raiz do projeto (evita o Next "adotar" um package-lock.json de pasta acima).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
