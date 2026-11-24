"use client";

import { useState } from "react";

/**
 * Capa 16:9 do card. Sem imagem (ou com URL externa quebrada) mostra um bloco
 * no mesmo formato, para o grid da capa continuar alinhado.
 */
export function CoverImage({ src, label, className = "" }: { src: string | null; label: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 p-6 ${className}`}>
        <span className="headline text-center text-lg font-bold text-white/85 sm:text-xl">{label}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`aspect-[16/9] w-full object-cover ${className}`} />
  );
}
