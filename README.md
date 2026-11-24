# Incrível Notícias

[![CI](https://github.com/mateusgmelo/incrivel-noticias/actions/workflows/ci.yml/badge.svg)](https://github.com/mateusgmelo/incrivel-noticias/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-22.x-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

Portal de notícias com painel editorial, controle de acesso por hierarquia e agregador de manchetes via RSS.

**Stack:** Next.js 15 (App Router) · TypeScript · PostgreSQL 16 · Drizzle ORM · Zod · JWT (jose) · Tailwind CSS 4 · Vitest · Docker · Vercel + Neon

> 🔗 **Produção:** https://incrivelnoticias.vercel.app · painel em [/admin](https://incrivelnoticias.vercel.app/admin) · status em [/api/health](https://incrivelnoticias.vercel.app/api/health)
> 👤 **Contas de demonstração** (senha `Incrivel@2026`): `admin@incrivelnoticias.com` · `editor@incrivelnoticias.com` · `reporter@incrivelnoticias.com`

---

## Sumário
1. [Como rodar](#como-rodar)
2. [Arquitetura](#arquitetura)
3. [Modelo de dados](#modelo-de-dados)
4. [Hierarquia de acesso (RBAC)](#hierarquia-de-acesso-rbac)
5. [Fluxo editorial](#fluxo-editorial-máquina-de-estados)
6. [API](#api)
7. [Agregador RSS](#agregador-rss)
8. [Deploy](#deploy-vercel--neon)
9. [Decisões técnicas](#decisões-técnicas)
10. [Limitações conhecidas e próximos passos](#limitações-conhecidas-e-próximos-passos)

---

## Como rodar

Pré-requisitos: Node 20+ e Docker.

```bash
cp .env.example .env         # valores padrão já apontam para o Postgres do docker compose
npm install
npm run db:up                # sobe Postgres 16 (+ Adminer em http://localhost:8080)
npm run db:setup             # aplica migrations + popula dados de demonstração
npm run dev                  # http://localhost:3000  |  painel: /admin
```

### Stack completa em containers
```bash
docker compose --profile full up --build
```
Sobe o banco, roda migrations + seed em um container efêmero (`migrate`) e só então inicia a aplicação (`app`) a partir de uma imagem multi-stage com output `standalone`.

### Integração contínua
Todo push e pull request roda no GitHub Actions: **lint → typecheck → testes → build de produção**. A Vercel gera um *preview deploy* por PR, e só o merge na `main` publica em produção.

### Scripts
| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `start` | Build e execução de produção |
| `npm test` | Testes unitários (Vitest) |
| `npm run typecheck` / `lint` | TypeScript estrito e ESLint |
| `npm run db:generate` | Gera nova migration SQL a partir do schema |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:seed` | Popula dados de demonstração (idempotente) |
| `npm run db:studio` | Drizzle Studio (GUI do banco) |

---

## Arquitetura

O backend vive em `src/server/`, **isolado do framework**. As rotas em `src/app/api` são cascas finas que declaram o contrato e delegam ao service. Isso torna o domínio testável sem HTTP e extraível para outro runtime (ex.: NestJS/Express) sem reescrita.

```
Requisição HTTP
      │
      ▼
src/app/api/**/route.ts       ← declara: papel mínimo + schemas Zod de entrada
      │
      ▼
core/http/route.ts (withRoute) ← autentica, autoriza, valida, trata erros, padroniza resposta
      │
      ▼
modules/*/*.service.ts        ← regras de negócio + auditoria (não conhece HTTP)
      │            │
      ▼            ▼
*.policy.ts     *.repository.ts ← policy: autorização pura | repository: só SQL
                   │
                   ▼
               PostgreSQL
```

```
src/
├── app/
│   ├── (site)/              Portal público: capa, matéria, categoria, tag, busca
│   ├── admin/               Painel: login, dashboard, matérias, categorias, usuários, auditoria
│   └── api/                 Rotas REST (finas)
├── components/              UI (site + admin)
├── middleware.ts            Barreira de sessão do /admin (Edge)
└── server/
    ├── core/
    │   ├── auth/            JWT, sessão, senha (bcrypt), RBAC, rate limit
    │   ├── config/env.ts    Variáveis de ambiente validadas com Zod
    │   ├── http/            withRoute, erros de domínio, respostas, paginação
    │   └── utils/
    ├── db/                  schema.ts (fonte da verdade) + client
    └── modules/
        ├── articles/        schema · policy · repository · service (+ testes)
        ├── categories/
        ├── users/
        ├── ingest/          agregador RSS (mapper puro + testes)
        └── audit/
drizzle/                     Migrations SQL versionadas
scripts/                     migrate.ts, seed.ts
```

### Contrato de resposta
```jsonc
// sucesso
{ "data": { ... }, "meta": { "page": 1, "pageSize": 12, "total": 17, "totalPages": 2 } }
// erro
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos", "details": { "fieldErrors": { "title": ["Título muito curto"] } } } }
```

| Erro de domínio | HTTP |
|---|---|
| `BadRequestError` (JSON malformado, Content-Type) | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` (transição inválida, e-mail duplicado, FK em uso) | 409 |
| `ValidationError` (Zod) | 422 |
| `TooManyRequestsError` (login) | 429 |

---

## Modelo de dados

```
users ──1:N── articles ──N:1── categories
                 │
                 └──N:N── tags   (via article_tags)

audit_logs ──N:1── users (ator, SET NULL ao remover)
```

| Tabela | Destaques |
|---|---|
| `users` | `email` único · `password_hash` (bcrypt) · `role` enum · `active` (desativar em vez de apagar preserva autoria) |
| `categories` | `name` e `slug` únicos |
| `articles` | `status` enum · `published_at` só na 1ª publicação · `source` ORIGINAL/IMPORTED · `source_url` **único** (deduplicação) · FKs `RESTRICT` |
| `tags` / `article_tags` | N:N com PK composta e `CASCADE` |
| `audit_logs` | ator, ação, entidade, `meta` JSONB |

**Índices** pensados a partir das consultas reais:
- `(status, published_at DESC)` → capa e listagens públicas
- `(category_id, status)` → página de editoria
- `(author_id)` → "Minhas matérias" do repórter
- `(entity, entity_id)` e `(created_at DESC)` → auditoria

---

## Hierarquia de acesso (RBAC)

`REPORTER < EDITOR < ADMIN` — cada papel herda o anterior (comparação numérica em `core/auth/rbac.ts`).

| Ação | Repórter | Editor | Admin |
|---|:-:|:-:|:-:|
| Criar matéria | ✅ | ✅ | ✅ |
| Ver/editar **próprio rascunho** | ✅ | ✅ | ✅ |
| Ver/editar matéria de outros | ❌ | ✅ | ✅ |
| Enviar para revisão | ✅ (própria) | ✅ | ✅ |
| Publicar · devolver · arquivar | ❌ | ✅ | ✅ |
| Destacar na capa | ❌ | ✅ | ✅ |
| Excluir | só próprio rascunho | só rascunho próprio | ✅ |
| Categorias | ❌ | ✅ | ✅ |
| Importar RSS | ❌ | ✅ | ✅ |
| Usuários e papéis · auditoria | ❌ | ❌ | ✅ |

**Garantias de segurança:**
- **Defesa em camadas:** middleware (sessão) → `withRoute` (papel mínimo) → `policy` (regra fina por recurso).
- **Revogação imediata:** o JWT prova identidade, mas papel e `active` são relidos do banco a cada requisição. Desativar ou rebaixar alguém tem efeito na hora.
- Admin não pode desativar nem rebaixar a própria conta (evita "trancar" o sistema).
- Login com tempo constante para e-mail inexistente (anti-enumeração) e rate limit.
- Cookie `httpOnly` + `SameSite=Lax` + `Secure` em produção; mutações exigem `application/json` (mitiga CSRF por formulário).
- `password_hash` nunca sai do repository.
- A UI do painel é montada pelas **mesmas** funções de permissão da API — o botão só aparece se a API vai aceitar.

---

## Fluxo editorial (máquina de estados)

```
DRAFT ──submit──► IN_REVIEW ──publish──► PUBLISHED ──archive──► ARCHIVED
  ▲                   │                      ▲                       │
  └──────reject───────┘                      └────────publish────────┘
```

Transições são **endpoints de ação** (`POST /api/admin/articles/:id/publish`), não `PATCH { status }`. Cada ação tem sua regra, fica auditada e retorna `409` com os estados permitidos quando inválida para o estado atual. A tabela de transições está em `article.policy.ts` e é coberta por testes.

Regras adicionais: o slug acompanha o título enquanto rascunho e **congela após a primeira publicação** (não quebra links/SEO); republicar preserva a data original.

---

## API

### Pública
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status da aplicação e do banco |
| GET | `/api/articles?page&pageSize&category&tag&q` | Matérias publicadas, paginadas |
| GET | `/api/articles/:slug` | Matéria publicada |
| POST | `/api/articles/:slug/view` | Contabiliza leitura |
| GET | `/api/categories` | Categorias com contagem de publicadas |

### Autenticação
| Método | Rota | |
|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` → cookie de sessão |
| POST | `/api/auth/logout` | Encerra a sessão |
| GET | `/api/auth/me` | Usuário atual |

### Painel (autenticada)
| Método | Rota | Papel mínimo |
|---|---|---|
| GET · POST | `/api/admin/articles` | Repórter (vê só as próprias) |
| GET · PATCH · DELETE | `/api/admin/articles/:id` | Repórter + policy |
| POST | `/api/admin/articles/:id/{submit\|publish\|reject\|archive}` | Repórter + policy |
| GET | `/api/admin/stats` | Repórter |
| GET · POST | `/api/admin/categories` | Repórter / Editor |
| PATCH · DELETE | `/api/admin/categories/:id` | Editor |
| GET · POST | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id` | Admin |
| POST | `/api/admin/ingest` | Editor |
| GET | `/api/admin/audit` | Admin |
| GET | `/api/cron/ingest` | `Authorization: Bearer $CRON_SECRET` |

Exemplo:
```bash
curl -c s.txt -H 'content-type: application/json' \
  -d '{"email":"editor@incrivelnoticias.com","password":"Incrivel@2026"}' localhost:3000/api/auth/login
curl -b s.txt 'localhost:3000/api/admin/articles?status=IN_REVIEW'
```

---

## Agregador RSS

Diferencial do projeto: importa manchetes de outros portais para curadoria editorial.

**Por que RSS e não scraping de HTML:** RSS é a interface que os próprios veículos publicam para consumo por terceiros. É estável (não quebra quando o site muda o layout), leve e não tem ambiguidade de uso.

**Política de conteúdo — deliberada:** armazenamos **apenas** título, o resumo que a própria fonte publica no feed, link e nome da fonte. **O corpo das matérias nunca é copiado.** Na página, a matéria importada exibe a atribuição e um botão para ler na fonte, e o `<link rel="canonical">` aponta para o original. Copiar texto integral de outro veículo seria violação de direito autoral; agregar manchete + link é a prática de agregadores legítimos.

**Fluxo:**
1. Editor clica em "Importar manchetes" no painel (ou o Vercel Cron dispara diariamente).
2. As fontes são lidas **em paralelo**; falha de uma não afeta as outras (resultado por fonte).
3. Cada item passa por `mapFeedItem` (função pura, testada): remove HTML, limita resumo a 280 caracteres, valida URL, corrige datas futuras.
4. `INSERT … ON CONFLICT (source_url) DO NOTHING` → **idempotente**: rodar 10 vezes não duplica nada.
5. Entra como `IMPORTED` + `IN_REVIEW` na categoria "Giro de Notícias": nada vai ao ar sem um editor aprovar.

Fontes em `src/server/modules/ingest/ingest.sources.ts`, sobrescrevíveis sem deploy de código via `INGEST_FEEDS="Nome|https://url,Outro|https://url"`.

---

## Deploy (Vercel + Neon)

A Vercel é serverless e não executa containers nem bancos, então o Docker cobre o ambiente local/portável e o Postgres de produção é o **Neon** (gerenciado, mesmo motor do ambiente local).

1. No Neon, copie duas connection strings: **pooled** (host com `-pooler`) e **direct**.
2. Na Vercel → Settings → Environment Variables:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | string **pooled** do Neon |
| `DIRECT_URL` | string **direct** do Neon |
| `JWT_SECRET` | 48+ caracteres aleatórios |
| `CRON_SECRET` | segredo aleatório |
| `NEXT_PUBLIC_SITE_URL` | URL pública do deploy |

3. O script `vercel-build` aplica as migrations pendentes **antes** do build — cada deploy deixa o schema em dia automaticamente.
4. Seed (uma vez), da sua máquina, apontando para o Neon:
   ```bash
   DATABASE_URL="<direct>" DIRECT_URL="<direct>" npm run db:seed
   ```

Por que duas URLs: a aplicação usa o pooler (muitas funções serverless, poucas conexões reais no Postgres); migrations usam conexão direta, que DDL exige.

---

## Decisões técnicas

| Decisão | Motivo |
|---|---|
| **Next.js monolito modular** | Um deploy, SSR para SEO de portal de notícias; backend isolado em `src/server` mantém a separação que um serviço dedicado teria. |
| **Drizzle ORM** | TypeScript puro, sem binário nativo (sem problemas de engine em serverless/Windows), SQL explícito e migrations em `.sql` revisáveis. |
| **Migrations versionadas** | Schema reproduzível em qualquer ambiente; aplicadas automaticamente no deploy. |
| **Zod em todas as bordas** | Body, query, params e variáveis de ambiente. Tipos inferidos do mesmo schema que valida. |
| **JWT próprio (jose) em cookie httpOnly** | ~100 linhas, sem caixa-preta, funciona no Edge (middleware). |
| **Policy pura separada do service** | Autorização testável sem banco; mesma fonte para API e UI. |
| **Transições como ações** | Cada mudança de estado tem regra, auditoria e erro próprios. |
| **Renderização dinâmica** | Publicar no painel reflete imediatamente no site. |
| **UUID como PK** | IDs não enumeráveis em URLs do painel. |

---

## Testes

```bash
npm test
```
23 testes unitários cobrindo o que concentra regra de negócio: matriz de permissões, máquina de estados editorial e normalização do agregador RSS. Os fluxos de API foram validados ponta a ponta contra Postgres real (login, RBAC, transições, validação, deduplicação, revogação de acesso).

---

## Limitações conhecidas e próximos passos

- **Rate limit em memória:** por instância; em produção real usar Redis (Upstash/Vercel KV).
- **Cache:** páginas são dinâmicas para refletir publicação na hora. Evolução natural: ISR + `revalidatePath` disparado pelo service ao publicar.
- **Busca:** `ILIKE` em título/resumo. Próximo passo: `tsvector` + índice GIN com dicionário `portuguese`.
- **Imagens:** capa por URL. Próximo passo: upload para Vercel Blob/S3.
- **Testes de integração** dos services com banco efêmero (Testcontainers) e E2E (Playwright).
- **Editor rico** (Markdown/TipTap) e agendamento de publicação.
