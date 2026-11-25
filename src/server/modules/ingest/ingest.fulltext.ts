/**
 * Extração do texto integral de fontes licenciadas ("full").
 * Funções puras: recebem o HTML que veio no feed e devolvem texto no formato do portal.
 *
 * Formato do corpo (o mesmo que o editor usa no painel):
 *   parágrafos separados por linha em branco · "## " = intertítulo · linhas "- " = lista.
 * Guardamos TEXTO, nunca HTML de terceiros: nada de script, iframe, pixel de rastreio ou link solto.
 */
import { parse, type HTMLElement, type Node, NodeType } from "node-html-parser";

/** Marcas que a própria fonte usa para conteúdo de agência parceira (ex.: Reuters). */
const FORBIDDEN = /proibida a (reprodu|republica)/i;

/** Blocos de navegação que não fazem parte da matéria. */
const SKIP_HEADING = /^(notícias relacionadas|leia também|veja também|saiba mais)\s*:?$/i;

const MIN_BODY = 200;

const squash = (s: string) =>
  s
    .replace(/ /g, " ")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

/** A fonte marcou o conteúdo como de reprodução proibida? */
export function isReproductionForbidden(html: string): boolean {
  return FORBIDDEN.test(html);
}

/**
 * O autor é da própria agência? Matérias assinadas por agências parceiras
 * (Reuters, AFP...) não estão cobertas pela licença, mesmo sem o aviso explícito.
 */
export function isOwnStaff(creator: string | undefined, agency: string): boolean {
  if (!creator) return false;
  return creator.toLowerCase().includes(agency.toLowerCase());
}

/** "Fulano - Repórter da Agência Brasil " → "Fulano - Repórter da Agência Brasil" */
export const cleanCredit = (creator?: string) => (creator ? squash(creator).slice(0, 200) : null);

function text(node: Node): string {
  return squash(node.text ?? "");
}

export function htmlToBody(html: string): string | null {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  const blocks: string[] = [];
  let skipNextList = false;

  const visit = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.nodeType === NodeType.TEXT_NODE) {
        const t = text(node);
        if (t.length > 1) blocks.push(t);
        continue;
      }
      if (node.nodeType !== NodeType.ELEMENT_NODE) continue;
      const el = node as HTMLElement;
      const tag = el.tagName?.toLowerCase();

      if (tag === "script" || tag === "style" || tag === "iframe" || tag === "img" || tag === "figure") continue;

      if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
        const t = text(el);
        if (!t) continue;
        if (SKIP_HEADING.test(t)) {
          skipNextList = true;
          continue;
        }
        blocks.push(`## ${t}`);
        continue;
      }

      if (tag === "ul" || tag === "ol") {
        if (skipNextList) {
          skipNextList = false;
          continue;
        }
        const items = el.querySelectorAll("li").map(text).filter(Boolean);
        if (items.length) blocks.push(items.map((i) => `- ${i}`).join("\n"));
        continue;
      }

      if (tag === "blockquote" || tag === "div" || tag === "section") {
        visit(el.childNodes);
        continue;
      }

      // p, strong solto, span...: um bloco de texto
      const t = text(el);
      if (t) {
        skipNextList = false;
        blocks.push(t);
      }
    }
  };

  visit(root.childNodes);
  const body = blocks.join("\n\n").trim();
  return body.length >= MIN_BODY ? body : null;
}
