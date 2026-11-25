"use client";

/** Último recurso: erro no layout raiz. Precisa do próprio <html>/<body> e não usa o CSS do app. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "6rem 1rem" }}>
        <h1>Incrível Notícias está instável no momento</h1>
        <p>Tente novamente em alguns segundos.</p>
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 16px" }}>Tentar de novo</button>
      </body>
    </html>
  );
}
