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
      view-all-link="/browse?filter=airing"
    />

    <AnimeRow
      title="Most Popular"
      :anime-list="mostPopular"
      :loading="loadingPopular"
      :list-status-map="listStatusMap"
      view-all-link="/browse?filter=bypopularity"
    />

    <AnimeRow
      title="Top Upcoming"
      :anime-list="topUpcoming"
      :loading="loadingUpcoming"
      :list-status-map="listStatusMap"
      view-all-link="/browse?filter=upcoming"
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
import type { JikanAnime } from '~/composables/useJikanApi'

useHead({
  title: 'Anime Frame — Your Modern Anime Tracker',
})

const { getTopAnime, getSeasonNow } = useJikanApi()
const { isAuthenticated, getStatus } = useUserAnimeList()

// Data refs
const heroAnime = ref<JikanAnime[]>([])
const topAiring = ref<JikanAnime[]>([])
const mostPopular = ref<JikanAnime[]>([])
const topUpcoming = ref<JikanAnime[]>([])
const seasonNow = ref<JikanAnime[]>([])

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
    const status = getStatus(anime.mal_id)
    if (status) {
      map[anime.mal_id] = status.status
    }
  }
  return map
})

// Fetch data sequentially to respect Jikan rate limits
onMounted(async () => {
  try {
    // Fetch top anime for hero (first 5)
    const topData = await getTopAnime(undefined, 5)
    heroAnime.value = topData

    // Top airing
    topAiring.value = await getTopAnime('airing', 15)
    loadingAiring.value = false

    // Most popular
    mostPopular.value = await getTopAnime('bypopularity', 15)
    loadingPopular.value = false

    // Top upcoming
    topUpcoming.value = await getTopAnime('upcoming', 15)
    loadingUpcoming.value = false

    // Season now
    seasonNow.value = await getSeasonNow(15)
    loadingSeason.value = false
  } catch (error) {
    console.error('Failed to fetch anime data:', error)
    loadingAiring.value = false
    loadingPopular.value = false
    loadingUpcoming.value = false
    loadingSeason.value = false
  }
})
</script>
