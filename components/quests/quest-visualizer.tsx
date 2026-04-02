"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Crosshair,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Package,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import type { QuestItemRef, QuestRecord, QuestVisualizerData } from "@/lib/ardb/types";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GroupByMode = "trader" | "map" | "oneRound";
type ViewMode = "grid" | "list";

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
const VIEW_MODE_STORAGE_KEY = "arc-quests:view:v1";

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
  if (groupBy === "oneRound") return quest.oneRound ? "Single Raid" : "Multi-Raid";
  return quest.trader?.name ?? "Unknown Trader";
}

function getQuestImage(quest: QuestRecord): string | null {
  if (quest.imageUrl) return quest.imageUrl;
  if (quest.trader?.iconUrl) return quest.trader.iconUrl;
  if (quest.maps[0]?.imageUrl) return quest.maps[0].imageUrl;
  return null;
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
  const [viewMode, setViewMode] = useLocalStorageState<ViewMode>(VIEW_MODE_STORAGE_KEY, "grid");
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
    <div className="flex flex-col min-h-0 h-full overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-border bg-card/50 shrink-0 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
              <Crosshair className="size-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Contracts</h1>
              <p className="text-xs text-muted-foreground">
                {filteredQuests.length} of {data.quests.length} missions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center">
              <span className="text-primary font-bold text-sm">{visiblePinnedCount}</span>
              <span className="text-muted-foreground ml-1">tracked</span>
            </div>
            <div className="text-center">
              <span className="text-accent font-bold text-sm">{visibleCompletedCount}</span>
              <span className="text-muted-foreground ml-1">done</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="shrink-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search missions..."
                className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                value={safeFilters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>

            {/* Quick Filters */}
            <Button
              variant={safeFilters.showPinnedOnly ? "default" : "outline"}
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => updateFilter("showPinnedOnly", !safeFilters.showPinnedOnly)}
            >
              <Star className={cn("size-3.5", safeFilters.showPinnedOnly && "fill-current")} />
              Tracked
            </Button>

            <Button
              variant={safeFilters.hideCompleted ? "default" : "outline"}
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => updateFilter("hideCompleted", !safeFilters.hideCompleted)}
            >
              <Check className="size-3.5" />
              Hide Done
            </Button>

            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="size-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn("size-3.5 transition-transform", showFilters && "rotate-180")} />
            </Button>

            <div className="flex-1" />

            {/* View Toggle */}
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                type="button"
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                )}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "p-2 transition-colors border-l border-border",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                )}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-border animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FilterSelect
                  label="Group By"
                  value={safeFilters.groupBy}
                  onChange={(value) => updateFilter("groupBy", value as GroupByMode)}
                  options={[
                    { label: "Trader", value: "trader" },
                    { label: "Map", value: "map" },
                    { label: "Raid Type", value: "oneRound" },
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
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quest Grid/List */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-6">
        {groupedQuests.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className="space-y-8">
            {groupedQuests.map(([groupName, quests]) => (
              <section key={groupName}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
                    <Target className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{groupName}</h2>
                    <p className="text-xs text-muted-foreground">{quests.length} contracts</p>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {quests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        isPinned={pinnedSet.has(quest.id)}
                        isCompleted={completedSet.has(quest.id)}
                        onOpen={() => setSelectedQuestId(quest.id)}
                        onTogglePinned={() => togglePinned(quest.id)}
                        onToggleCompleted={() => toggleCompleted(quest.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quests.map((quest) => (
                      <QuestListItem
                        key={quest.id}
                        quest={quest}
                        isPinned={pinnedSet.has(quest.id)}
                        isCompleted={completedSet.has(quest.id)}
                        onOpen={() => setSelectedQuestId(quest.id)}
                        onTogglePinned={() => togglePinned(quest.id)}
                        onToggleCompleted={() => toggleCompleted(quest.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Quest Detail Panel */}
      {selectedQuest && (
        <QuestDetailPanel
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

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Sparkles className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Missions Found</h3>
      <p className="text-muted-foreground mb-4 max-w-md text-sm">
        Adjust your filters or search terms to find contracts.
      </p>
      <Button variant="outline" size="sm" onClick={onReset}>
        Clear Filters
      </Button>
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
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <select
        className="w-full h-9 px-3 text-sm rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
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
  isPinned: boolean;
  isCompleted: boolean;
  onOpen: () => void;
  onTogglePinned: () => void;
  onToggleCompleted: () => void;
}

function QuestCard({
  quest,
  isPinned,
  isCompleted,
  onOpen,
  onTogglePinned,
  onToggleCompleted,
}: QuestCardProps) {
  const image = getQuestImage(quest);
  const rewardChips = summarizeItems(quest.rewardItems, 2);

  return (
    <article
      className={cn(
        "group relative bg-card border border-border rounded-lg overflow-hidden transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isCompleted && "opacity-60"
      )}
    >
      {/* Image or Placeholder */}
      <div className="relative h-32 bg-secondary overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={quest.title}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <Target className="size-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {isPinned && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold uppercase">
              <Star className="size-3 fill-current" />
              Tracked
            </span>
          )}
          {quest.oneRound && (
            <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold uppercase">
              Quick
            </span>
          )}
        </div>

        {isCompleted && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold uppercase">
              <Check className="size-3" />
              Done
            </span>
          </div>
        )}

        {/* Trader Icon */}
        {quest.trader?.iconUrl && (
          <div className="absolute bottom-2 left-2">
            <div className="size-10 rounded border-2 border-card overflow-hidden bg-card shadow-md">
              <img
                src={quest.trader.iconUrl}
                alt={quest.trader.name ?? "Trader"}
                className="size-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <button type="button" className="w-full text-left" onClick={onOpen}>
          <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {quest.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary">
              <MapPin className="size-3" />
              {quest.maps[0]?.name ?? "Unknown"}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary">
              <Target className="size-3" />
              {quest.steps.length} obj
            </span>
            {quest.xpReward && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                <Zap className="size-3" />
                {quest.xpReward} XP
              </span>
            )}
          </div>

          {/* Rewards Preview */}
          {rewardChips.length > 0 && (
            <p className="text-[10px] text-muted-foreground truncate">
              <span className="text-accent font-medium">Rewards:</span> {rewardChips.join(", ")}
            </p>
          )}
        </button>

        {/* Actions */}
        <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
          <Button
            variant={isPinned ? "default" : "outline"}
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); onTogglePinned(); }}
          >
            <Star className={cn("size-3 mr-1", isPinned && "fill-current")} />
            {isPinned ? "Tracked" : "Track"}
          </Button>
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            className={cn("flex-1 h-7 text-xs", isCompleted && "bg-accent hover:bg-accent/90 text-accent-foreground")}
            onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }}
          >
            {isCompleted ? (
              <>
                <Check className="size-3 mr-1" />
                Done
              </>
            ) : (
              <>
                <Circle className="size-3 mr-1" />
                Clear
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

interface QuestListItemProps {
  quest: QuestRecord;
  isPinned: boolean;
  isCompleted: boolean;
  onOpen: () => void;
  onTogglePinned: () => void;
  onToggleCompleted: () => void;
}

function QuestListItem({
  quest,
  isPinned,
  isCompleted,
  onOpen,
  onTogglePinned,
  onToggleCompleted,
}: QuestListItemProps) {
  const image = getQuestImage(quest);

  return (
    <article
      className={cn(
        "group flex items-center gap-3 p-3 bg-card border border-border rounded-lg transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md",
        isCompleted && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative size-14 rounded overflow-hidden bg-secondary shrink-0">
        {image ? (
          <img
            src={image}
            alt={quest.title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="size-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <button type="button" className="flex-1 min-w-0 text-left" onClick={onOpen}>
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {quest.title}
          </h3>
          {isPinned && <Star className="size-3.5 text-primary fill-primary shrink-0" />}
          {isCompleted && <Check className="size-3.5 text-accent shrink-0" />}
          {quest.oneRound && (
            <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-semibold shrink-0">
              Quick
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{quest.trader?.name ?? "Unknown"}</span>
          <span className="text-border">|</span>
          <span>{quest.maps[0]?.name ?? "Unknown"}</span>
          <span className="text-border">|</span>
          <span>{quest.steps.length} objectives</span>
          {quest.xpReward && (
            <>
              <span className="text-border">|</span>
              <span className="text-primary">{quest.xpReward} XP</span>
            </>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => { e.stopPropagation(); onTogglePinned(); }}
          title={isPinned ? "Untrack" : "Track"}
        >
          <Star className={cn("size-4", isPinned && "fill-primary text-primary")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }}
          title={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          <Check className={cn("size-4", isCompleted && "text-accent")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onOpen}
          title="View details"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </article>
  );
}

interface QuestDetailPanelProps {
  quest: QuestRecord;
  pinned: boolean;
  completed: boolean;
  onClose: () => void;
  onTogglePinned: () => void;
  onToggleCompleted: () => void;
}

function QuestDetailPanel({
  quest,
  pinned,
  completed,
  onClose,
  onTogglePinned,
  onToggleCompleted,
}: QuestDetailPanelProps) {
  const image = getQuestImage(quest);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {image ? (
            <div className="relative h-48">
              <img
                src={image}
                alt={quest.title}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <Target className="size-16 text-muted-foreground/20" />
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-card/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              {quest.oneRound && (
                <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-xs font-semibold">
                  Single Raid
                </span>
              )}
              {completed && (
                <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-xs font-semibold">
                  Completed
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold">{quest.title}</h2>
            <p className="text-sm text-muted-foreground">
              {quest.trader?.name ?? "Unknown Trader"}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant={pinned ? "default" : "outline"}
              className="flex-1"
              onClick={onTogglePinned}
            >
              <Star className={cn("size-4 mr-2", pinned && "fill-current")} />
              {pinned ? "Tracking" : "Track Mission"}
            </Button>
            <Button
              variant={completed ? "default" : "outline"}
              className={cn("flex-1", completed && "bg-accent hover:bg-accent/90 text-accent-foreground")}
              onClick={onToggleCompleted}
            >
              {completed ? (
                <>
                  <Check className="size-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="size-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>

          {/* Description */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Mission Brief
            </h3>
            <p className="text-sm leading-relaxed">
              {quest.description ?? "Complete this contract to progress and earn rewards."}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {formatDate(quest.updatedAt) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-card text-xs text-muted-foreground">
                  <CalendarClock className="size-3" />
                  Updated {formatDate(quest.updatedAt)}
                </span>
              )}
              {quest.xpReward && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                  <Zap className="size-3" />
                  {quest.xpReward} XP
                </span>
              )}
            </div>
          </div>

          {/* Objectives */}
          {quest.steps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Objectives ({quest.steps.length})
              </h3>
              <div className="space-y-2">
                {quest.steps.map((step, idx) => (
                  <div
                    key={`step-${step.index}`}
                    className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{step.title}</p>
                      {(step.amount || step.relatedLocationTypes.length > 0) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.amount && `Qty: ${step.amount}`}
                          {step.amount && step.relatedLocationTypes.length > 0 && " | "}
                          {step.relatedLocationTypes.length > 0 && `Location: ${step.relatedLocationTypes.join(", ")}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maps */}
          {quest.maps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Locations
              </h3>
              <div className="flex flex-wrap gap-2">
                {quest.maps.map((map) => (
                  <span
                    key={map.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm"
                  >
                    <MapPin className="size-3.5 text-primary" />
                    {map.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <ItemList title="Requirements" items={quest.requiredItems} type="requirement" />
            <ItemList title="Rewards" items={quest.rewardItems} type="reward" />
          </div>

          {quest.grantedItems.length > 0 && (
            <ItemList title="Granted Items" items={quest.grantedItems} type="granted" />
          )}
        </div>
      </aside>
    </div>
  );
}

interface ItemListProps {
  title: string;
  items: QuestItemRef[];
  type: "requirement" | "reward" | "granted";
}

function ItemList({ title, items, type }: ItemListProps) {
  const iconClass = {
    requirement: "text-amber-500",
    reward: "text-accent",
    granted: "text-primary",
  }[type];

  const Icon = type === "requirement" ? Package : type === "reward" ? Trophy : Sparkles;

  return (
    <div className="p-3 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("size-4", iconClass)} />
        <h4 className="text-xs font-semibold uppercase tracking-wide">{title}</h4>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None</p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 5).map((item) => (
            <div key={`${title}-${item.id}`} className="flex items-center gap-2">
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  className="size-5 rounded border border-border object-cover"
                />
              ) : (
                <div className="size-5 rounded bg-muted border border-border" />
              )}
              <span className="text-xs truncate flex-1">
                {item.amount}x {item.name}
              </span>
            </div>
          ))}
          {items.length > 5 && (
            <p className="text-xs text-muted-foreground">+{items.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}
