"use client";

import Image from "next/image";
import { useMemo } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Star,
  Target,
  UserRound,
  X,
} from "lucide-react";
import type { QuestItemRef, QuestRecord, QuestVisualizerData } from "@/lib/ardb/types";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function getQuestImage(quest: QuestRecord): string | undefined {
  return quest.imageUrl ?? quest.trader?.iconUrl ?? quest.maps[0]?.imageUrl;
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
    <div className="rounded-[26px] border border-slate-200 bg-[#f6f8fb] font-[family-name:var(--font-quest-body)] shadow-[0_24px_60px_-48px_rgba(15,23,42,0.9)] dark:border-slate-800 dark:bg-slate-950">
      <div className="space-y-6 p-4 md:p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_-8px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
            Tactical Quest Explorer
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight font-[family-name:var(--font-quest-display)] md:text-4xl">
            ARC Raiders Mission Board
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Visual quest browser from ARDB data with local pin/completion state and resilient schema
            handling.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <Metric label="Loaded" value={String(data.quests.length)} />
            <Metric label="Visible" value={String(filteredQuests.length)} />
            <Metric label="Pinned" value={String(visiblePinnedCount)} />
            <Metric label="Completed" value={String(visibleCompletedCount)} />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="inline-flex items-center gap-2">
                    <Filter className="size-4 text-cyan-600" />
                    Filters
                  </span>
                  <span className="rounded-full border border-cyan-300/50 bg-cyan-100/70 px-2 py-0.5 text-xs text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-200">
                    {activeFilterCount}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-10 w-full rounded-xl border border-slate-300/70 bg-white/80 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:focus:border-cyan-400 dark:focus:bg-slate-950"
                    placeholder="Search quests..."
                    value={safeFilters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                  />
                </label>
                <FilterSelect
                  label="Group"
                  value={safeFilters.groupBy}
                  onChange={(value) => updateFilter("groupBy", value as GroupByMode)}
                  options={[
                    { label: "Trader", value: "trader" },
                    { label: "Primary map", value: "map" },
                    { label: "One-round", value: "oneRound" },
                  ]}
                />
                <FilterSelect
                  label="Trader"
                  value={safeFilters.trader}
                  onChange={(value) => updateFilter("trader", value)}
                  options={[
                    { label: "All traders", value: ALL_FILTER_VALUE },
                    ...data.filters.traders.map((value) => ({ label: value, value })),
                  ]}
                />
                <FilterSelect
                  label="Map"
                  value={safeFilters.map}
                  onChange={(value) => updateFilter("map", value)}
                  options={[
                    { label: "All maps", value: ALL_FILTER_VALUE },
                    ...data.filters.maps.map((value) => ({ label: value, value })),
                  ]}
                />
                <FilterSelect
                  label="Item type"
                  value={safeFilters.itemType}
                  onChange={(value) => updateFilter("itemType", value)}
                  options={[
                    { label: "All item types", value: ALL_FILTER_VALUE },
                    ...data.filters.itemTypes.map((value) => ({ label: value, value })),
                  ]}
                />
                <FilterSelect
                  label="Location type"
                  value={safeFilters.locationType}
                  onChange={(value) => updateFilter("locationType", value)}
                  options={[
                    { label: "All location types", value: ALL_FILTER_VALUE },
                    ...data.filters.locationTypes.map((value) => ({ label: value, value })),
                  ]}
                />
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant={safeFilters.hideCompleted ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter("hideCompleted", !safeFilters.hideCompleted)}
                  >
                    {safeFilters.hideCompleted ? "Showing Active" : "Hide Completed"}
                  </Button>
                  <Button
                    type="button"
                    variant={safeFilters.showPinnedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter("showPinnedOnly", !safeFilters.showPinnedOnly)}
                  >
                    {safeFilters.showPinnedOnly ? "Pinned Only" : "Show All"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Schema Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {data.meta.assumptions.map((assumption) => (
                  <p key={assumption} className="rounded-lg border border-border/60 bg-muted/35 p-2">
                    {assumption}
                  </p>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-7">
            {groupedQuests.length === 0 ? (
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Sparkles className="size-8 text-cyan-500" />
                  <p className="text-lg font-semibold">No quests match your current filters.</p>
                  <Button type="button" variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              groupedQuests.map(([groupName, quests]) => (
                <section key={groupName} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-quest-display)]">
                      {groupName}
                    </h3>
                    <span className="rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                      {quests.length} quests
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {quests.map((quest) => {
                      const isPinned = pinnedSet.has(quest.id);
                      const isCompleted = completedSet.has(quest.id);
                      const requirementChips = summarizeItems(quest.requiredItems);
                      const rewardChips = summarizeItems(quest.rewardItems);

                      return (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
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
          </section>
        </div>
      </div>

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

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
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
    <label className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <select
        className="h-10 rounded-xl border border-slate-300/70 bg-white/80 px-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950/70 dark:focus:border-cyan-400 dark:focus:bg-slate-950"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  requirementChips: string[];
  rewardChips: string[];
  onOpen: () => void;
  onTogglePinned: () => void;
  onToggleCompleted: () => void;
}

function QuestCard({
  quest,
  isPinned,
  isCompleted,
  requirementChips,
  rewardChips,
  onOpen,
  onTogglePinned,
  onToggleCompleted,
}: QuestCardProps) {
  const traderIcon = quest.trader?.iconUrl;

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_22px_-20px_rgba(15,23,42,0.8)] transition duration-300 hover:border-cyan-300 hover:shadow-[0_18px_45px_-30px_rgba(8,145,178,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700",
        isCompleted &&
          "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
      )}
    >
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            {traderIcon ? (
              <Image
                src={traderIcon}
                alt={quest.trader?.name ?? "Trader"}
                width={44}
                height={44}
                className="rounded-xl border border-slate-200 bg-slate-50 object-cover dark:border-slate-700 dark:bg-slate-800"
              />
            ) : (
              <div className="grid size-11 place-content-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <UserRound className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="line-clamp-2 text-lg font-semibold leading-6">{quest.title}</h4>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {quest.description ?? "No quest description available."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <UserRound className="size-3" />
              {quest.trader?.name ?? "Unknown trader"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <MapPin className="size-3" />
              {quest.maps[0]?.name ?? "Unknown map"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Target className="size-3" />
              {quest.steps.length} steps
            </span>
            {quest.oneRound && (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100">
                One-round
              </span>
            )}
          </div>
          {(requirementChips.length > 0 || rewardChips.length > 0) && (
            <div className="space-y-1.5 text-xs">
              {requirementChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {requirementChips.map((chip) => (
                    <span
                      key={`${quest.id}-req-${chip}`}
                      className="rounded-full border border-amber-300/80 bg-amber-100 px-2.5 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
                    >
                      Req: {chip}
                    </span>
                  ))}
                </div>
              )}
              {rewardChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rewardChips.map((chip) => (
                    <span
                      key={`${quest.id}-reward-${chip}`}
                      className="rounded-full border border-cyan-300/80 bg-cyan-100 px-2.5 py-1 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-100"
                    >
                      Reward: {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </button>

      <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3 dark:border-slate-800">
        <Button type="button" variant={isPinned ? "default" : "outline"} size="sm" onClick={onTogglePinned}>
          <Star className={cn("size-4", isPinned && "fill-current")} />
          {isPinned ? "Pinned" : "Pin"}
        </Button>
        <Button
          type="button"
          variant={isCompleted ? "default" : "outline"}
          size="sm"
          onClick={onToggleCompleted}
        >
          {isCompleted ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
          {isCompleted ? "Completed" : "Mark complete"}
        </Button>
      </div>
    </Card>
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-slate-50 p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950 md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Quest Detail</p>
            <h3 className="mt-1 text-3xl font-semibold tracking-tight font-[family-name:var(--font-quest-display)]">
              {quest.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {quest.trader?.name ?? "Unknown trader"}
              {quest.trader?.type ? ` - ${quest.trader.type}` : ""}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        {image ? (
          <div className="relative mb-5 h-52 w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <Image
              src={image}
              alt={quest.title}
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover grayscale-[10%] saturate-75 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" variant={pinned ? "default" : "outline"} size="sm" onClick={onTogglePinned}>
            <Star className={cn("size-4", pinned && "fill-current")} />
            {pinned ? "Pinned" : "Pin"}
          </Button>
          <Button type="button" variant={completed ? "default" : "outline"} size="sm" onClick={onToggleCompleted}>
            {completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
            {completed ? "Completed" : "Mark complete"}
          </Button>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">{quest.description ?? "No description provided by ARDB."}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {formatDate(quest.updatedAt) ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                  <CalendarClock className="size-3" />
                  Updated {formatDate(quest.updatedAt)}
                </span>
              ) : null}
              {typeof quest.xpReward === "number" ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                  XP {quest.xpReward}
                </span>
              ) : null}
              {quest.oneRound ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                  One-round
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Maps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {quest.maps.length === 0 ? (
                <p className="text-muted-foreground">No map metadata for this quest.</p>
              ) : (
                quest.maps.map((map) => (
                  <div key={`${quest.id}-map-${map.id}`} className="rounded-lg border p-2">
                    <p className="font-medium">{map.name}</p>
                    {map.locked === false ? (
                      <p className="text-xs text-muted-foreground">Map marked as unlocked in ARDB metadata.</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {quest.steps.length === 0 ? (
                <p className="text-muted-foreground">No step data provided.</p>
              ) : (
                quest.steps.map((step) => (
                  <div key={`${quest.id}-step-${step.index}`} className="rounded-lg border p-2">
                    <p className="font-medium">{step.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {typeof step.amount === "number" ? <span>Amount: {step.amount}</span> : null}
                      {step.markerCount > 0 ? <span>Markers: {step.markerCount}</span> : null}
                      {step.relatedLocationTypes.length > 0 ? (
                        <span>Types: {step.relatedLocationTypes.join(", ")}</span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <QuestItemSection title="Requirements" items={quest.requiredItems} tone="amber" />
          <QuestItemSection title="Rewards" items={quest.rewardItems} tone="cyan" />
          <QuestItemSection title="Granted" items={quest.grantedItems} tone="emerald" />
        </div>

        {quest.sourceImageUrls.length > 0 ? (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Source Assets</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              {quest.sourceImageUrls.map((sourceUrl) => (
                <a
                  key={sourceUrl}
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
                >
                  {sourceUrl}
                </a>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <details className="rounded-xl border border-border/70 bg-white/85 p-3 text-sm dark:bg-slate-900/80">
          <summary className="cursor-pointer font-medium">Raw Reference IDs (debug)</summary>
          <div className="mt-2 space-y-2 font-mono text-xs text-muted-foreground">
            <p>quest.id: {quest.id}</p>
            {quest.steps.flatMap((step) => step.relatedLocationIds).length > 0 ? (
              <p>
                relatedLocationIds:{" "}
                {quest.steps
                  .flatMap((step) => step.relatedLocationIds)
                  .filter((value, index, all) => all.indexOf(value) === index)
                  .join(", ")}
              </p>
            ) : (
              <p>relatedLocationIds: none</p>
            )}
          </div>
        </details>
      </aside>
    </div>
  );
}

interface QuestItemSectionProps {
  title: string;
  items: QuestItemRef[];
  tone: "amber" | "cyan" | "emerald";
}

function QuestItemSection({ title, items, tone }: QuestItemSectionProps) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/60 bg-amber-100/70 text-amber-900 dark:border-amber-700/70 dark:bg-amber-900/35 dark:text-amber-100"
      : tone === "emerald"
        ? "border-emerald-300/60 bg-emerald-100/70 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-900/35 dark:text-emerald-100"
        : "border-cyan-300/60 bg-cyan-100/70 text-cyan-900 dark:border-cyan-700/70 dark:bg-cyan-900/35 dark:text-cyan-100";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          {title}
          <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">None listed.</p>
        ) : (
          items.map((item) => (
            <div key={`${title}-${item.id}-${item.amount}`} className="rounded-lg border p-2">
              <div className="flex items-center gap-2">
                {item.iconUrl ? (
                  <Image
                    src={item.iconUrl}
                    alt={item.name}
                    width={24}
                    height={24}
                    className="rounded-md border bg-muted"
                  />
                ) : (
                  <div className={cn("size-6 rounded-md border", toneClass)} />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.amount}x {item.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.type ?? "Unknown type"}
                    {item.rarity ? ` - ${item.rarity}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
