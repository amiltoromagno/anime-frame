// ============================================================
// useMalApi — Authenticated MyAnimeList API v2 client
// ============================================================

import type { MalUser } from './useAuth'

// ── Types ───────────────────────────────────────────────────

export type MalAnimeStatus =
  | 'watching'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_watch'

export interface MalAnimeNode {
  id: number
  title: string
  main_picture: {
    medium: string
    large: string
  } | null
  alternative_titles?: {
    synonyms: string[]
    en: string
    ja: string
  }
  start_date?: string
  end_date?: string
  mean?: number
  rank?: number
  media_type?: string
  status?: string
  num_episodes?: number
  genres?: Array<{ id: number; name: string }>
}

export interface MalListEntry {
  node: MalAnimeNode
  list_status: MalListStatus
}

export interface MalListStatus {
  status: MalAnimeStatus
  score: number
  num_episodes_watched: number
  is_rewatching: boolean
  updated_at: string
  priority: number
  num_times_rewatched: number
  rewatch_value: number
  tags: string[]
  comments: string
  start_date: string | null
  finish_date: string | null
  days?: number
  days_watched?: number
}

export interface MalPagination {
  next?: string
  previous?: string
}

export interface MalUserListResponse {
  data: MalListEntry[]
  paging: MalPagination
}

export interface MalUpdateListParams {
  status?: MalAnimeStatus
  score?: number
  num_watched_episodes?: number
  is_rewatching?: boolean
  priority?: number
  num_times_rewatched?: number
  rewatch_value?: number
  tags?: string
  comments?: string
  start_date?: string // yyyy-mm-dd
  finish_date?: string // yyyy-mm-dd
}

export interface MalUserStats {
  anime_statistics?: {
    num_items_watching: number
    num_items_completed: number
    num_items_on_hold: number
    num_items_dropped: number
    num_items_plan_to_watch: number
    num_items: number
    num_days_watched: number
    num_days_watching: number
    num_days_completed: number
    num_days_on_hold: number
    num_days_dropped: number
    num_days: number
    num_episodes: number
    num_times_rewatched: number
    mean_score: number
  }
}

// ── Helpers ─────────────────────────────────────────────────

async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retries = 2,
): Promise<Response> {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  if (!accessToken.value) {
    throw new Error('Not authenticated')
  }

  const makeRequest = async (token: string): Promise<Response> => {
    // Route through our proxy to avoid CORS issues with MAL's API
    const proxyUrl = url.replace('https://api.myanimelist.net/v2/', '/api/mal-proxy/')
    return fetch(proxyUrl, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  }

  let response = await makeRequest(accessToken.value)

  // Auto-refresh on 401
  if (response.status === 401 && retries > 0) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await makeRequest(accessToken.value!)
    } else {
      await logout()
      throw new Error('Session expired. Please sign in again.')
    }
  }

  return response
}

// ── Composable ──────────────────────────────────────────────

export const useMalApi = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.malApiBaseUrl as string

  // ── Get user profile (including stats) ──────────────────
  async function getUserProfile(): Promise<MalUser & MalUserStats> {
    const response = await authenticatedFetch(
      `${baseUrl}/users/@me?fields=anime_statistics`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`)
    }
    return response.json()
  }

  // ── Get user's anime list (paginated) ───────────────────
  async function getUserAnimeList(params?: {
    status?: MalAnimeStatus
    sort?: 'list_score' | 'list_updated_at' | 'anime_title' | 'anime_start_date'
    limit?: number
    offset?: number
    fields?: string
  }): Promise<MalUserListResponse> {
    const query = new URLSearchParams()

    query.set('fields', params?.fields || 'list_status,alternative_titles,mean,rank,media_type,status,num_episodes,genres')

    query.set('nsfw', 'true')

    if (params?.status) query.set('status', params.status)
    if (params?.sort) query.set('sort', params.sort)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))

    const response = await authenticatedFetch(
      `${baseUrl}/users/@me/animelist?${query.toString()}`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch anime list: ${response.status}`)
    }
    return response.json()
  }

  // ── Get list status for a single anime ─────────────────
  // MAL doesn't have GET /anime/{id}/my_list_status — the status is a field
  // on the anime object, so we request GET /anime/{id}?fields=my_list_status
  async function getAnimeListStatus(animeId: number): Promise<MalListStatus | null> {
    const response = await authenticatedFetch(
      `${baseUrl}/anime/${animeId}?fields=my_list_status`,
    )
    if (response.status === 404) return null
    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Failed to fetch list status: ${response.status} — ${errBody.slice(0, 200)}`)
    }
    const data = await response.json()
    // If the anime isn't in the user's list, MAL omits the field entirely
    return data.my_list_status ?? null
  }

  // ── Add or update anime list entry ────────────────────
  async function updateAnimeListStatus(
    animeId: number,
    params: MalUpdateListParams,
  ): Promise<MalListStatus> {
    const body = new URLSearchParams()

    if (params.status !== undefined) body.set('status', params.status)
    if (params.score !== undefined) body.set('score', String(params.score))
    if (params.num_watched_episodes !== undefined) {
      body.set('num_watched_episodes', String(params.num_watched_episodes))
    }
    if (params.is_rewatching !== undefined) {
      body.set('is_rewatching', params.is_rewatching ? 'true' : 'false')
    }
    if (params.num_times_rewatched !== undefined) {
      body.set('num_times_rewatched', String(params.num_times_rewatched))
    }
    if (params.start_date !== undefined) body.set('start_date', params.start_date)
    if (params.finish_date !== undefined) body.set('finish_date', params.finish_date)
    if (params.tags !== undefined) body.set('tags', params.tags)
    if (params.comments !== undefined) body.set('comments', params.comments)
    if (params.priority !== undefined) body.set('priority', String(params.priority))
    if (params.rewatch_value !== undefined) {
      body.set('rewatch_value', String(params.rewatch_value))
    }

    const response = await authenticatedFetch(
      `${baseUrl}/anime/${animeId}/my_list_status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    )
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Failed to update list status: ${response.status} — ${errText}`)
    }
    return response.json()
  }

  // ── Remove anime from list ─────────────────────────────
  async function deleteAnimeListStatus(animeId: number): Promise<void> {
    const response = await authenticatedFetch(
      `${baseUrl}/anime/${animeId}/my_list_status`,
      { method: 'DELETE' },
    )
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete list entry: ${response.status}`)
    }
  }

  // ── Helper: fetch full list across all pages ──────────
  async function fetchFullUserList(): Promise<MalListEntry[]> {
    const allEntries: MalListEntry[] = []
    let offset = 0
    const limit = 1000 // MAL max per page

    while (true) {
      const response = await getUserAnimeList({ limit, offset })
      allEntries.push(...response.data)

      if (response.paging.next) {
        offset += limit
      } else {
        break
      }
    }

    return allEntries
  }

  return {
    getUserProfile,
    getUserAnimeList,
    getAnimeListStatus,
    updateAnimeListStatus,
    deleteAnimeListStatus,
    fetchFullUserList,
  }
}
