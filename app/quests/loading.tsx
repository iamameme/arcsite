export default function QuestsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      {/* Top Navigation Skeleton */}
      <div className="flex items-center justify-between px-4 py-4 md:px-6 border-b border-border">
        <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>

      {/* Header Skeleton */}
      <div className="border-b border-border bg-card px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-52 animate-pulse rounded-md bg-muted mb-2" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted mb-6" />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`stat-${i}`} className="bg-secondary/50 rounded-md border border-border p-3 text-center">
              <div className="h-8 w-12 mx-auto animate-pulse rounded bg-muted mb-1" />
              <div className="h-3 w-14 mx-auto animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 flex-1 min-w-[180px] max-w-sm animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="flex-1" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      {/* Quest Grid Skeleton */}
      <div className="px-4 py-6 md:px-6 space-y-8">
        {/* Group */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="size-8 animate-pulse rounded bg-muted" />
            <div>
              <div className="h-6 w-32 animate-pulse rounded bg-muted mb-1" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={`card-${i}`} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="h-32 animate-pulse bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-14 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="flex gap-1.5 pt-3 border-t border-border">
                    <div className="h-7 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-7 flex-1 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
