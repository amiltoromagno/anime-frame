const BASE_URL = 'https://api.jikan.moe/v4'

interface JikanAnime {
  mal_id: number
  title: string
  title_english: string | null
  images: {
    jpg: {
      image_url: string
      large_image_url: string
    }
    webp: {
      image_url: string
      large_image_url: string
    }
  }
  trailer: {
    youtube_id: string | null
    embed_url: string | null
  }
  score: number | null
  scored_by: number | null
  rank: number | null
  popularity: number | null
  members: number
  favorites: number
  synopsis: string | null
  season: string | null
  year: number | null
  type: string | null
  source: string | null
  episodes: number | null
  status: string | null
  rating: string | null
  duration: string | null
  genres: Array<{ mal_id: number; name: string }>
  themes: Array<{ mal_id: number; name: string }>
  demographics: Array<{ mal_id: number; name: string }>
  studios: Array<{ mal_id: number; name: string }>
  aired: {
    string: string | null
  }
}

interface JikanNamedEntity {
  mal_id: number
  type: string
  name: string
  url: string
}

interface JikanAnimeFullDetail extends JikanAnime {
  title_japanese: string | null
  title_synonyms: string[]
  background: string | null
  source: string | null
  duration: string | null
  rating: string | null
  scored_by: number | null
  popularity: number | null
  favorites: number
  broadcast: {
    day: string | null
    time: string | null
    timezone: string | null
    string: string | null
  }
  producers: JikanNamedEntity[]
  licensors: JikanNamedEntity[]
  studios: JikanNamedEntity[]
  genres: JikanNamedEntity[]
  explicit_genres: JikanNamedEntity[]
  themes: JikanNamedEntity[]
  demographics: JikanNamedEntity[]
  relations: Array<{
    relation: string
    entry: JikanNamedEntity[]
  }>
  theme: {
    openings: string[]
    endings: string[]
  }
  external: Array<{ name: string; url: string }>
  streaming: Array<{ name: string; url: string }>
}

interface JikanCharacterImage {
  jpg: { image_url: string }
  webp?: { image_url: string }
}

interface JikanCharacter {
  character: {
    mal_id: number
    url: string
    images: JikanCharacterImage
    name: string
  }
  role: string
  favorites: number
  voice_actors: Array<{
    person: {
      mal_id: number
      url: string
      images: { jpg: { image_url: string } }
      name: string
    }
    language: string
  }>
}

interface JikanRecommendation {
  entry: {
    mal_id: number
    url: string
    images: JikanAnime['images']
    title: string
  }
  votes: number
}

interface JikanResponse {
  data: JikanAnime[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

interface JikanGenre {
  mal_id: number
  name: string
  url: string
  count: number
}

interface JikanAnimeSearchFilter {
  q?: string
  page?: number
  limit?: number
  type?: string
  status?: string
  genres?: string // comma-separated IDs
  order_by?: string
  sort?: 'asc' | 'desc'
}

interface JikanSeason {
  year: number
  seasons: string[]
}

type SeasonName = 'winter' | 'spring' | 'summer' | 'fall'

// Rate limiter: ~1 request per second (Jikan free tier is strict)
let lastRequestTime = 0
const MIN_INTERVAL = 1100

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const rateLimitedFetch = async (url: string, retries = 3): Promise<any> => {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_INTERVAL) {
    await delay(MIN_INTERVAL - timeSinceLastRequest)
  }
  lastRequestTime = Date.now()

  const response = await fetch(url)

  // Retry on rate limit (429)
  if (response.status === 429 && retries > 0) {
    const retryAfter = Math.min(2000 * (4 - retries), 5000)
    console.warn(`Jikan rate limited, retrying in ${retryAfter}ms...`)
    await delay(retryAfter)
    lastRequestTime = 0 // reset so next call waits full interval
    return rateLimitedFetch(url, retries - 1)
  }

  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`)
  }
  return response.json()
}

export const useJikanApi = () => {

  const getTopAnime = async (filter?: string, limit: number = 12): Promise<JikanAnime[]> => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (filter) params.set('filter', filter)
    const result: JikanResponse = await rateLimitedFetch(`${BASE_URL}/top/anime?${params}`)
    return result.data
  }

  const getSeasonNow = async (limit: number = 12): Promise<JikanAnime[]> => {
    const params = new URLSearchParams({ limit: String(limit) })
    const result: JikanResponse = await rateLimitedFetch(`${BASE_URL}/seasons/now?${params}`)
    return result.data
  }

  const getAnimeById = async (id: number): Promise<JikanAnime> => {
    const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}`)
    return result.data
  }

  const getAnimeFullById = async (id: number): Promise<JikanAnimeFullDetail> => {
    const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}/full`)
    return result.data
  }

  const getAnimeCharacters = async (id: number): Promise<JikanCharacter[]> => {
    const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}/characters`)
    return result.data
  }

  const getAnimeRecommendations = async (id: number): Promise<JikanRecommendation[]> => {
    const result = await rateLimitedFetch(`${BASE_URL}/anime/${id}/recommendations`)
    return result.data
  }

  const getAnimeGenres = async (): Promise<JikanGenre[]> => {
    const result = await rateLimitedFetch(`${BASE_URL}/genres/anime`)
    return result.data
  }

  const getSeasonsList = async (): Promise<JikanSeason[]> => {
    const result = await rateLimitedFetch(`${BASE_URL}/seasons`)
    return result.data as JikanSeason[]
  }

  const getSeasonAnime = async (
    year: number,
    season: SeasonName,
    page: number = 1,
    limit: number = 24
  ): Promise<{ data: JikanAnime[]; pagination: JikanResponse['pagination'] }> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const result: JikanResponse = await rateLimitedFetch(`${BASE_URL}/seasons/${year}/${season}?${params}`)
    return { data: result.data, pagination: result.pagination }
  }

  const searchAnime = async (filters: JikanAnimeSearchFilter): Promise<{ data: JikanAnime[], pagination: JikanResponse['pagination'] }> => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.page) params.set('page', String(filters.page))
    params.set('limit', String(filters.limit || 24)) // Default higher limit for grid viewing
    if (filters.type) params.set('type', filters.type)
    if (filters.status) params.set('status', filters.status)
    if (filters.genres) params.set('genres', filters.genres)
    if (filters.order_by) params.set('order_by', filters.order_by)
    if (filters.sort) params.set('sort', filters.sort)

    const result: JikanResponse = await rateLimitedFetch(`${BASE_URL}/anime?${params}`)
    return { data: result.data, pagination: result.pagination }
  }

  return {
    getTopAnime,
    getSeasonNow,
    getAnimeById,
    getAnimeFullById,
    getAnimeCharacters,
    getAnimeRecommendations,
    getAnimeGenres,
    getSeasonsList,
    getSeasonAnime,
    searchAnime,
  }
}

export type { JikanAnime, JikanAnimeFullDetail, JikanCharacter, JikanRecommendation, JikanGenre, JikanAnimeSearchFilter, JikanResponse, JikanSeason, SeasonName }
