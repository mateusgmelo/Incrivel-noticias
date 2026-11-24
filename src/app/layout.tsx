import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Incrível Notícias — Pernambuco e o mundo", template: "%s | Incrível Notícias" },
  description: "Portal de notícias com cobertura de Pernambuco: política, economia, cidades, esportes, cultura e tecnologia.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { siteName: "Incrível Notícias", locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#b4121b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
