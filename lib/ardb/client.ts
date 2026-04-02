const ARDB_API_BASE_URL = "https://ardb.app/api";
export const ARDB_STATIC_BASE_URL = "https://ardb.app";

const DEFAULT_REVALIDATE_SECONDS = 60 * 30;

async function fetchArdbJson(path: string): Promise<unknown> {
  const response = await fetch(`${ARDB_API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: DEFAULT_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error(`ARDB request failed (${response.status}) for path: ${path}`);
  }

  return response.json();
}

export async function fetchQuestSummaries(): Promise<unknown[]> {
  const payload = await fetchArdbJson("/quests");
  return Array.isArray(payload) ? payload : [];
}

export async function fetchQuestDetail(id: string): Promise<unknown> {
  return fetchArdbJson(`/quests/${encodeURIComponent(id)}`);
}

export async function fetchItems(): Promise<unknown[]> {
  const payload = await fetchArdbJson("/items");
  return Array.isArray(payload) ? payload : [];
}

export async function fetchArcEnemies(): Promise<unknown[]> {
  const payload = await fetchArdbJson("/arc-enemies");
  return Array.isArray(payload) ? payload : [];
}
