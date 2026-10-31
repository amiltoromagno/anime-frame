<template>
  <div>
    <!-- Hero Section -->
    <HeroSection :anime-list="heroAnime" />

    <!-- Anime Rows -->
    <AnimeRow
      title="Top Airing"
      :anime-list="topAiring"
      :loading="loadingAiring"
      :list-status-map="listStatusMap"
      view-all-link="/browse?preset=airing"
    />

    <AnimeRow
      title="Most Popular"
      :anime-list="mostPopular"
      :loading="loadingPopular"
      :list-status-map="listStatusMap"
      view-all-link="/browse?preset=bypopularity"
    />

    <AnimeRow
      title="Top Upcoming"
      :anime-list="topUpcoming"
      :loading="loadingUpcoming"
      :list-status-map="listStatusMap"
      view-all-link="/browse?preset=upcoming"
    />

    <AnimeRow
      title="Currently Airing This Season"
      :anime-list="seasonNow"
      :loading="loadingSeason"
      :list-status-map="listStatusMap"
      view-all-link="/seasonal"
    />
  </div>
</template>

<script setup lang="ts">
import type { AnimeNode } from '~/utils/anime'

useHead({
  title: 'Anime Frame — Your Modern Anime Tracker',
})

const { getRanking, getSeason } = useCatalogApi()
const { isAuthenticated, getStatus } = useUserAnimeList()

// Data refs
const heroAnime = ref<AnimeNode[]>([])
const topAiring = ref<AnimeNode[]>([])
const mostPopular = ref<AnimeNode[]>([])
const topUpcoming = ref<AnimeNode[]>([])
const seasonNow = ref<AnimeNode[]>([])

// Loading states
const loadingAiring = ref(true)
const loadingPopular = ref(true)
const loadingUpcoming = ref(true)
const loadingSeason = ref(true)

// Computed list status map for all loaded anime
const listStatusMap = computed<Record<number, import('~/composables/useMalApi').MalAnimeStatus>>(() => {
  if (!isAuthenticated.value) return {}
  const allAnime = [...topAiring.value, ...mostPopular.value, ...topUpcoming.value, ...seasonNow.value]
  const map: Record<number, import('~/composables/useMalApi').MalAnimeStatus> = {}
  for (const anime of allAnime) {
    const status = getStatus(anime.id)
    if (status) {
      map[anime.id] = status.status
    }
  }
  return map
})

// All sections load in parallel — MAL has no documented per-second throttle,
// and requests are deduplicated/cached by the catalog client and server proxy.
onMounted(async () => {
  const season = getCurrentSeason()

  const [hero, airing, popular, upcoming, currentSeason] = await Promise.allSettled([
    getRanking('all', 5),
    getRanking('airing', 15),
    getRanking('bypopularity', 15),
    getRanking('upcoming', 15),
    getSeason(season.year, season.season, 15),
  ])

  heroAnime.value = hero.status === 'fulfilled' ? hero.value.data : []
  topAiring.value = airing.status === 'fulfilled' ? airing.value.data : []
  mostPopular.value = popular.status === 'fulfilled' ? popular.value.data : []
  topUpcoming.value = upcoming.status === 'fulfilled' ? upcoming.value.data : []
  seasonNow.value = currentSeason.status === 'fulfilled' ? currentSeason.value.data : []

  loadingAiring.value = false
  loadingPopular.value = false
  loadingUpcoming.value = false
  loadingSeason.value = false

  for (const result of [hero, airing, popular, upcoming, currentSeason]) {
    if (result.status === 'rejected') {
      console.error('[Home] Failed to load a section:', result.reason)
    }
  }
})
</script>
