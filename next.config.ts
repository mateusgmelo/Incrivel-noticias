import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 * - Scripts e estilos só do próprio site ('unsafe-inline' é exigido pelos scripts inline do
 *   Next sem nonce e pelo JSON-LD; 'unsafe-eval' só em desenvolvimento, para o hot reload).
 * - Imagens de qualquer origem HTTPS: capas vêm das agências de notícia.
 * - frame-ancestors 'none': o site não pode ser embutido em iframe (anti-clickjacking).
 * - vercel.live: barra de comentários dos previews da Vercel.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""} https://vercel.live`,
  "frame-src https://vercel.live",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Sem upgrade-insecure-requests: quebraria o `docker compose` em http://localhost. Em produção o HSTS cobre.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // "standalone" só no build Docker (no Windows o tracing com symlinks pode falhar).
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  // Fixa a raiz do projeto (evita o Next "adotar" um package-lock.json de pasta acima).
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
