// ============================================================
// Shared anime types + display helpers (MyAnimeList API v2)
// ============================================================

export type SeasonName = 'winter' | 'spring' | 'summer' | 'fall'

export type MediaType =
  | 'unknown'
  | 'tv'
  | 'ova'
  | 'movie'
  | 'special'
  | 'ona'
  | 'music'

export type AiringStatus =
  | 'finished_airing'
  | 'currently_airing'
  | 'not_yet_aired'

export type RankingType =
  | 'all'
  | 'airing'
  | 'upcoming'
  | 'bypopularity'
  | 'favorite'

export interface AnimePicture {
  medium: string
  large: string
}

export interface AnimeGenre {
  id: number
  name: string
}

export interface AnimeSeason {
  year: number
  season: SeasonName
}

export interface AnimeBroadcast {
  day_of_the_week: string
  start_time?: string
}

export interface AnimeStatistics {
  status: {
    watching: string
    completed: string
    on_hold: string
    dropped: string
    plan_to_watch: string
  }
  num_list_users: string
}

/** A node as returned inside `data[].node` by list endpoints. */
export interface AnimeNode {
  id: number
  title: string
  main_picture?: AnimePicture | null
  alternative_titles?: {
    synonyms: string[]
    en: string
    ja: string
  }
  start_date?: string
  end_date?: string
  synopsis?: string
  mean?: number
  rank?: number
  popularity?: number
  num_list_users?: number
  num_scoring_users?: number
  nsfw?: string
  media_type?: MediaType
  status?: AiringStatus
  genres?: AnimeGenre[]
  num_episodes?: number
  start_season?: AnimeSeason
  broadcast?: AnimeBroadcast
  source?: string
  average_episode_duration?: number
  rating?: string
  pictures?: AnimePicture[]
  background?: string
  related_anime?: AnimeRelation[]
  recommendations?: AnimeRecommendation[]
  studios?: Array<{ id: number; name: string }>
  statistics?: AnimeStatistics
}

export interface AnimeRelation {
  node: AnimeNode
  relation_type: string
  relation_type_formatted: string
}

export interface AnimeRecommendation {
  node: AnimeNode
  num_recommendations: number
}

/** A page of list results, already unwrapped from MAL's `{ node }` wrapper. */
export interface AnimeListPage {
  data: AnimeNode[]
  hasNext: boolean
}

export interface AnimeRankingPreset {
  value: RankingType
  label: string
  description: string
}

export const RANKING_PRESETS: AnimeRankingPreset[] = [
  { value: 'all', label: 'Top Anime', description: 'Highest rated anime of all time' },
  { value: 'airing', label: 'Airing', description: 'Highest rated currently airing anime' },
  { value: 'upcoming', label: 'Upcoming', description: 'Most anticipated upcoming anime' },
  { value: 'bypopularity', label: 'Popular', description: 'Most listed anime on MyAnimeList' },
  { value: 'favorite', label: 'Favorites', description: 'Most favorited anime by members' },
]

// ── Labels ──────────────────────────────────────────────────

const MEDIA_TYPE_LABELS: Record<string, string> = {
  tv: 'TV',
  movie: 'Movie',
  ova: 'OVA',
  ona: 'ONA',
  special: 'Special',
  music: 'Music',
  unknown: 'Unknown',
}

export function mediaTypeLabel(type?: string | null): string {
  if (!type) return ''
  return MEDIA_TYPE_LABELS[type] ?? type.toUpperCase()
}

const AIRING_STATUS_LABELS: Record<string, string> = {
  currently_airing: 'Currently Airing',
  finished_airing: 'Finished Airing',
  not_yet_aired: 'Not Yet Aired',
}

export function airingStatusLabel(status?: string | null): string {
  if (!status) return ''
  return AIRING_STATUS_LABELS[status] ?? status
}

const RATING_LABELS: Record<string, string> = {
  g: 'G',
  pg: 'PG',
  pg_13: 'PG-13',
  r: 'R',
  'r+': 'R+',
  r_plus: 'R+',
  rx: 'Rx',
}

export function ratingLabel(rating?: string | null): string {
  if (!rating) return ''
  return RATING_LABELS[rating] ?? rating.toUpperCase()
}

export function capitalize(value: string): string {
  if (!value) return ''
  return value[0]!.toUpperCase() + value.slice(1)
}

export function seasonLabel(season?: AnimeSeason | null): string {
  if (!season) return ''
  return `${capitalize(season.season)} ${season.year}`
}

export function weekdayLabel(day?: string | null): string {
  if (!day) return ''
  return `${capitalize(day)}s`
}

export function broadcastLabel(broadcast?: AnimeBroadcast | null): string {
  if (!broadcast?.day_of_the_week) return ''
  const day = weekdayLabel(broadcast.day_of_the_week)
  return broadcast.start_time ? `${day} at ${broadcast.start_time} (JST)` : day
}

// ── Numbers & dates ─────────────────────────────────────────

export function formatCount(value?: number | string | null): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (num == null || !Number.isFinite(num)) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}

/** MAL allows `2017`, `2017-10` and `2017-10-23`. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatPartialDate(value?: string | null): string {
  if (!value) return ''
  const [yearPart, monthPart, dayPart] = value.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)

  if (!year) return ''
  if (!month) return String(year)
  if (!day) return `${MONTHS[month - 1]} ${year}`
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

/** `average_episode_duration` is in seconds. */
export function formatEpisodeDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return ''
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`
}

// ── Seasons ─────────────────────────────────────────────────

export const SEASON_ORDER: SeasonName[] = ['winter', 'spring', 'summer', 'fall']

export function getCurrentSeason(date = new Date()): AnimeSeason {
  const month = date.getMonth()
  const index = Math.floor(month / 3)
  return {
    year: date.getFullYear(),
    season: SEASON_ORDER[index] ?? 'winter',
  }
}

/**
 * MAL has no "list all seasons" endpoint, so the timeline is generated.
 * Starting at 1960 keeps the horizontal list useful without rendering
 * a century of mostly-empty seasons.
 */
export const SEASON_TIMELINE_START_YEAR = 1960

export function buildSeasonTimeline(
  startYear = SEASON_TIMELINE_START_YEAR,
  now = new Date(),
): AnimeSeason[] {
  const current = getCurrentSeason(now)
  const currentIndex = SEASON_ORDER.indexOf(current.season)
  const timeline: AnimeSeason[] = []

  for (let year = startYear; year <= current.year; year++) {
    const lastIndex = year === current.year ? currentIndex : SEASON_ORDER.length - 1
    for (let i = 0; i <= lastIndex; i++) {
      timeline.push({ year, season: SEASON_ORDER[i]! })
    }
  }

  return timeline
}

export function isSameSeason(a: AnimeSeason, b: AnimeSeason): boolean {
  return a.year === b.year && a.season === b.season
}
