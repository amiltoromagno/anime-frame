<template>
  <div class="min-h-screen bg-base-100">

    <!-- ── Error State ─────────────────────────────────────────────────── -->
    <div v-if="error" class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div class="text-6xl">😵</div>
      <h1 class="text-2xl font-bold">Anime not found</h1>
      <p class="text-base-content/60 max-w-sm">{{ error }}</p>
      <NuxtLink to="/" class="btn btn-primary btn-sm rounded-full">← Back to Home</NuxtLink>
    </div>

    <!-- ── Loading Skeleton ────────────────────────────────────────────── -->
    <template v-else-if="loading">
      <!-- Banner skeleton -->
      <div class="relative h-72 bg-base-200 animate-pulse overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-base-100" />
        <div class="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-4 flex gap-6 items-end">
          <div class="w-36 md:w-44 h-52 md:h-64 rounded-xl bg-base-300 shrink-0 -mb-12 md:-mb-16" />
          <div class="flex-1 pb-4 space-y-3">
            <div class="h-5 bg-base-300 rounded-full w-32" />
            <div class="h-8 bg-base-300 rounded-full w-3/4" />
            <div class="h-4 bg-base-300 rounded-full w-1/4" />
            <div class="flex gap-2">
              <div class="h-4 bg-base-300 rounded-full w-16" />
              <div class="h-4 bg-base-300 rounded-full w-16" />
              <div class="h-4 bg-base-300 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>

      <!-- Body skeleton -->
      <div class="max-w-7xl mx-auto px-6 pt-20 md:pt-24">
        <div class="flex flex-col md:flex-row gap-8">
          <!-- Sidebar skeleton -->
          <div class="w-full md:w-48 space-y-3 shrink-0">
            <div class="h-4 bg-base-200 rounded animate-pulse w-20" />
            <div class="flex flex-wrap gap-1.5">
              <div v-for="i in 5" :key="i" class="h-5 w-16 bg-base-200 rounded-full animate-pulse" />
            </div>
            <div class="h-px bg-base-200 my-2" />
            <div v-for="i in 5" :key="i" class="space-y-1">
              <div class="h-3 bg-base-200 rounded animate-pulse w-16" />
              <div class="h-4 bg-base-200 rounded animate-pulse w-32" />
            </div>
          </div>

          <!-- Main skeleton -->
          <div class="flex-1 space-y-4">
            <div class="h-4 bg-base-200 rounded animate-pulse w-24" />
            <div class="space-y-2">
              <div v-for="i in 6" :key="i" class="h-4 bg-base-200 rounded animate-pulse" :class="i === 6 ? 'w-2/3' : 'w-full'" />
            </div>
            <div class="h-52 bg-base-200 rounded-xl animate-pulse mt-6" />
          </div>
        </div>
      </div>
    </template>

    <!-- ── Content ─────────────────────────────────────────────────────── -->
    <template v-else-if="anime">

      <!-- Header (banner + title) -->
      <AnimeDetailHeader :anime="anime" />

      <!-- Page body -->
      <div class="max-w-7xl mx-auto px-6 pt-16 md:pt-20 pb-16">
        <div class="flex flex-col md:flex-row gap-6">

          <!-- Sidebar (sticky, left col) -->
          <aside class="w-full md:w-44 shrink-0 space-y-4">
            <div class="md:sticky md:top-6 space-y-4">
              <!-- List Management -->
              <AnimeListManager
                :anime-id="id"
                :total-episodes="totalEpisodes"
              />
              <AnimeDetailSidebar :anime="anime" />
            </div>
          </aside>

          <!-- Main content (right col) -->
          <main class="flex-1 min-w-0 space-y-10">
            <AnimeDetailInfo :anime="anime" />

            <!-- Recommendations (included in the detail request) -->
            <AnimeDetailRecommendations
              v-if="anime.recommendations?.length"
              :recommendations="anime.recommendations"
            />
          </main>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import type { AnimeNode } from '~/utils/anime'

const route = useRoute()
const id = Number(route.params.id)

const { getAnime } = useCatalogApi()

const anime = ref<AnimeNode | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const totalEpisodes = computed(() =>
  anime.value?.num_episodes && anime.value.num_episodes > 0
    ? anime.value.num_episodes
    : null,
)

onMounted(async () => {
  if (!id || Number.isNaN(id)) {
    error.value = 'Invalid anime ID.'
    loading.value = false
    return
  }

  try {
    anime.value = await getAnime(id)
  } catch (err: any) {
    if (err.message?.includes('(404)')) {
      error.value = 'This anime could not be found. It may not exist or the ID is incorrect.'
    } else {
      error.value = err.message || 'Something went wrong while fetching data.'
    }
  } finally {
    loading.value = false
  }
})

// Set page title dynamically
useHead(computed(() => ({
  title: anime.value
    ? `${anime.value.alternative_titles?.en?.trim() || anime.value.title} — Anime Frame`
    : 'Loading… — Anime Frame',
})))
</script>
