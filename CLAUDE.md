# CLAUDE.md — Incrível Notícias

Portal de notícias (Next.js 15 App Router + Drizzle/Postgres). Projeto técnico de processo seletivo: prioridade é backend bem estruturado e sistema rodando.

## Regras invioláveis
- Backend em `src/server/`, por módulo: `*.schema.ts` (Zod) · `*.policy.ts` (autorização pura) · `*.repository.ts` (só SQL) · `*.service.ts` (regras + auditoria, sem HTTP).
- Rotas em `src/app/api` são finas: `withRoute({ auth, params, query, body }, handler)` e delegam ao service.
- Services lançam erros de `core/http/errors.ts`; nunca retornam Response.
- Resposta da API: `{ data, meta? }` ou `{ error: { code, message, details? } }`.
- Mudança de status de artigo só por endpoint de ação + `TRANSITIONS` em `article.policy.ts`.
- Toda mudança de schema: editar `src/server/db/schema.ts` → `npm run db:generate` → commitar o SQL gerado.
- Agregador: o corpo de matérias de terceiros só é armazenado quando a licença da fonte permite (modo `full` em `ingest.sources.ts`), com crédito e link. Fontes comerciais: só manchete + link. Nunca renderizar HTML de terceiros.
- Commits pequenos, conventional commits, mensagens em português.

## Comandos
`npm run db:up` · `npm run db:setup` · `npm run dev` · `npm test` · `npm run typecheck` · `npm run lint`
