import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChartsShowcaseNoSSR } from "@/components/charts/charts-showcase-no-ssr";
import { Button } from "@/components/ui/button";

export default function ChartsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Charts Demo</h1>
          <p className="text-sm text-muted-foreground">
            Recharts rendered inside shadcn/ui card components.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>
      <ChartsShowcaseNoSSR />
    </main>
  );
}
