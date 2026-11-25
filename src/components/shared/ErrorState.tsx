"use client";

import { useEffect } from "react";

/**
 * Tela de erro amigável (usada pelos error.tsx). Mostra o código de referência (digest),
 * que é o mesmo que aparece no log do servidor: o suporte acha o erro exato.
 */
export function ErrorState({ error, reset, homeHref }: { error: Error & { digest?: string }; reset: () => void; homeHref: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="headline text-5xl font-bold text-brand">Ops.</p>
      <h1 className="headline mt-4 text-2xl font-bold">Não foi possível carregar esta página</h1>
      <p className="mt-2 text-muted">Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary">Tentar de novo</button>
        <a href={homeHref} className="btn-ghost">Voltar ao início</a>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">Código de referência: <code className="font-mono">{error.digest}</code></p>}
    </div>
  );
}
