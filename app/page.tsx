import type { Metadata } from "next";
import { QuestVisualizer } from "@/components/quests/quest-visualizer";
import { getQuestVisualizerData } from "@/lib/ardb/quest-visualizer";

export const metadata: Metadata = {
  title: "Contracts | ARCSITE",
  description: "Track your missions, manage objectives, and claim your rewards in Arc Raiders.",
};

export const revalidate = 1800;

export default async function HomePage() {
  const data = await getQuestVisualizerData();

  return <QuestVisualizer data={data} />;
}
