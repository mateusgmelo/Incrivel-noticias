import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="headline text-6xl font-bold text-brand">404</p>
      <h1 className="headline mt-4 text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-muted">A notícia pode ter sido removida ou o endereço está incorreto.</p>
      <Link href="/" className="btn-primary mt-6">Voltar para a capa</Link>
    </div>
  );
}
