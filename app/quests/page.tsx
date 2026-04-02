import Link from "next/link";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestVisualizer } from "@/components/quests/quest-visualizer";
import { getQuestVisualizerData } from "@/lib/ardb/quest-visualizer";

export const metadata: Metadata = {
  title: "Quest Board | Arc Raiders",
  description: "Track your missions, manage objectives, and claim your rewards in Arc Raiders.",
};

export const revalidate = 1800;

const questDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-quest-display",
  weight: ["500", "600", "700"],
});

const questBody = Inter({
  subsets: ["latin"],
  variable: "--font-quest-body",
  weight: ["400", "500", "600", "700"],
});

export default async function QuestsPage() {
  const data = await getQuestVisualizerData();

  return (
    <main
      className={`${questDisplay.variable} ${questBody.variable} mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8`}
    >
      {/* Top Navigation */}
      <nav className="flex items-center justify-between">
        <Button asChild variant="ghost" className="gap-2 rounded-xl hover:bg-secondary">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Powered by</span>
          <a 
            href="https://ardb.gg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            ARDB API
          </a>
        </div>
      </nav>

      <QuestVisualizer data={data} />
    </main>
  );
}
