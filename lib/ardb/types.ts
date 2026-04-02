export interface QuestTrader {
  id: string;
  name: string;
  type?: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
}

export interface QuestMap {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  locked?: boolean;
}

export interface QuestEnemyRef {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface QuestItemRef {
  id: string;
  name: string;
  amount: number;
  type?: string;
  rarity?: string;
  iconUrl?: string;
}

export interface QuestStep {
  index: number;
  title: string;
  amount?: number;
  markerCount: number;
  relatedLocationTypes: string[];
  relatedLocationIds: string[];
  relatedEnemies: QuestEnemyRef[];
}

export interface QuestRecord {
  id: string;
  title: string;
  description?: string;
  trader?: QuestTrader;
  maps: QuestMap[];
  steps: QuestStep[];
  requiredItems: QuestItemRef[];
  rewardItems: QuestItemRef[];
  grantedItems: QuestItemRef[];
  imageUrl?: string;
  sourceImageUrls: string[];
  oneRound: boolean;
  xpReward?: number;
  updatedAt?: string;
  searchText: string;
}

export interface QuestFilterOptions {
  traders: string[];
  maps: string[];
  itemTypes: string[];
  locationTypes: string[];
  enemyNames: string[];
}

export interface QuestVisualizerData {
  quests: QuestRecord[];
  filters: QuestFilterOptions;
  meta: {
    fetchedAt: string;
    questCount: number;
    assumptions: string[];
  };
}
