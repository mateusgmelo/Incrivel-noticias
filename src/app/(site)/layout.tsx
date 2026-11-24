import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

// Conteúdo sempre fresco: publicar no painel reflete na hora.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
