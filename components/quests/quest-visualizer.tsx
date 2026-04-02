"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Filter,
  Gift,
  MapPin,
  Package,
  Search,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import type { QuestItemRef, QuestRecord, QuestVisualizerData } from "@/lib/ardb/types";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GroupByMode = "trader" | "map" | "oneRound";

type VisualizerFilters = {
  search: string;
  trader: string;
  map: string;
  itemType: string;
  locationType: string;
  groupBy: GroupByMode;
  hideCompleted: boolean;
  showPinnedOnly: boolean;
};

const ALL_FILTER_VALUE = "all";
const FILTERS_STORAGE_KEY = "arc-quests:filters:v1";
const PINNED_STORAGE_KEY = "arc-quests:pinned:v1";
const COMPLETED_STORAGE_KEY = "arc-quests:completed:v1";
const SELECTED_STORAGE_KEY = "arc-quests:selected:v1";

const DEFAULT_FILTERS: VisualizerFilters = {
  search: "",
  trader: ALL_FILTER_VALUE,
  map: ALL_FILTER_VALUE,
  itemType: ALL_FILTER_VALUE,
  locationType: ALL_FILTER_VALUE,
  groupBy: "trader",
  hideCompleted: false,
  showPinnedOnly: false,
};

// Quest-themed placeholder images for visual variety
const QUEST_IMAGES = [
  "https://images.unsplash.com/photo-1614851099362-4b6e13f4b0d0?w=600&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=600&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0b?w=600&h=400&fit=crop&q=80",
];

function formatDate(isoDate: string | undefined): string | undefined {
  if (!isoDate) return undefined;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function summarizeItems(items: QuestItemRef[], limit = 2): string[] {
  if (items.length === 0) return [];
  const sliced = items.slice(0, limit).map((item) => `${item.amount}x ${item.name}`);
  if (items.length > limit) sliced.push(`+${items.length - limit} more`);
  return sliced;
}

function buildGroupKey(quest: QuestRecord, groupBy: GroupByMode): string {
  if (groupBy === "map") return quest.maps[0]?.name ?? "Unknown Map";
  if (groupBy === "oneRound") return quest.oneRound ? "One-Round Quests" : "Multi-Raid Quests";
  return quest.trader?.name ?? "Unknown Trader";
}

function getQuestImage(quest: QuestRecord, index: number = 0): string {
  if (quest.imageUrl) return quest.imageUrl;
  if (quest.trader?.iconUrl) return quest.trader.iconUrl;
  if (quest.maps[0]?.imageUrl) return quest.maps[0].imageUrl;
  // Use a consistent placeholder based on quest ID hash
  const hash = quest.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return QUEST_IMAGES[(hash + index) % QUEST_IMAGES.length];
}

function normalizeFilterValue(value: string, allowedValues: string[]): string {
  if (value === ALL_FILTER_VALUE) return value;
  return allowedValues.includes(value) ? value : ALL_FILTER_VALUE;
}

function countActiveFilters(filters: VisualizerFilters): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.trader !== ALL_FILTER_VALUE) count += 1;
  if (filters.map !== ALL_FILTER_VALUE) count += 1;
  if (filters.itemType !== ALL_FILTER_VALUE) count += 1;
  if (filters.locationType !== ALL_FILTER_VALUE) count += 1;
  if (filters.groupBy !== DEFAULT_FILTERS.groupBy) count += 1;
  if (filters.hideCompleted) count += 1;
  if (filters.showPinnedOnly) count += 1;
  return count;
}

interface QuestVisualizerProps {
  data: QuestVisualizerData;
}

export function QuestVisualizer({ data }: QuestVisualizerProps) {
  const [filters, setFilters] = useLocalStorageState<VisualizerFilters>(
    FILTERS_STORAGE_KEY,
    DEFAULT_FILTERS
  );
  const [pinnedQuestIds, setPinnedQuestIds] = useLocalStorageState<string[]>(PINNED_STORAGE_KEY, []);
  const [completedQuestIds, setCompletedQuestIds] = useLocalStorageState<string[]>(
    COMPLETED_STORAGE_KEY,
    []
  );
  const [selectedQuestId, setSelectedQuestId] = useLocalStorageState<string | null>(
    SELECTED_STORAGE_KEY,
    null
  );
  const [showFilters, setShowFilters] = useState(false);

  const pinnedSet = useMemo(() => new Set(pinnedQuestIds), [pinnedQuestIds]);
  const completedSet = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);

  const safeFilters = useMemo<VisualizerFilters>(
    () => ({
      ...filters,
      trader: normalizeFilterValue(filters.trader, data.filters.traders),
      map: normalizeFilterValue(filters.map, data.filters.maps),
      itemType: normalizeFilterValue(filters.itemType, data.filters.itemTypes),
      locationType: normalizeFilterValue(filters.locationType, data.filters.locationTypes),
    }),
    [data.filters, filters]
  );

  const filteredQuests = useMemo(() => {
    const searchNeedle = safeFilters.search.trim().toLowerCase();

    return data.quests.filter((quest) => {
      if (safeFilters.hideCompleted && completedSet.has(quest.id)) return false;
      if (safeFilters.showPinnedOnly && !pinnedSet.has(quest.id)) return false;
      if (
        safeFilters.trader !== ALL_FILTER_VALUE &&
        (quest.trader?.name ?? "Unknown Trader") !== safeFilters.trader
      ) {
        return false;
      }
      if (
        safeFilters.map !== ALL_FILTER_VALUE &&
        !quest.maps.some((map) => map.name === safeFilters.map)
      ) {
        return false;
      }
      if (
        safeFilters.itemType !== ALL_FILTER_VALUE &&
        ![...quest.requiredItems, ...quest.rewardItems, ...quest.grantedItems].some(
          (item) => item.type === safeFilters.itemType
        )
      ) {
        return false;
      }
      if (
        safeFilters.locationType !== ALL_FILTER_VALUE &&
        !quest.steps.some((step) => step.relatedLocationTypes.includes(safeFilters.locationType))
      ) {
        return false;
      }
      if (searchNeedle && !quest.searchText.includes(searchNeedle)) return false;
      return true;
    });
  }, [completedSet, data.quests, pinnedSet, safeFilters]);

  const groupedQuests = useMemo(() => {
    const groups = new Map<string, QuestRecord[]>();
    for (const quest of filteredQuests) {
      const key = buildGroupKey(quest, safeFilters.groupBy);
      const existing = groups.get(key);
      if (existing) existing.push(quest);
      else groups.set(key, [quest]);
    }

    for (const quests of groups.values()) {
      quests.sort((a, b) => {
        const pinDiff = Number(pinnedSet.has(b.id)) - Number(pinnedSet.has(a.id));
        if (pinDiff !== 0) return pinDiff;
        const completedDiff = Number(completedSet.has(a.id)) - Number(completedSet.has(b.id));
        if (completedDiff !== 0) return completedDiff;
        return a.title.localeCompare(b.title);
      });
    }

    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [completedSet, filteredQuests, pinnedSet, safeFilters.groupBy]);

  const selectedQuest = useMemo(
    () => data.quests.find((quest) => quest.id === selectedQuestId),
    [data.quests, selectedQuestId]
  );

  const activeFilterCount = countActiveFilters(safeFilters);
  const visiblePinnedCount = filteredQuests.filter((quest) => pinnedSet.has(quest.id)).length;
  const visibleCompletedCount = filteredQuests.filter((quest) => completedSet.has(quest.id)).length;

  const updateFilter = <K extends keyof VisualizerFilters>(key: K, value: VisualizerFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const togglePinned = (questId: string) =>
    setPinnedQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) next.delete(questId);
      else next.add(questId);
      return [...next];
    });

  const toggleCompleted = (questId: string) =>
    setCompletedQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) next.delete(questId);
      else next.add(questId);
      return [...next];
    });

  return (
    <div className="min-h-screen font-[family-name:var(--font-quest-body)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1d29] via-[#252836] to-[#1a1d29] p-6 md:p-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d29] via-transparent to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/20 text-primary">
              <Swords className="size-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              Mission Control
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-quest-display)] tracking-tight mb-3">
            Quest Board
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mb-8">
            Track your missions, manage objectives, and claim your rewards. Every quest brings you closer to becoming a legend.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard 
              icon={<Target className="size-5" />}
              value={data.quests.length}
              label="Total Quests"
              color="primary"
            />
            <StatCard 
              icon={<Zap className="size-5" />}
              value={filteredQuests.length}
              label="Available"
              color="teal"
            />
            <StatCard 
              icon={<Star className="size-5" />}
              value={visiblePinnedCount}
              label="Pinned"
              color="amber"
            />
            <StatCard 
              icon={<Trophy className="size-5" />}
              value={visibleCompletedCount}
              label="Completed"
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border py-4 mt-6 -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search quests, items, locations..."
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={safeFilters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>
          
          <Button
            variant={showFilters ? "default" : "outline"}
            className="h-12 px-5 rounded-2xl gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button
            variant={safeFilters.showPinnedOnly ? "default" : "outline"}
            className="h-12 px-5 rounded-2xl gap-2"
            onClick={() => updateFilter("showPinnedOnly", !safeFilters.showPinnedOnly)}
          >
            <Star className={cn("size-4", safeFilters.showPinnedOnly && "fill-current")} />
            Pinned
          </Button>

          <Button
            variant={safeFilters.hideCompleted ? "default" : "outline"}
            className="h-12 px-5 rounded-2xl gap-2"
            onClick={() => updateFilter("hideCompleted", !safeFilters.hideCompleted)}
          >
            <CheckCircle2 className="size-4" />
            {safeFilters.hideCompleted ? "Active Only" : "All Quests"}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-5 rounded-2xl bg-card border border-border animate-in slide-in-from-top-2 duration-200">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                label="Group By"
                value={safeFilters.groupBy}
                onChange={(value) => updateFilter("groupBy", value as GroupByMode)}
                options={[
                  { label: "Trader", value: "trader" },
                  { label: "Primary Map", value: "map" },
                  { label: "One-Round", value: "oneRound" },
                ]}
              />
              <FilterSelect
                label="Trader"
                value={safeFilters.trader}
                onChange={(value) => updateFilter("trader", value)}
                options={[
                  { label: "All Traders", value: ALL_FILTER_VALUE },
                  ...data.filters.traders.map((value) => ({ label: value, value })),
                ]}
              />
              <FilterSelect
                label="Map"
                value={safeFilters.map}
                onChange={(value) => updateFilter("map", value)}
                options={[
                  { label: "All Maps", value: ALL_FILTER_VALUE },
                  ...data.filters.maps.map((value) => ({ label: value, value })),
                ]}
              />
              <FilterSelect
                label="Item Type"
                value={safeFilters.itemType}
                onChange={(value) => updateFilter("itemType", value)}
                options={[
                  { label: "All Items", value: ALL_FILTER_VALUE },
                  ...data.filters.itemTypes.map((value) => ({ label: value, value })),
                ]}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl">
                Reset All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quest Grid */}
      <div className="mt-8 space-y-10">
        {groupedQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl bg-card border border-border">
            <div className="size-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <Sparkles className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No Quests Found</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Try adjusting your filters or search terms to discover more missions.
            </p>
            <Button onClick={resetFilters} className="rounded-2xl">
              Clear Filters
            </Button>
          </div>
        ) : (
          groupedQuests.map(([groupName, quests]) => (
            <section key={groupName}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserRound className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-[family-name:var(--font-quest-display)]">
                      {groupName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{quests.length} quests available</p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {quests.map((quest, idx) => {
                  const isPinned = pinnedSet.has(quest.id);
                  const isCompleted = completedSet.has(quest.id);
                  const requirementChips = summarizeItems(quest.requiredItems, 2);
                  const rewardChips = summarizeItems(quest.rewardItems, 2);

                  return (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      index={idx}
                      isPinned={isPinned}
                      isCompleted={isCompleted}
                      requirementChips={requirementChips}
                      rewardChips={rewardChips}
                      onOpen={() => setSelectedQuestId(quest.id)}
                      onTogglePinned={() => togglePinned(quest.id)}
                      onToggleCompleted={() => toggleCompleted(quest.id)}
                    />
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Quest Detail Drawer */}
      {selectedQuest && (
        <QuestDetailDrawer
          quest={selectedQuest}
          pinned={pinnedSet.has(selectedQuest.id)}
          completed={completedSet.has(selectedQuest.id)}
          onClose={() => setSelectedQuestId(null)}
          onTogglePinned={() => togglePinned(selectedQuest.id)}
          onToggleCompleted={() => toggleCompleted(selectedQuest.id)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "primary" | "teal" | "amber" | "emerald";
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/20 text-primary",
    teal: "bg-teal-500/20 text-teal-400",
    amber: "bg-amber-500/20 text-amber-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
      <div className={cn("size-10 rounded-xl flex items-center justify-center mb-3", colorClasses[color])}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white font-[family-name:var(--font-quest-display)]">
        {value}
      </p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <select
        className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface QuestCardProps {
  quest: QuestRecord;
  index: number;
  isPinned: boolean;
  isCompleted: boolean;
  requirementChips: string[];
  rewardChips: string[];
  onOpen: () => void;
  onTogglePinned: () => void;
  onToggleCompleted: () => void;
}

function QuestCard({
  quest,
  index,
  isPinned,
  isCompleted,
  requirementChips,
  rewardChips,
  onOpen,
  onTogglePinned,
  onToggleCompleted,
}: QuestCardProps) {
  const image = getQuestImage(quest, index);
  const hasActualImage = Boolean(quest.imageUrl || quest.trader?.iconUrl || quest.maps[0]?.imageUrl);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-card border border-border transition-all duration-300",
        "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        isCompleted && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      {/* Image Header */}
      <div className="relative h-44 overflow-hidden">
        <Image
          src={image}
          alt={quest.title}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            !hasActualImage && "grayscale-[30%]"
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isPinned && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold">
              <Star className="size-3 fill-current" />
              Pinned
            </span>
          )}
          {quest.oneRound && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/90 text-white text-xs font-semibold">
              <Zap className="size-3" />
              Quick
            </span>
          )}
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold">
              <CheckCircle2 className="size-3" />
              Done
            </span>
          </div>
        )}

        {/* Trader Avatar */}
        {quest.trader?.iconUrl && (
          <div className="absolute bottom-3 left-3">
            <div className="size-12 rounded-xl border-2 border-card overflow-hidden shadow-lg">
              <Image
                src={quest.trader.iconUrl}
                alt={quest.trader.name ?? "Trader"}
                width={48}
                height={48}
                className="size-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <button type="button" className="w-full text-left" onClick={onOpen}>
          <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {quest.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {quest.description ?? "Embark on this mission to earn rewards and reputation."}
          </p>

          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
              <MapPin className="size-3" />
              {quest.maps[0]?.name ?? "Unknown"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
              <Target className="size-3" />
              {quest.steps.length} Steps
            </span>
            {quest.xpReward && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                <Zap className="size-3" />
                {quest.xpReward} XP
              </span>
            )}
          </div>

          {/* Requirements & Rewards Preview */}
          {(requirementChips.length > 0 || rewardChips.length > 0) && (
            <div className="space-y-2 mb-4">
              {requirementChips.length > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-amber-500 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {requirementChips.join(", ")}
                  </span>
                </div>
              )}
              {rewardChips.length > 0 && (
                <div className="flex items-center gap-2">
                  <Gift className="size-4 text-teal-500 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {rewardChips.join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
            View Details
            <ChevronRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant={isPinned ? "default" : "outline"}
            size="sm"
            className="flex-1 rounded-xl"
            onClick={(e) => { e.stopPropagation(); onTogglePinned(); }}
          >
            <Star className={cn("size-4 mr-1.5", isPinned && "fill-current")} />
            {isPinned ? "Pinned" : "Pin"}
          </Button>
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            className={cn("flex-1 rounded-xl", isCompleted && "bg-emerald-500 hover:bg-emerald-600")}
            onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="size-4 mr-1.5" />
                Done
              </>
            ) : (
              <>
                <Circle className="size-4 mr-1.5" />
                Complete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface QuestDetailDrawerProps {
  quest: QuestRecord;
  pinned: boolean;
  completed: boolean;
  onClose: () => void;
  onTogglePinned: () => void;
  onToggleCompleted: () => void;
}

function QuestDetailDrawer({
  quest,
  pinned,
  completed,
  onClose,
  onTogglePinned,
  onToggleCompleted,
}: QuestDetailDrawerProps) {
  const image = getQuestImage(quest);

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-64">
          <Image
            src={image}
            alt={quest.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
          
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-card/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              {quest.oneRound && (
                <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  One-Round
                </span>
              )}
              {completed && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                  Completed
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-foreground font-[family-name:var(--font-quest-display)]">
              {quest.title}
            </h2>
            <p className="text-muted-foreground mt-1">
              {quest.trader?.name ?? "Unknown Trader"}
              {quest.trader?.type && ` - ${quest.trader.type}`}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant={pinned ? "default" : "outline"}
              className="flex-1 rounded-xl h-12"
              onClick={onTogglePinned}
            >
              <Star className={cn("size-5 mr-2", pinned && "fill-current")} />
              {pinned ? "Pinned" : "Pin Quest"}
            </Button>
            <Button
              variant={completed ? "default" : "outline"}
              className={cn("flex-1 rounded-xl h-12", completed && "bg-emerald-500 hover:bg-emerald-600")}
              onClick={onToggleCompleted}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="size-5 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="size-5 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-secondary/50 p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Mission Briefing
            </h3>
            <p className="text-foreground leading-relaxed">
              {quest.description ?? "Complete this mission to progress and earn rewards. Check the objectives below for specific requirements."}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {formatDate(quest.updatedAt) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card text-muted-foreground text-xs">
                  <CalendarClock className="size-3" />
                  Updated {formatDate(quest.updatedAt)}
                </span>
              )}
              {quest.xpReward && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  <Zap className="size-3" />
                  {quest.xpReward} XP Reward
                </span>
              )}
            </div>
          </div>

          {/* Steps */}
          {quest.steps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Objectives
              </h3>
              <div className="space-y-3">
                {quest.steps.map((step, idx) => (
                  <div
                    key={`step-${step.index}`}
                    className="flex gap-4 p-4 rounded-2xl bg-secondary/50 border border-border"
                  >
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{step.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step.amount && (
                          <span className="text-xs text-muted-foreground">
                            Amount: {step.amount}
                          </span>
                        )}
                        {step.relatedLocationTypes.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Location: {step.relatedLocationTypes.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maps */}
          {quest.maps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Locations
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {quest.maps.map((map) => (
                  <div
                    key={map.id}
                    className="relative overflow-hidden rounded-2xl bg-secondary/50 border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MapPin className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{map.name}</p>
                        {map.locked === false && (
                          <p className="text-xs text-emerald-500">Unlocked</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements, Rewards, Granted */}
          <div className="grid gap-4 sm:grid-cols-3">
            <ItemSection title="Requirements" items={quest.requiredItems} color="amber" />
            <ItemSection title="Rewards" items={quest.rewardItems} color="teal" />
            <ItemSection title="Granted" items={quest.grantedItems} color="emerald" />
          </div>
        </div>
      </aside>
    </div>
  );
}

interface ItemSectionProps {
  title: string;
  items: QuestItemRef[];
  color: "amber" | "teal" | "emerald";
}

function ItemSection({ title, items, color }: ItemSectionProps) {
  const iconColors = {
    amber: "text-amber-500",
    teal: "text-teal-500",
    emerald: "text-emerald-500",
  };

  const bgColors = {
    amber: "bg-amber-500/10",
    teal: "bg-teal-500/10",
    emerald: "bg-emerald-500/10",
  };

  return (
    <div className="rounded-2xl bg-secondary/50 border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("size-8 rounded-lg flex items-center justify-center", bgColors[color])}>
          {color === "amber" && <Package className={cn("size-4", iconColors[color])} />}
          {color === "teal" && <Gift className={cn("size-4", iconColors[color])} />}
          {color === "emerald" && <Sparkles className={cn("size-4", iconColors[color])} />}
        </div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </div>
      
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((item) => (
            <div key={`${title}-${item.id}`} className="flex items-center gap-2">
              {item.iconUrl ? (
                <Image
                  src={item.iconUrl}
                  alt={item.name}
                  width={24}
                  height={24}
                  className="rounded-md border border-border"
                />
              ) : (
                <div className={cn("size-6 rounded-md", bgColors[color])} />
              )}
              <span className="text-sm truncate flex-1">{item.amount}x {item.name}</span>
            </div>
          ))}
          {items.length > 4 && (
            <p className="text-xs text-muted-foreground">+{items.length - 4} more</p>
          )}
        </div>
      )}
    </div>
  );
}
