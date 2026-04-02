import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Compass, Database, LineChart, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  await connection();

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <section className="rounded-lg border bg-card p-8 shadow-sm">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Next.js Starter
        </p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-card-foreground">
          Vibe coding starter kit
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Next 16 + Drizzle + shadcn/ui + Recharts with a PostgreSQL-first setup
          and Coolify-friendly defaults.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/quests">
              Open quest visualizer <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/charts">
              Open chart examples <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/api/health/db">Test DB health endpoint</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" />
              Drizzle + Postgres
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <code className="font-mono text-xs">db/client.ts</code> and{" "}
            <code className="font-mono text-xs">db/schema.ts</code> are wired and ready for
            migrations.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="size-4 text-primary" />
              ARDB Quest Visualizer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Explore live quest data from ARDB at{" "}
            <code className="font-mono text-xs">/quests</code> with grouping, filters, and local
            completion tracking.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="size-4 text-primary" />
              Recharts + shadcn/ui
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A <code className="font-mono text-xs">/charts</code> page demonstrates common chart
            types inside shadcn cards.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageCheck className="size-4 text-primary" />
              Runtime env ready
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <code className="font-mono text-xs">DATABASE_URL</code> is{" "}
            <span
              className={
                hasDatabaseUrl ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"
              }
            >
              {hasDatabaseUrl ? "configured" : "missing"}
            </span>
            . Use <code className="font-mono text-xs">pnpm dev:env</code> to auto-restart on{" "}
            <code className="font-mono text-xs">.env*</code> changes.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
