<template>
  <div class="min-h-screen bg-base-100 pb-20">

    <!-- ─── Timeline Season Selector ─────────────────────────────── -->
    <div class="bg-base-200 border-b border-base-content/5 py-6">
      <div
        ref="timelineEl"
        class="flex items-end gap-0 overflow-x-auto scrollbar-none px-6 select-none cursor-grab active:cursor-grabbing"
        style="scroll-behavior: smooth;"
        @mousedown="startDrag"
        @mouseleave="stopDrag"
        @mouseup="stopDrag"
        @mousemove="onDrag"
      >
        <!-- Spacer so the first item isn't flush left -->
        <div class="shrink-0 w-8" />

        <template v-for="(entry, i) in timeline" :key="`${entry.year}-${entry.season}`">
          <!-- Connector line (except before the first item) -->
          <div
            v-if="i > 0"
            class="shrink-0 h-px w-6 mb-4 transition-colors duration-300"
            :class="isSelected(entry) ? 'bg-primary/60' : 'bg-base-content/15'"
          />

          <!-- Season node -->
          <button
            class="shrink-0 flex flex-col items-center gap-1.5 px-3 py-1 transition-all duration-200 group relative overflow-visible"
            :class="isSelected(entry) ? 'cursor-default' : 'hover:opacity-80 cursor-pointer'"
            @click="selectSeason(entry)"
            :data-selected="isSelected(entry) ? true : undefined"
          >
            <!-- Dot -->
            <div
              class="rounded-full transition-all duration-300 w-2 h-2"
              :class="[
                isSelected(entry)
                  ? 'bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/40'
                  : 'bg-base-content/20 group-hover:bg-base-content/40'
              ]"
            />
            <!-- Season name -->
            <span
              class="capitalize transition-all duration-300 whitespace-nowrap text-xs font-medium"
              :class="[
                isSelected(entry)
                  ? 'text-primary font-bold'
                  : 'text-base-content/40 group-hover:text-base-content/70'
              ]"
            >
              {{ entry.season }}
            </span>
            <!-- Year label -->
            <span
              class="text-[10px] font-semibold transition-all duration-300"
              :class="[
                isSelected(entry)
                  ? 'text-primary/80'
                  : 'text-base-content/25'
              ]"
            >
              {{ entry.year }}
            </span>
          </button>
        </template>

        <!-- End spacer -->
        <div class="shrink-0 w-8" />
      </div>
    </div>

    <!-- ─── Season Header ─────────────────────────────────────────── -->
    <div class="max-w-7xl mx-auto px-6 pt-8 pb-4">
      <Transition name="fade-up" mode="out-in">
        <div :key="`${selected.year}-${selected.season}`" class="flex flex-col sm:flex-row sm:items-end gap-3 mb-8">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <!-- Season icon -->
              <span class="text-2xl">{{ seasonEmoji(selected.season) }}</span>
              <span class="text-xs font-bold uppercase tracking-widest text-base-content/40">Season</span>
            </div>
            <h1 class="text-4xl font-extrabold capitalize leading-tight">
              {{ selected.season }}
              <span class="text-primary">{{ selected.year }}</span>
            </h1>
          </div>

          <div class="sm:ml-auto flex items-center gap-3">
            <!-- Airing count chip -->
            <div v-if="!loading && results.length" class="badge badge-outline badge-lg gap-1.5 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              {{ results.length }}{{ hasNextPage ? '+' : '' }} titles
            </div>
            <!-- Is current season? -->
            <div v-if="isCurrentSeason" class="badge badge-success badge-lg gap-1.5 font-semibold animate-pulse">
              <span class="w-1.5 h-1.5 rounded-full bg-success-content inline-block"></span>
              Airing now
            </div>
          </div>
        </div>
      </Transition>

      <!-- ─── Results Grid ───────────────────────────────────────── -->
      <BrowseResultsGrid
        :results="sortedResults"
        :loading="loading"
        :has-next-page="hasNextPage"
        :list-status-map="listStatusMap"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnimeNode, AnimeSeason } from '~/utils/anime'

useHead({ title: 'Seasonal — Anime Frame' })

const { getSeason } = useCatalogApi()

// ── Season list ──────────────────────────────────────────────────
// MAL exposes no "list seasons" endpoint, so the timeline is generated
// locally from SEASON_TIMELINE_START_YEAR through the current season.
const timeline = ref<AnimeSeason[]>([])
const selected = ref<AnimeSeason>(getCurrentSeason())

const isCurrentSeason = computed(() => isSameSeason(selected.value, getCurrentSeason()))

function isSelected(entry: AnimeSeason) {
  return isSameSeason(entry, selected.value)
}

const seasonEmoji = (season: string) =>
  ({ winter: '❄️', spring: '🌸', summer: '☀️', fall: '🍂' }[season] ?? '📅')

// ── Timeline scroll ───────────────────────────────────────────────
const timelineEl = ref<HTMLElement | null>(null)

function scrollToSelected() {
  nextTick(() => {
    if (!timelineEl.value) return
    const container = timelineEl.value
    const node = container.querySelector<HTMLElement>('[data-selected]')
    if (node) {
      const nodeLeft = node.offsetLeft
      const nodeWidth = node.offsetWidth
      const center = nodeLeft - container.offsetWidth / 2 + nodeWidth / 2
      container.scrollTo({ left: center, behavior: 'smooth' })
    }
  })
}

// ── Drag to scroll ────────────────────────────────────────────────
const isDragging = ref(false)
let startX = 0
let scrollLeft = 0

const startDrag = (e: MouseEvent) => {
  if (!timelineEl.value) return
  isDragging.value = true
  // Temporarily disable smooth scroll during drag for instant tracking
  timelineEl.value.style.scrollBehavior = 'auto'
  startX = e.pageX - timelineEl.value.offsetLeft
  scrollLeft = timelineEl.value.scrollLeft
}

const stopDrag = () => {
  isDragging.value = false
  if (timelineEl.value) {
    timelineEl.value.style.scrollBehavior = 'smooth'
  }
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value || !timelineEl.value) return
  e.preventDefault()
  const x = e.pageX - timelineEl.value.offsetLeft
  const walk = (x - startX) * 2 // Scroll speed multiplier
  timelineEl.value.scrollLeft = scrollLeft - walk
}

// ── Results ───────────────────────────────────────────────────────
const results = ref<AnimeNode[]>([])
const loading = ref(false)
const hasNextPage = ref(false)
const offset = ref(0)
const LIMIT = 24

let requestId = 0

// Type priority sort (same logic as Browse)
const TYPE_ORDER: Record<string, number> = { tv: 0, special: 1, ova: 2, ona: 3, movie: 4 }

const sortedResults = computed(() =>
  [...results.value].sort((a, b) => {
    const aRank = TYPE_ORDER[a.media_type ?? ''] ?? 3
    const bRank = TYPE_ORDER[b.media_type ?? ''] ?? 3
    return aRank - bRank
  }),
)

// Map of anime ID → list status for card badges
const { isAuthenticated, getStatus } = useUserAnimeList()
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

async function fetchResults(reset: boolean) {
  const id = ++requestId
  loading.value = true

  const pageOffset = reset ? 0 : offset.value

  try {
    const page = await getSeason(selected.value.year, selected.value.season, LIMIT, pageOffset)
    if (id !== requestId) return

    results.value = reset ? page.data : [...results.value, ...page.data]
    hasNextPage.value = page.hasNext
    offset.value = pageOffset + page.data.length
  } catch (error) {
    if (id !== requestId) return
    console.error('[Seasonal] Failed to load season:', error)
    if (reset) results.value = []
    hasNextPage.value = false
  } finally {
    if (id === requestId) loading.value = false
  }
}

const loadMore = () => {
  if (loading.value || !hasNextPage.value) return
  fetchResults(false)
}

const selectSeason = (entry: AnimeSeason) => {
  if (isSelected(entry)) return
  selected.value = entry
  offset.value = 0
  fetchResults(true)
  scrollToSelected()
}

// ── Boot ──────────────────────────────────────────────────────────
onMounted(async () => {
  timeline.value = buildSeasonTimeline()
  const current = timeline.value[timeline.value.length - 1]
  if (current) selected.value = current

  await fetchResults(true)
  scrollToSelected()
})
</script>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
