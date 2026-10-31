<template>
  <div class="min-h-screen bg-base-100 pb-16">
    <!-- Header banner -->
    <div class="bg-base-200 border-b border-base-content/5 py-10 mb-8">
      <div class="max-w-7xl mx-auto px-6">
        <h1 class="text-3xl font-bold mb-2">Browse Anime</h1>
        <p class="text-base-content/60 max-w-2xl mb-6">
          Search MyAnimeList by title, or jump into a ranking to find your next favorite.
        </p>

        <!-- Search -->
        <div class="relative max-w-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="query"
            type="search"
            placeholder="Search anime titles..."
            aria-label="Search anime titles"
            class="input input-bordered w-full pl-10 pr-10"
          />
          <button
            v-if="query"
            class="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Ranking presets -->
        <div class="flex flex-wrap items-center gap-2 mt-4">
          <button
            v-for="preset in RANKING_PRESETS"
            :key="preset.value"
            class="btn btn-sm rounded-full"
            :class="!isSearching && activePreset === preset.value
              ? 'btn-primary'
              : 'btn-ghost border border-base-content/10'"
            :title="preset.description"
            @click="selectPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <main class="max-w-7xl mx-auto px-6">
      <div class="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h2 class="text-lg font-bold">
          <template v-if="isSearching">Results for “{{ debouncedQuery }}”</template>
          <template v-else>{{ activePresetLabel }}</template>
        </h2>
        <span class="text-xs text-base-content/40">
          {{ results.length }}{{ hasNext ? '+' : '' }} title{{ results.length === 1 ? '' : 's' }}
        </span>
      </div>

      <BrowseResultsGrid
        :results="results"
        :loading="loading"
        :has-next-page="hasNext"
        :list-status-map="listStatusMap"
        @load-more="loadMore"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { AnimeNode, RankingType } from '~/utils/anime'

useHead({
  title: 'Browse — Anime Frame',
})

const { search, getRanking } = useCatalogApi()
const { isAuthenticated, getStatus } = useUserAnimeList()
const route = useRoute()
const router = useRouter()

const LIMIT = 24

// Accept both the new `preset` param and the old `filter` param used by
// links from earlier versions of the home page.
function normalizePreset(value: unknown): RankingType {
  const raw = String(value ?? '')
  return RANKING_PRESETS.some((preset) => preset.value === raw)
    ? (raw as RankingType)
    : 'all'
}

const initialPreset = normalizePreset(route.query.preset ?? route.query.filter)

const query = ref(String(route.query.q ?? ''))
const debouncedQuery = ref(query.value.trim())
const activePreset = ref<RankingType>(initialPreset)

const results = ref<AnimeNode[]>([])
const loading = ref(false)
const hasNext = ref(false)
const offset = ref(0)
const ready = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestId = 0

const isSearching = computed(() => debouncedQuery.value.length > 0)
const activePresetLabel = computed(
  () => RANKING_PRESETS.find((preset) => preset.value === activePreset.value)?.label ?? 'Top Anime',
)

const listStatusMap = computed<Record<number, import('~/composables/useMalApi').MalAnimeStatus>>(() => {
  if (!isAuthenticated.value) return {}
  const map: Record<number, import('~/composables/useMalApi').MalAnimeStatus> = {}
  for (const anime of results.value) {
    const status = getStatus(anime.id)
    if (status) {
      map[anime.id] = status.status
    }
  }
  return map
})

// Debounce typing so we don't search on every keystroke.
watch(query, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = value.trim()
  }, 400)
})

watch([debouncedQuery, activePreset], () => {
  if (!ready.value) return
  offset.value = 0
  fetchPage(true)
})

async function fetchPage(reset: boolean) {
  const id = ++requestId
  loading.value = true

  const pageOffset = reset ? 0 : offset.value

  try {
    const page = isSearching.value
      ? await search(debouncedQuery.value, LIMIT, pageOffset)
      : await getRanking(activePreset.value, LIMIT, pageOffset)

    // Ignore responses that arrived after a newer request started.
    if (id !== requestId) return

    results.value = reset ? page.data : [...results.value, ...page.data]
    hasNext.value = page.hasNext
    offset.value = pageOffset + page.data.length
    syncQuery()
  } catch (error) {
    if (id !== requestId) return
    console.error('[Browse] Failed to load anime:', error)
    if (reset) results.value = []
    hasNext.value = false
  } finally {
    if (id === requestId) loading.value = false
  }
}

function loadMore() {
  if (loading.value || !hasNext.value) return
  fetchPage(false)
}

function selectPreset(preset: RankingType) {
  // Clearing the query changes `debouncedQuery`, which triggers the watcher
  // below; changing the preset does the same. No manual fetch needed.
  if (isSearching.value) {
    query.value = ''
    debouncedQuery.value = ''
  }
  activePreset.value = preset
}

function clearSearch() {
  query.value = ''
  debouncedQuery.value = ''
}

function syncQuery() {
  const nextQuery: Record<string, string> = {}
  if (isSearching.value) {
    nextQuery.q = debouncedQuery.value
  } else if (activePreset.value !== 'all') {
    nextQuery.preset = activePreset.value
  }
  router.replace({ query: nextQuery })
}

// Keep the UI in sync when the user navigates with back/forward.
watch(() => route.fullPath, () => {
  const nextQuery = String(route.query.q ?? '')
  const nextPreset = normalizePreset(route.query.preset ?? route.query.filter)

  if (nextQuery !== query.value) {
    query.value = nextQuery
    debouncedQuery.value = nextQuery.trim()
  } else if (!nextQuery && nextPreset !== activePreset.value) {
    activePreset.value = nextPreset
  }
})

onMounted(() => {
  ready.value = true
  fetchPage(true)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
