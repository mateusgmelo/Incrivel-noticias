-- Remoção de acentos IMMUTABLE (exigência de colunas geradas e índices).
-- Usa translate() nativo: não depende da extensão unaccent (que exige superusuário).
CREATE OR REPLACE FUNCTION pt_unaccent(input text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT translate(
    lower(input),
    'áàâãäåéèêëíìîïóòôõöúùûüçñ',
    'aaaaaaeeeeiiiiooooouuuucn'
  )
$$;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', pt_unaccent(coalesce(title, ''))), 'A') ||
  setweight(to_tsvector('portuguese', pt_unaccent(coalesce(excerpt, ''))), 'B') ||
  setweight(to_tsvector('portuguese', pt_unaccent(coalesce(body, ''))), 'C')) STORED;--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING gin ("search_vector");