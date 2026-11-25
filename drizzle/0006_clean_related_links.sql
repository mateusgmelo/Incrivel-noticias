-- Migration de dados: matérias importadas antes da correção do extrator ficaram com o bloco
-- "Notícias relacionadas: ..." achatado num parágrafo. Remove esse parágrafo do corpo.
-- Mesmo critério do extrator (SKIP_HEADING). Idempotente.
UPDATE "articles"
SET "body" = btrim(regexp_replace("body", '(^|\n\n)(Notícias relacionadas|Leia também|Veja também|Saiba mais)\s*:?[^\n]*', '', 'g'), E'\n')
WHERE "source" = 'IMPORTED'
  AND "full_text" = true
  AND "body" ~ '(^|\n\n)(Notícias relacionadas|Leia também|Veja também|Saiba mais)';
