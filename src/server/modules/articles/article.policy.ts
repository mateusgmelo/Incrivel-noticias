/**
 * Regras de autorização e fluxo editorial dos artigos.
 *
 * Módulo PURO (sem banco, sem HTTP): recebe ator + artigo e responde.
 * Por isso é trivial de testar — veja article.policy.test.ts.
 */
import { hasRole, type Actor } from "@/server/core/auth/rbac";
import type { ArticleStatus, Role } from "@/server/db/schema";

type ArticleRef = { authorId: string; status: ArticleStatus };
type ActorRef = Pick<Actor, "id" | "role">;

export type ArticleAction = "submit" | "publish" | "reject" | "archive";

/**
 * Máquina de estados do fluxo editorial.
 *
 *   DRAFT ──submit──► IN_REVIEW ──publish──► PUBLISHED ──archive──► ARCHIVED
 *     ▲                  │                      ▲                       │
 *     └─────reject───────┘                      └────────publish────────┘
 *
 * Editores podem publicar direto do rascunho (matéria própria, urgência).
 */
export const TRANSITIONS: Record<
  ArticleAction,
  { from: readonly ArticleStatus[]; to: ArticleStatus; minRole: Role; authorMay?: boolean; label: string }
> = {
  submit: { from: ["DRAFT"], to: "IN_REVIEW", minRole: "EDITOR", authorMay: true, label: "Enviar para revisão" },
  publish: { from: ["DRAFT", "IN_REVIEW", "ARCHIVED"], to: "PUBLISHED", minRole: "EDITOR", label: "Publicar" },
  reject: { from: ["IN_REVIEW"], to: "DRAFT", minRole: "EDITOR", label: "Devolver ao autor" },
  archive: { from: ["PUBLISHED"], to: "ARCHIVED", minRole: "EDITOR", label: "Arquivar" },
};

export type Decision = { allowed: true } | { allowed: false; reason: "FORBIDDEN" | "INVALID_STATE" };

const isAuthor = (actor: ActorRef, article: ArticleRef) => actor.id === article.authorId;

export const articlePolicy = {
  /** Visualizar no painel: editor+ vê tudo; repórter vê só o que escreveu. */
  canView(actor: ActorRef, article: ArticleRef): boolean {
    return hasRole(actor, "EDITOR") || isAuthor(actor, article);
  },

  /** Editar conteúdo: editor+ sempre; autor apenas enquanto for rascunho. */
  canEdit(actor: ActorRef, article: ArticleRef): boolean {
    if (hasRole(actor, "EDITOR")) return true;
    return isAuthor(actor, article) && article.status === "DRAFT";
  },

  /** Excluir: admin sempre; autor apenas o próprio rascunho. Publicadas se arquivam, não se apagam. */
  canDelete(actor: ActorRef, article: ArticleRef): boolean {
    if (hasRole(actor, "ADMIN")) return true;
    return isAuthor(actor, article) && article.status === "DRAFT";
  },

  /** Destacar na home é decisão editorial. */
  canFeature(actor: ActorRef): boolean {
    return hasRole(actor, "EDITOR");
  },

  canTransition(actor: ActorRef, article: ArticleRef, action: ArticleAction): Decision {
    const rule = TRANSITIONS[action];
    const permitted = hasRole(actor, rule.minRole) || (rule.authorMay === true && isAuthor(actor, article));
    if (!permitted) return { allowed: false, reason: "FORBIDDEN" };
    if (!rule.from.includes(article.status)) return { allowed: false, reason: "INVALID_STATE" };
    return { allowed: true };
  },

  /** Ações disponíveis para este ator neste artigo (a UI mostra só esses botões). */
  availableActions(actor: ActorRef, article: ArticleRef): ArticleAction[] {
    return (Object.keys(TRANSITIONS) as ArticleAction[]).filter(
      (a) => articlePolicy.canTransition(actor, article, a).allowed,
    );
  },
};
