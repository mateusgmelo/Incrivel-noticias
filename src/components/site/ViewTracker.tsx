"use client";

import { useEffect } from "react";

/** Registra a leitura uma vez por sessão do navegador (evita inflar com refresh). */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage indisponível: registra mesmo assim */
    }
    fetch(`/api/articles/${encodeURIComponent(slug)}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
