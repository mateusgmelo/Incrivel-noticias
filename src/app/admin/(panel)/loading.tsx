export default function PanelLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 rounded bg-line" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-line" />)}
      </div>
      <div className="h-64 rounded-xl bg-line" />
    </div>
  );
}
