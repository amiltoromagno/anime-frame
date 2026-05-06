<template>
  <div class="min-h-screen bg-base-100 pb-16">
    <!-- Header banner -->
    <div class="bg-base-200 border-b border-base-content/5 py-8 mb-6">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col sm:flex-row sm:items-end gap-2">
          <div>
            <h1 class="text-3xl font-bold">My List</h1>
            <p class="text-base-content/60 text-sm mt-1">
              {{ user?.name ? `${user.name}'s anime list` : 'Track your anime journey' }}
            </p>
          </div>
          <!-- Stats -->
          <div v-if="stats" class="sm:ml-auto flex flex-wrap gap-3 text-xs">
            <div class="bg-base-100 rounded-lg px-3 py-1.5 border border-base-content/5">
              <span class="text-base-content/40">Total</span>
              <span class="font-bold ml-1">{{ stats.total }}</span>
            </div>
            <div class="bg-base-100 rounded-lg px-3 py-1.5 border border-base-content/5">
              <span class="text-base-content/40">Mean Score</span>
              <span class="font-bold ml-1 text-yellow-400">{{ meanScore }}</span>
            </div>
            <div class="bg-base-100 rounded-lg px-3 py-1.5 border border-base-content/5">
              <span class="text-base-content/40">Days Watched</span>
              <span class="font-bold ml-1">{{ totalDays }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6">
      <!-- Tabs -->
      <div class="tabs tabs-boxed bg-base-200 border border-base-content/5 mb-6 overflow-x-auto flex-nowrap gap-0 p-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab tab-sm whitespace-nowrap"
          :class="{ 'tab-active': activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span class="ml-1.5 text-xs opacity-50">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="flex-1">
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filter by title..."
              class="input input-sm input-bordered w-full pl-2"
            />
          </div>
        </div>
        <div class="flex gap-2">
          <select v-model="sortBy" class="select select-sm select-bordered" @change="reloadList">
            <option value="list_updated_at">Last Updated</option>
            <option value="list_score">Score</option>
            <option value="anime_title">Title</option>
            <option value="anime_start_date">Start Date</option>
          </select>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading && entries.length === 0" class="space-y-3">
        <div v-for="i in 8" :key="i" class="flex gap-3 bg-base-200 rounded-xl overflow-hidden animate-pulse">
          <div class="w-20 h-28 bg-base-300 shrink-0" />
          <div class="flex-1 py-3 pr-3 space-y-2">
            <div class="h-4 bg-base-300 rounded w-3/4" />
            <div class="h-3 bg-base-300 rounded w-1/3" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredEntries.length === 0 && !loading" class="py-20 text-center">
        <div class="text-6xl mb-4">
          {{ searchQuery ? '🔍' : '📋' }}
        </div>
        <h3 class="text-xl font-bold mb-2">
          {{ searchQuery ? 'No matches found' : 'Nothing here yet' }}
        </h3>
        <p class="text-base-content/60 max-w-sm mx-auto mb-6">
          {{ searchQuery
            ? 'Try a different search term.'
            : 'Start adding anime to your list from the Browse or Seasonal pages.'
          }}
        </p>
        <NuxtLink v-if="!searchQuery" to="/browse" class="btn btn-primary btn-sm rounded-full">
          Browse Anime
        </NuxtLink>
      </div>

      <!-- List -->
      <div v-else class="space-y-2">
        <TransitionGroup name="list-fade">
          <MyListCard
            v-for="entry in filteredEntries"
            :key="entry.node.id"
            :entry="entry"
            :ref="(el: any) => cardRefs[entry.node.id] = el"
            @update="onEntryUpdated"
          />
        </TransitionGroup>

        <!-- Load more — hidden during search -->
        <div v-if="hasNextPage && !searchQuery.trim()" class="flex justify-center pt-6">
          <button
            class="btn btn-outline btn-wide rounded-full"
            :class="{ 'loading': loadingMore }"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Loading...' : 'Load More' }}
          </button>
        </div>

        <!-- Count -->
        <p class="text-center text-xs text-base-content/30 pt-4">
          {{ searchQuery.trim() ? 'Found' : 'Showing' }} {{ filteredEntries.length }} title{{ filteredEntries.length !== 1 ? 's' : '' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

import type { MalAnimeStatus, MalListEntry } from '~/composables/useMalApi'

const { user } = useAuth()
const { fetchFullList, counts } = useUserAnimeList()
const { getUserAnimeList } = useMalApi()
const route = useRoute()

// ── State ───────────────────────────────────────────────────

const activeTab = ref<MalAnimeStatus | 'all'>('all')
const entries = ref<MalListEntry[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const hasNextPage = ref(false)
const nextOffset = ref(0)
const sortBy = ref<string>('list_updated_at')
const searchQuery = ref('')
const totalCount = ref(0)
const cardRefs = ref<Record<number, any>>({})

const LIMIT = 50

const tabs = computed(() => [
  { key: 'all' as const, label: 'All', count: counts.value.total },
  { key: 'watching' as MalAnimeStatus, label: 'Watching', count: counts.value.watching },
  { key: 'completed' as MalAnimeStatus, label: 'Completed', count: counts.value.completed },
  { key: 'on_hold' as MalAnimeStatus, label: 'On Hold', count: counts.value.on_hold },
  { key: 'dropped' as MalAnimeStatus, label: 'Dropped', count: counts.value.dropped },
  { key: 'plan_to_watch' as MalAnimeStatus, label: 'Plan to Watch', count: counts.value.plan_to_watch },
])

// ── Stats from cached list ──────────────────────────────────

const stats = computed(() => counts.value)

const meanScore = computed(() => {
  const all = Object.values(useUserAnimeList().cache.value)
  const scores = all.map(e => e.list_status.score).filter(s => s > 0)
  if (scores.length === 0) return '—'
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
})

const totalDays = computed(() => {
  // Rough estimate: 24 min per episode, default to showing count
  const all = Object.values(useUserAnimeList().cache.value)
  const totalEps = all.reduce((sum, e) => sum + (e.list_status.num_episodes_watched || 0), 0)
  const days = Math.round(totalEps * 24 / 60 / 24)
  return days > 0 ? `${days}d` : '—'
})

// ── Client-side filtering by search (uses full cached list) ─

const filteredEntries = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()

  // If searching, use the full cached list (ignores pagination)
  if (q) {
    const cache = useUserAnimeList().cache.value
    let all = Object.values(cache)
    // Apply status filter
    if (activeTab.value !== 'all') {
      all = all.filter(e => e.list_status.status === activeTab.value)
    }
    // Apply search
    return all.filter(e => e.node.title.toLowerCase().includes(q))
  }

  // No search: use paginated results
  return entries.value
})

// ── Tab switching ───────────────────────────────────────────

async function switchTab(tab: MalAnimeStatus | 'all') {
  activeTab.value = tab
  entries.value = []
  nextOffset.value = 0
  hasNextPage.value = false
  await fetchEntries(true)
}

// ── Fetch entries ───────────────────────────────────────────

async function fetchEntries(reset = false) {
  if (reset) loading.value = true
  else loadingMore.value = true

  try {
    const params: any = {
      sort: sortBy.value,
      limit: LIMIT,
      offset: reset ? 0 : nextOffset.value,
    }

    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }

    const response = await getUserAnimeList(params)
    const newEntries = response.data || []

    if (reset) {
      entries.value = newEntries
    } else {
      entries.value = [...entries.value, ...newEntries]
    }

    hasNextPage.value = !!response.paging?.next
    nextOffset.value = reset ? LIMIT : nextOffset.value + LIMIT
    totalCount.value = entries.value.length
  } catch (err: any) {
    console.error('[MyList] Failed to fetch:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// ── Reload (for sort changes) ──────────────────────────────

async function reloadList() {
  entries.value = []
  nextOffset.value = 0
  hasNextPage.value = false
  await fetchEntries(true)
}

// ── Load more ───────────────────────────────────────────────

async function loadMore() {
  await fetchEntries(false)
}

// ── On entry updated ───────────────────────────────────────

function onEntryUpdated() {
  // Re-fetch counts from cache
  // We could also re-fetch the specific page, but cache is enough
}

// ── Init ────────────────────────────────────────────────────

onMounted(async () => {
  // Ensure cache is loaded
  await fetchFullList()
  await fetchEntries(true)
})

useHead({
  title: 'My List — Anime Frame',
})
</script>

<style scoped>
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.3s ease;
}
.list-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.list-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
