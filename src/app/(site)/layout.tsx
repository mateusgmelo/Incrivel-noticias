import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { connection } from "next/server";

/**
 * Renderização por requisição, mas os DADOS vêm do cache (`publicContent`), invalidado
 * por evento ao publicar. `connection()` marca a rota como dinâmica sem desligar o cache
 * de dados (o que `dynamic = "force-dynamic"` faria) e sem exigir banco no build.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
