// ============================================================
// useCatalogApi — public MyAnimeList catalog client
// ============================================================
//
// All requests go through /api/mal-public, which attaches the app's
// MAL client ID (MAL has no CORS support, so the browser can't call
// api.myanimelist.net directly).
//
// Responses are cached in memory for a few minutes and identical
// in-flight requests are deduplicated, so navigating between pages
// doesn't hammer MAL.

import type {
  AnimeListPage,
  AnimeNode,
  RankingType,
  SeasonName,
} from '~/utils/anime'

const MAL_PUBLIC_PATH = '/api/mal-public'

const COMMON_FIELDS = [
  'id',
  'title',
  'main_picture',
  'alternative_titles',
  'start_date',
  'end_date',
  'media_type',
  'status',
  'genres',
  'mean',
  'rank',
  'popularity',
  'num_list_users',
  'num_scoring_users',
  'num_episodes',
  'start_season',
  'broadcast',
  'source',
  'average_episode_duration',
  'rating',
  'nsfw',
]

const LIST_FIELDS = COMMON_FIELDS.join(',')

// `related_anime`, `recommendations` and `statistics` are only available
// on the single-anime endpoint, not on list endpoints.
const FULL_FIELDS = [
  ...COMMON_FIELDS,
  'synopsis',
  'background',
  'related_anime',
  'recommendations',
  'studios',
  'statistics',
].join(',')

interface MalListResponse {
  data: Array<{ node: AnimeNode }>
  paging?: { next?: string }
}

interface CacheEntry {
  at: number
  value: unknown
}

const CACHE_TTL = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 200

const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

function remember(key: string, value: unknown): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { at: Date.now(), value })
}

async function request<T>(
  endpoint: string,
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const query = buildQuery(params)
  const key = `${endpoint}/${path}${query}`

  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.value as T
  }

  const pending = inFlight.get(key)
  if (pending) return pending as Promise<T>

  const promise = (async () => {
    const response = await fetch(`${endpoint}/${path}${query}`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      let message = response.statusText
      try {
        const body = await response.json()
        message = body?.message || body?.error || message
      } catch {
        // Response wasn't JSON — keep the status text.
      }
      throw new Error(`MyAnimeList request failed (${response.status}): ${message}`)
    }

    const data = (await response.json()) as T
    remember(key, data)
    return data
  })()

  inFlight.set(key, promise)
  try {
    return await promise
  } finally {
    inFlight.delete(key)
  }
}

function unwrapList(response: MalListResponse): AnimeListPage {
  return {
    data: (response.data ?? [])
      .map((entry) => entry?.node)
      .filter((node): node is AnimeNode => Boolean(node)),
    hasNext: Boolean(response.paging?.next),
  }
}

export const useCatalogApi = () => {
  const apiBase = String(useRuntimeConfig().public.apiBase ?? '').replace(/\/$/, '')
  const endpoint = `${apiBase}${MAL_PUBLIC_PATH}`

  // ── Rankings ─────────────────────────────────────────────
  async function getRanking(
    type: RankingType = 'all',
    limit = 15,
    offset = 0,
  ): Promise<AnimeListPage> {
    const response = await request<MalListResponse>(endpoint, 'anime/ranking', {
      ranking_type: type,
      limit,
      offset,
      fields: LIST_FIELDS,
      nsfw: 'true',
    })
    return unwrapList(response)
  }

  // ── Seasonal ─────────────────────────────────────────────
  async function getSeason(
    year: number,
    season: SeasonName,
    limit = 24,
    offset = 0,
  ): Promise<AnimeListPage> {
    const response = await request<MalListResponse>(endpoint, `anime/season/${year}/${season}`, {
      limit,
      offset,
      fields: LIST_FIELDS,
      nsfw: 'true',
      sort: 'anime_num_list_users',
    })
    return unwrapList(response)
  }

  // ── Title search ─────────────────────────────────────────
  // MAL only supports `q` (plus limit/offset/nsfw) — no genre,
  // format or status filters exist on the official API.
  async function search(
    query: string,
    limit = 24,
    offset = 0,
  ): Promise<AnimeListPage> {
    const term = query.trim()
    if (!term) return { data: [], hasNext: false }

    const response = await request<MalListResponse>(endpoint, 'anime', {
      q: term,
      limit,
      offset,
      fields: LIST_FIELDS,
      nsfw: 'true',
    })
    return unwrapList(response)
  }

  // ── Detail ───────────────────────────────────────────────
  async function getAnime(id: number): Promise<AnimeNode> {
    return request<AnimeNode>(endpoint, `anime/${id}`, { fields: FULL_FIELDS })
  }

  return {
    getRanking,
    getSeason,
    search,
    getAnime,
  }
}
