export default function QuestsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      {/* Top Navigation Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Hero Section Skeleton */}
      <div className="rounded-3xl bg-gradient-to-br from-muted to-muted/50 p-6 md:p-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 animate-pulse rounded-2xl bg-muted-foreground/10" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-muted-foreground/10" />
        </div>
        <div className="h-12 w-64 animate-pulse rounded-lg bg-muted-foreground/10 mb-3" />
        <div className="h-6 w-96 max-w-full animate-pulse rounded-lg bg-muted-foreground/10 mb-8" />
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`stat-${i}`} className="bg-muted-foreground/5 rounded-2xl p-4 border border-muted-foreground/10">
              <div className="size-10 animate-pulse rounded-xl bg-muted-foreground/10 mb-3" />
              <div className="h-8 w-12 animate-pulse rounded-lg bg-muted-foreground/10 mb-1" />
              <div className="h-4 w-20 animate-pulse rounded-lg bg-muted-foreground/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex items-center gap-3 flex-wrap py-4">
        <div className="h-12 flex-1 min-w-[200px] max-w-md animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 w-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 w-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 w-28 animate-pulse rounded-2xl bg-muted" />
      </div>

      {/* Quest Grid Skeleton */}
      <div className="space-y-10 mt-4">
        {/* Group Header */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 animate-pulse rounded-xl bg-muted" />
            <div>
              <div className="h-7 w-40 animate-pulse rounded-lg bg-muted mb-1" />
              <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
          
          {/* Quest Cards */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={`card-${i}`} className="rounded-3xl border border-border bg-card overflow-hidden">
                {/* Image */}
                <div className="h-44 animate-pulse bg-muted" />
                {/* Content */}
                <div className="p-5 space-y-4">
                  <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
                    <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <div className="h-9 flex-1 animate-pulse rounded-xl bg-muted" />
                    <div className="h-9 flex-1 animate-pulse rounded-xl bg-muted" />
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
