<template>
  <div class="min-h-screen bg-base-100 pb-16">
    <!-- Header banner -->
    <div class="bg-base-200 border-b border-base-content/5 py-10 mb-8">
      <div class="max-w-7xl mx-auto px-6">
        <h1 class="text-3xl font-bold mb-2">Browse Anime</h1>
        <p class="text-base-content/60 max-w-2xl">
          Discover your next favorite anime. Use the filters below to narrow down your search by genre, format, status, and more.
        </p>
      </div>
    </div>

    <!-- Main flexible layout -->
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col lg:flex-row gap-8">
        
        <!-- Filter Sidebar -->
        <aside class="w-full lg:w-72 shrink-0">
          <div class="lg:sticky lg:top-24">
            <BrowseFilterSidebar
              v-model="filters"
              :genres="genres"
            />
          </div>
        </aside>

        <!-- Results Column -->
        <main class="flex-1 min-w-0">
          <BrowseResultsGrid
            :results="sortedResults"
            :loading="loading"
            :has-next-page="hasNextPage"
            :list-status-map="listStatusMap"
            @load-more="loadMore"
          />
        </main>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JikanAnime, JikanAnimeSearchFilter, JikanGenre } from '~/composables/useJikanApi'

useHead({
  title: 'Browse — Anime Frame'
})

const { searchAnime, getAnimeGenres } = useJikanApi()
const { isAuthenticated, getStatus } = useUserAnimeList()

// Shared state
const genres = ref<JikanGenre[]>([])
const results = ref<JikanAnime[]>([])
const loading = ref(false)
const hasNextPage = ref(false)

// Default type sort order: TV → Special → Movie → everything else
const TYPE_ORDER: Record<string, number> = { TV: 0, Special: 1, OVA: 2, ONA: 3, Movie: 4 }

// When no explicit sort is chosen, apply our custom type ordering client-side
const sortedResults = computed(() => {
  if (filters.value.order_by) return results.value
  return [...results.value].sort((a, b) => {
    const aRank = TYPE_ORDER[a.type ?? ''] ?? 3
    const bRank = TYPE_ORDER[b.type ?? ''] ?? 3
    return aRank - bRank
  })
})

// Map of anime ID → list status for card badges
const listStatusMap = computed<Record<number, import('~/composables/useMalApi').MalAnimeStatus>>(() => {
  if (!isAuthenticated.value) return {}
  const map: Record<number, import('~/composables/useMalApi').MalAnimeStatus> = {}
  for (const anime of results.value) {
    const status = getStatus(anime.mal_id)
    if (status) {
      map[anime.mal_id] = status.status
    }
  }
  return map
})

// Page is tracked separately so mutating it never re-triggers the filter watcher
const currentPage = ref(1)
const LIMIT = 24

const route = useRoute()

// Map the `filter` preset from Home Page ('airing', 'bypopularity', 'upcoming') to actual search params
let initialStatus = (route.query.status as string) || ''
let initialOrderBy = (route.query.order_by as string) || ''
let initialSort: 'asc' | 'desc' = (route.query.sort as 'asc' | 'desc') || 'desc'

if (route.query.filter === 'airing') {
  initialStatus = 'airing'
  initialOrderBy = 'score'
} else if (route.query.filter === 'bypopularity') {
  // Jikan's 'popularity' field is a rank (lowest number is best). Since default sort is 'desc',
  // sorting by popularity would show the LEAST popular anime. We sort by 'members' instead
  // to correctly show the most popular anime with a 'desc' sort.
  initialOrderBy = 'members'
} else if (route.query.filter === 'upcoming') {
  initialStatus = 'upcoming'
  initialOrderBy = 'members'
}

// User-controlled filter state only — no page here
const filters = ref<JikanAnimeSearchFilter>({
  q: (route.query.q as string) || '',
  type: (route.query.type as string) || '',
  status: initialStatus,
  order_by: initialOrderBy,
  sort: initialSort,
})

// Debounce timer
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Load initial genres once
onMounted(async () => {
  try {
    genres.value = await getAnimeGenres()
  } catch (e) {
    console.error('Failed to load genres', e)
  }
})

// The main fetch function — page is a parameter, never touches filters
const fetchResults = async (page: number, isLoadMore = false) => {
  loading.value = true

  if (!isLoadMore) {
    results.value = []
    currentPage.value = 1
  }

  try {
    const { data, pagination } = await searchAnime({
      ...filters.value,
      page,
      limit: LIMIT,
    })

    if (isLoadMore) {
      results.value.push(...data)
    } else {
      results.value = data
    }

    hasNextPage.value = pagination.has_next_page
  } catch (error) {
    console.error('Failed to search anime', error)
    if (!isLoadMore) results.value = []
  } finally {
    loading.value = false
  }
}

// Watch only user-controlled filters — page changes can never trigger this
watch(
  filters,
  () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchResults(1, false)
    }, 600)
  },
  { deep: true, immediate: true }
)

// Pagination handler
const loadMore = () => {
  if (loading.value || !hasNextPage.value) return
  const nextPage = currentPage.value + 1
  currentPage.value = nextPage
  fetchResults(nextPage, true)
}
</script>
