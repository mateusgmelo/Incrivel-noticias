import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoMark } from "@/components/shared/Logo";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="headline flex flex-col items-center gap-3 text-center text-3xl font-bold">
          <LogoMark size={56} />
          <span><span className="text-brand">Incrível</span> Notícias</span>
        </Link>
        <div className="mt-6 rounded-xl border border-line bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Área do jornalista</h1>
          <p className="mb-5 text-sm text-muted">Acesse com sua conta da redação.</p>
          <LoginForm />
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-line bg-white p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Contas de demonstração</p>
          <p className="mt-1">admin@ · editor@ · reporter@incrivelnoticias.com</p>
          <p>Senha: <code className="font-mono">Incrivel@2026</code></p>
        </div>
      </div>
    </div>
  );
}
