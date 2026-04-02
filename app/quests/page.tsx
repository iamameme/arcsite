import Link from "next/link";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestVisualizer } from "@/components/quests/quest-visualizer";
import { getQuestVisualizerData } from "@/lib/ardb/quest-visualizer";

export const metadata: Metadata = {
  title: "Quest Visualizer",
  description: "Visual quest explorer powered by ARDB API quest data.",
};

export const revalidate = 1800;

const questDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-quest-display",
  weight: ["500", "600", "700"],
});

const questBody = Manrope({
  subsets: ["latin"],
  variable: "--font-quest-body",
  weight: ["400", "500", "600", "700"],
});

export default async function QuestsPage() {
  const data = await getQuestVisualizerData();

  return (
    <main
      className={`${questDisplay.variable} ${questBody.variable} mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8`}
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur md:px-5">
        <div>
          <h1 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground">
            ARC RAIDERS QUEST VISUALIZER
          </h1>
          <p className="text-xs text-muted-foreground">
            Data powered by ARDB API with local-only user state.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <QuestVisualizer data={data} />
    </main>
  );
}
