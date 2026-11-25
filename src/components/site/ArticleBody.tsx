/**
 * Renderiza o corpo no formato simples do portal (o mesmo do editor e do agregador):
 * blocos separados por linha em branco · "## " = intertítulo · linhas "- " = lista.
 * Tudo vira texto via React (sem dangerouslySetInnerHTML): conteúdo de terceiros não injeta HTML.
 */
export function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-news mt-8">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}
