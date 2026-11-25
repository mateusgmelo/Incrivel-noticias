# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [SemVer](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-11-25

Primeira versão entregue: https://incrivelnoticias.vercel.app

### Portal e painel
- Site público: capa, matéria, editorias, tags, busca. Responsivo, com JSON-LD de notícia, sitemap, robots e feed RSS próprio.
- Painel editorial com três papéis (repórter < editor < administrador). O papel e o status ativo são relidos do banco a cada requisição, então revogar acesso vale na hora.
- Fluxo editorial como máquina de estados: rascunho → revisão → publicada → arquivada, com auditoria de cada ação.
- Telas de erro amigáveis com código de referência e carregamento no painel.

### Agregador de notícias
- Licença por fonte: a Agência Brasil entra com texto integral, foto e crédito, publicada direto. O g1 entra só com manchete e link, passando pela revisão do editor.
- Travas de licença: texto de agência parceira e texto com aviso de "proibida a reprodução" não são importados.
- Editoria automática pela URL, importação idempotente e execução a cada 30 minutos (GitHub Actions) e diária (Vercel Cron).
- Nenhum conteúdo inventado: o seed cria só usuários e editorias.

### Back-end e dados
- Arquitetura em camadas por módulo (schema Zod, policy pura, repository, service) com rotas finas.
- PostgreSQL 16 com Drizzle e migrations SQL versionadas, aplicadas no deploy.
- Busca full-text em português, sem depender de acento, com ranking e índice GIN.
- Cache das leituras públicas com invalidação por evento: 0 consultas por visita com o cache quente.

### Segurança
- JWT em cookie httpOnly, bcrypt, login sem enumeração de e-mail.
- Rate limit do login no Postgres, atômico e válido entre instâncias serverless.
- Cabeçalhos de segurança: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy.

### Qualidade
- 42 testes unitários e 37 de integração contra Postgres real.
- CI a cada pull request: lint, typecheck, testes e build.
- Docker multi-stage e docker compose com a stack completa.
