/** URL pública do site, sem barra no final. */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return raw.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
}

export const SITE_NAME = "Incrível Notícias";
export const SITE_DESCRIPTION =
  "Portal de notícias com cobertura de Pernambuco: política, economia, cidades, esportes, cultura e tecnologia.";
