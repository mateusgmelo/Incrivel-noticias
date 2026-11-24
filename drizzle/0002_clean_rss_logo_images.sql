-- Migration de dados: manchetes importadas antes do filtro de logotipos
-- ficaram com o logo do veículo como capa. Mesmo critério de isLikelyPhoto()
-- em ingest.mapper.ts. Idempotente: rodar de novo não altera nada.
UPDATE "articles"
SET "cover_image_url" = NULL
WHERE "source" = 'IMPORTED'
  AND "cover_image_url" ~* '(logo|placeholder|default[-_]?image|sem[-_]?imagem)|\.svg(\?|$)';
