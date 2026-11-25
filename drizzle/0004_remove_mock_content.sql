-- Migration de dados: o portal passa a ter só conteúdo real.
-- 1) Remove as matérias inventadas do seed antigo (identificadas pela capa de placeholder picsum.photos).
DELETE FROM "articles"
WHERE "source" = 'ORIGINAL'
  AND "cover_image_url" LIKE 'https://picsum.photos/%';
--> statement-breakpoint
-- 2) Remove as importações antigas da Agência Brasil, que só tinham manchete.
--    A próxima importação traz de volta as mesmas matérias com texto integral, foto e crédito.
DELETE FROM "articles"
WHERE "source" = 'IMPORTED'
  AND "full_text" = false
  AND "source_url" LIKE 'https://agenciabrasil.ebc.com.br/%';
--> statement-breakpoint
-- 3) Tags que ficaram sem nenhuma matéria.
DELETE FROM "tags" t
WHERE NOT EXISTS (SELECT 1 FROM "article_tags" at WHERE at."tag_id" = t."id");
