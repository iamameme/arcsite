export default function QuestsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6 py-10">
      <div className="h-20 animate-pulse rounded-lg border bg-muted/40" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`summary-skeleton-${index}`} className="h-28 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-lg border bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`card-skeleton-${index}`} className="h-72 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </div>
    </main>
  );
}
