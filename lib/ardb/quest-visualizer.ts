import {
  ARDB_STATIC_BASE_URL,
  fetchArcEnemies,
  fetchItems,
  fetchQuestDetail,
  fetchQuestSummaries,
} from "@/lib/ardb/client";
import type {
  QuestEnemyRef,
  QuestFilterOptions,
  QuestItemRef,
  QuestMap,
  QuestRecord,
  QuestStep,
  QuestTrader,
  QuestVisualizerData,
} from "@/lib/ardb/types";

type UnknownRecord = Record<string, unknown>;

interface ItemLookup {
  id: string;
  name: string;
  type?: string;
  rarity?: string;
  iconUrl?: string;
}

interface EnemyLookup {
  id: string;
  name: string;
  iconUrl?: string;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as UnknownRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] {
  return asArray(value)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function toStaticAssetUrl(pathLike: string | undefined): string | undefined {
  if (!pathLike) {
    return undefined;
  }

  if (/^https?:\/\//i.test(pathLike)) {
    return pathLike;
  }

  if (pathLike.startsWith("/")) {
    return `${ARDB_STATIC_BASE_URL}${pathLike}`;
  }

  return `${ARDB_STATIC_BASE_URL}/${pathLike}`;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function normalizeItemLookup(raw: unknown): ItemLookup | undefined {
  const record = asRecord(raw);
  if (!record) {
    return undefined;
  }

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    type: asString(record.type),
    rarity: asString(record.rarity),
    iconUrl: toStaticAssetUrl(asString(record.icon) ?? asString(record.image)),
  };
}

function normalizeEnemyLookup(raw: unknown): EnemyLookup | undefined {
  const record = asRecord(raw);
  if (!record) {
    return undefined;
  }

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    iconUrl: toStaticAssetUrl(asString(record.icon) ?? asString(record.image)),
  };
}

function normalizeQuestTrader(raw: unknown): QuestTrader | undefined {
  const record = asRecord(raw);
  if (!record) {
    return undefined;
  }

  const id = asString(record.id) ?? asString(record.name);
  const name = asString(record.name) ?? id;
  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    type: asString(record.type),
    description: asString(record.description),
    imageUrl: toStaticAssetUrl(asString(record.image)),
    iconUrl: toStaticAssetUrl(asString(record.icon)),
  };
}

function normalizeQuestMaps(raw: unknown): QuestMap[] {
  const maps: QuestMap[] = [];

  for (const entry of asArray(raw)) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }

    const id = asString(record.id) ?? asString(record.name);
    const name = asString(record.name) ?? id;
    if (!id || !name) {
      continue;
    }

    maps.push({
      id,
      name,
      description: asString(record.description),
      imageUrl: toStaticAssetUrl(asString(record.image)),
      locked: asBoolean(record.locked),
    });
  }

  return maps;
}

function normalizeQuestItems(
  raw: unknown,
  itemsById: Map<string, ItemLookup>
): QuestItemRef[] {
  const items: QuestItemRef[] = [];
  let fallbackIndex = 0;

  for (const entry of asArray(raw)) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }

    const amount = Math.max(1, asNumber(record.amount) ?? 1);
    const rawItem = asRecord(record.item);
    const lookupId = asString(rawItem?.id) ?? asString(record.item) ?? asString(record.id);
    const lookupItem = lookupId ? itemsById.get(lookupId) : undefined;

    // ARDB currently embeds an item object, but docs say schema can change.
    // Keep fallback lookup-by-id so this survives partial shape changes.
    const id = lookupId ?? `unknown-item-${fallbackIndex}`;
    fallbackIndex += 1;

    const name = asString(rawItem?.name) ?? lookupItem?.name ?? id;
    const type = asString(rawItem?.type) ?? lookupItem?.type;
    const rarity = asString(rawItem?.rarity) ?? lookupItem?.rarity;
    const iconUrl = toStaticAssetUrl(
      asString(rawItem?.icon) ?? asString(rawItem?.image) ?? lookupItem?.iconUrl
    );

    items.push({
      id,
      name,
      amount,
      type,
      rarity,
      iconUrl,
    });
  }

  return items;
}

function normalizeQuestSteps(raw: unknown, enemiesById: Map<string, EnemyLookup>): QuestStep[] {
  const steps: QuestStep[] = [];
  let index = 0;

  for (const entry of asArray(raw)) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }

    const relatedLocationTypes = uniqueSorted(
      asStringArray(record.relatedLocationTypes).map((type) => type.toLowerCase())
    );
    const relatedLocationIds = uniqueSorted(asStringArray(record.relatedLocationIds));

    const enemyRefs: QuestEnemyRef[] = [];
    for (const type of relatedLocationTypes) {
      const enemy = enemiesById.get(type);
      if (!enemy) {
        continue;
      }

      enemyRefs.push({
        id: enemy.id,
        name: enemy.name,
        iconUrl: enemy.iconUrl,
      });
    }

    steps.push({
      index,
      title: asString(record.title) ?? `Step ${index + 1}`,
      amount: asNumber(record.amount),
      markerCount: asArray(record.markers).length,
      relatedLocationTypes,
      relatedLocationIds,
      relatedEnemies: enemyRefs,
    });

    index += 1;
  }

  return steps;
}

function buildSearchText(quest: QuestRecord): string {
  const parts: string[] = [
    quest.id,
    quest.title,
    quest.description ?? "",
    quest.trader?.name ?? "",
    quest.trader?.type ?? "",
    ...quest.maps.map((map) => map.name),
    ...quest.steps.flatMap((step) => [step.title, ...step.relatedLocationTypes]),
    ...quest.requiredItems.map((item) => `${item.id} ${item.name} ${item.type ?? ""}`),
    ...quest.rewardItems.map((item) => `${item.id} ${item.name} ${item.type ?? ""}`),
    ...quest.grantedItems.map((item) => `${item.id} ${item.name} ${item.type ?? ""}`),
  ];

  return parts.join(" ").toLowerCase();
}

function normalizeQuestRecord(
  summaryRaw: unknown,
  detailRaw: unknown,
  itemsById: Map<string, ItemLookup>,
  enemiesById: Map<string, EnemyLookup>
): QuestRecord | undefined {
  const summary = asRecord(summaryRaw);
  if (!summary) {
    return undefined;
  }

  const detail = asRecord(detailRaw);
  const primary = detail ?? summary;

  const id = asString(summary.id) ?? asString(primary.id);
  const title = asString(primary.title) ?? asString(summary.title) ?? id;
  if (!id || !title) {
    return undefined;
  }

  const trader = normalizeQuestTrader(primary.trader ?? summary.trader);
  const maps = normalizeQuestMaps(primary.maps ?? summary.maps);
  const steps = normalizeQuestSteps(primary.steps ?? summary.steps, enemiesById);
  const requiredItems = normalizeQuestItems(primary.requiredItems ?? summary.requiredItems, itemsById);
  const rewardItems = normalizeQuestItems(primary.rewardItems, itemsById);
  const grantedItems = normalizeQuestItems(primary.grantedItems, itemsById);

  const quest: QuestRecord = {
    id,
    title,
    description: asString(primary.description) ?? asString(summary.description),
    trader,
    maps,
    steps,
    requiredItems,
    rewardItems,
    grantedItems,
    imageUrl: toStaticAssetUrl(asString(primary.image)),
    sourceImageUrls: asStringArray(primary.sources).map((source) => toStaticAssetUrl(source) ?? source),
    oneRound: asBoolean(primary.oneRound) ?? false,
    xpReward: asNumber(primary.xpReward) ?? asNumber(summary.xpReward),
    updatedAt: asString(primary.updatedAt) ?? asString(summary.updatedAt),
    searchText: "",
  };

  quest.searchText = buildSearchText(quest);
  return quest;
}

function collectFilterOptions(quests: QuestRecord[]): QuestFilterOptions {
  const traders = new Set<string>();
  const maps = new Set<string>();
  const itemTypes = new Set<string>();
  const locationTypes = new Set<string>();
  const enemyNames = new Set<string>();

  for (const quest of quests) {
    if (quest.trader?.name) {
      traders.add(quest.trader.name);
    }

    for (const map of quest.maps) {
      maps.add(map.name);
    }

    for (const item of [...quest.requiredItems, ...quest.rewardItems, ...quest.grantedItems]) {
      if (item.type) {
        itemTypes.add(item.type);
      }
    }

    for (const step of quest.steps) {
      for (const type of step.relatedLocationTypes) {
        locationTypes.add(type);
      }

      for (const enemy of step.relatedEnemies) {
        enemyNames.add(enemy.name);
      }
    }
  }

  return {
    traders: uniqueSorted(traders),
    maps: uniqueSorted(maps),
    itemTypes: uniqueSorted(itemTypes),
    locationTypes: uniqueSorted(locationTypes),
    enemyNames: uniqueSorted(enemyNames),
  };
}

export async function getQuestVisualizerData(): Promise<QuestVisualizerData> {
  const [rawQuestSummaries, rawItems, rawArcEnemies] = await Promise.all([
    fetchQuestSummaries(),
    fetchItems(),
    fetchArcEnemies(),
  ]);

  const itemLookupById = new Map<string, ItemLookup>();
  for (const rawItem of rawItems) {
    const normalized = normalizeItemLookup(rawItem);
    if (normalized) {
      itemLookupById.set(normalized.id, normalized);
    }
  }

  const enemyLookupById = new Map<string, EnemyLookup>();
  for (const rawEnemy of rawArcEnemies) {
    const normalized = normalizeEnemyLookup(rawEnemy);
    if (normalized) {
      enemyLookupById.set(normalized.id.toLowerCase(), normalized);
    }
  }

  const detailResults = await Promise.allSettled(
    rawQuestSummaries.map((summaryRaw) => {
      const summary = asRecord(summaryRaw);
      const id = asString(summary?.id);
      if (!id) {
        return Promise.resolve(undefined);
      }

      return fetchQuestDetail(id).catch(() => undefined);
    })
  );

  const quests: QuestRecord[] = [];
  for (let i = 0; i < rawQuestSummaries.length; i += 1) {
    const detailResult = detailResults[i];
    const detailRaw = detailResult.status === "fulfilled" ? detailResult.value : undefined;
    const normalized = normalizeQuestRecord(
      rawQuestSummaries[i],
      detailRaw,
      itemLookupById,
      enemyLookupById
    );

    if (normalized) {
      quests.push(normalized);
    }
  }

  quests.sort((a, b) => a.title.localeCompare(b.title));

  return {
    quests,
    filters: collectFilterOptions(quests),
    meta: {
      fetchedAt: new Date().toISOString(),
      questCount: quests.length,
      assumptions: [
        "No explicit quest prerequisite/chain field is currently exposed by ARDB quest endpoints.",
        "Quest detail shape can vary; item/enemy links are resolved opportunistically by id when possible.",
        "Marker coordinates are represented as counts to keep payload size stable if marker arrays grow.",
      ],
    },
  };
}
