import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestVisualizer } from "@/components/quests/quest-visualizer";
import { getQuestVisualizerData } from "@/lib/ardb/quest-visualizer";

export const metadata: Metadata = {
  title: "Contracts | Arc Raiders",
  description: "Track your missions, manage objectives, and claim your rewards in Arc Raiders.",
};

export const revalidate = 1800;

export default async function QuestsPage() {
  const data = await getQuestVisualizerData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-6 border-b border-border">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        
        <a 
          href="https://ardb.gg" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Data via ARDB
        </a>
      </nav>

      <QuestVisualizer data={data} />
    </main>
  );
}
