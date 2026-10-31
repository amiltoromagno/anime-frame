// ============================================================
// useUserAnimeList — Cached user anime list for O(1) lookups
// ============================================================

import type { MalListEntry, MalListStatus, MalUpdateListParams } from './useMalApi'

interface ListCache {
  [malId: number]: MalListEntry
}

export const useUserAnimeList = () => {
  const cache = useState<ListCache>('user-list-cache', () => ({}))
  const listLoading = useState<boolean>('user-list-loading', () => false)

  const { isAuthenticated } = useAuth()

  // ── Load full list into cache ───────────────────────────
  async function fetchFullList(): Promise<void> {
    if (!isAuthenticated.value) {
      cache.value = {}
      return
    }

    listLoading.value = true
    try {
      const { fetchFullUserList } = useMalApi()
      const entries = await fetchFullUserList()

      const newCache: ListCache = {}
      for (const entry of entries) {
        newCache[entry.node.id] = entry
      }
      cache.value = newCache
    } catch (err) {
      console.error('[useUserAnimeList] Failed to load list:', err)
    } finally {
      listLoading.value = false
    }
  }

  // ── Lookups ─────────────────────────────────────────────
  function getEntry(malId: number): MalListEntry | undefined {
    return cache.value[malId]
  }

  function getStatus(malId: number): MalListStatus | undefined {
    return cache.value[malId]?.list_status
  }

  function isInList(malId: number): boolean {
    return malId in cache.value
  }

  // ── Update cache after a mutation ───────────────────────
  function updateEntry(malId: number, status: MalListStatus): void {
    // If the entry exists, update it; otherwise we'd need the full node
    if (cache.value[malId]) {
      cache.value[malId] = {
        ...cache.value[malId],
        list_status: status,
      }
    }
  }

  function removeEntry(malId: number): void {
    const newCache = { ...cache.value }
    delete newCache[malId]
    cache.value = newCache
  }

  // ── Add a fresh entry (after adding to list) ────────────
  async function addEntryFromApi(malId: number): Promise<void> {
    try {
      const { getAnimeListStatus } = useMalApi()
      const status = await getAnimeListStatus(malId)
      if (status) {
        // We need the basic anime info too, so pull the fresh entry below.
        // For now, we'll just fetch the full list again for this entry
        await refreshSingleEntry(malId)
      }
    } catch (err) {
      console.error('[useUserAnimeList] addEntryFromApi error:', err)
    }
  }

  // ── Refresh a single entry's full data ──────────────────
  async function refreshSingleEntry(malId: number): Promise<void> {
    try {
      const { getUserAnimeList } = useMalApi()
      // Fetch list entries that include this anime (using offset=0, status filter won't help here)
      // Instead, we directly get the list status then build a minimal entry
      const { getAnimeListStatus } = useMalApi()
      const status = await getAnimeListStatus(malId)
      if (status) {
        // We have the status but need the node — pull the anime's basic info
        // from the catalog API and combine them.
        const { getAnime } = useCatalogApi()
        const anime = await getAnime(malId)

        cache.value = {
          ...cache.value,
          [malId]: {
            node: {
              id: malId,
              title: anime.title,
              main_picture: anime.main_picture ?? null,
              alternative_titles: anime.alternative_titles,
              num_episodes: anime.num_episodes || undefined,
              media_type: anime.media_type,
              status: anime.status,
              mean: anime.mean,
              rank: anime.rank,
              genres: anime.genres,
            },
            list_status: status,
          },
        }
      } else {
        removeEntry(malId)
      }
    } catch (err) {
      console.error('[useUserAnimeList] refreshSingleEntry error:', err)
    }
  }

  // ── Counts per status ───────────────────────────────────
  const counts = computed(() => {
    const entries = Object.values(cache.value)
    return {
      watching: entries.filter((e) => e.list_status.status === 'watching').length,
      completed: entries.filter((e) => e.list_status.status === 'completed').length,
      on_hold: entries.filter((e) => e.list_status.status === 'on_hold').length,
      dropped: entries.filter((e) => e.list_status.status === 'dropped').length,
      plan_to_watch: entries.filter((e) => e.list_status.status === 'plan_to_watch').length,
      total: entries.length,
    }
  })

  return {
    cache,
    listLoading,
    counts,
    isAuthenticated,
    fetchFullList,
    getEntry,
    getStatus,
    isInList,
    updateEntry,
    removeEntry,
    addEntryFromApi,
    refreshSingleEntry,
  }
}
