<template>
  <div class="relative w-full">
    <!-- Blurred banner background -->
    <div class="absolute inset-0 h-72 overflow-hidden">
      <img
        :src="anime.images?.jpg?.large_image_url"
        :alt="displayTitle(anime)"
        class="w-full h-full object-cover scale-110 blur-sm opacity-40"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-base-100/20 via-base-100/60 to-base-100" />
    </div>

    <!-- Content -->
    <div class="relative max-w-7xl mx-auto px-6 pt-8 pb-0">
      <div class="flex flex-col md:flex-row gap-6 items-center">
        <!-- Poster -->
        <div class="shrink-0 -mb-0 md:-mb-16 z-10">
          <div class="w-36 md:w-44 rounded-xl overflow-hidden shadow-2xl border border-base-content/10">
            <img
              :src="anime.images?.jpg?.large_image_url"
              :alt="displayTitle(anime)"
              class="w-full aspect-[3/4] object-cover"
            />
          </div>
        </div>

        <!-- Title & meta -->
        <div class="flex-1 min-w-0 text-center md:text-left">
          <!-- Score + rank row -->
          <div class="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
            <!-- MAL stats group -->
            <div
              v-if="anime.score || anime.rank || anime.popularity"
              class="flex items-stretch rounded-lg overflow-hidden border border-base-content/10 text-sm"
            >
              <!-- Score -->
              <div v-if="anime.score" class="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 font-bold text-base">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {{ anime.score.toFixed(2) }}
              </div>
              <div v-if="anime.rank" class="flex flex-col items-center justify-center px-3 py-1.5 border-l border-base-content/10">
                <span class="font-bold leading-none">#{{ anime.rank }}</span>
                <span class="text-[10px] text-base-content/50 uppercase tracking-wide mt-0.5">Rank</span>
              </div>
              <div v-if="anime.popularity" class="flex flex-col items-center justify-center px-3 py-1.5 border-l border-base-content/10">
                <span class="font-bold leading-none">#{{ anime.popularity }}</span>
                <span class="text-[10px] text-base-content/50 uppercase tracking-wide mt-0.5">Pop.</span>
              </div>
              <!-- MAL attribution pill -->
              <a
                :href="`https://myanimelist.net/anime/${anime.mal_id}`"
                target="_blank"
                class="flex items-center px-2 bg-base-content/5 border-l border-base-content/10 hover:bg-base-content/10 transition-colors"
                title="View on MyAnimeList"
              >
                <span class="text-[10px] font-bold tracking-widest text-base-content/40 uppercase">MAL</span>
              </a>
            </div>

            <span
              class="badge font-medium"
              :class="statusClass"
            >{{ anime.status }}</span>
          </div>

          <!-- Title -->
          <h1 class="text-2xl md:text-3xl font-bold leading-tight text-base-content break-words">
            {{ displayTitle(anime) }}
          </h1>
          <p v-if="oppositeTitle" class="text-base text-base-content/50 mt-0.5">
            {{ anime.title_japanese }}
          </p>
          <p v-if="oppositeTitle" class="text-sm text-base-content/40 mt-0.5">
            {{ oppositeTitle }}
          </p>

          <!-- Meta pills -->
          <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-3 text-sm text-base-content/70">
            <span v-if="anime.type" class="inline-flex items-center gap-1"><span class="font-semibold text-base-content">{{ anime.type }}</span></span>
            <span v-if="anime.type && anime.episodes" class="opacity-40">·</span>
            <span v-if="anime.episodes">{{ anime.episodes }} eps</span>
            <span v-if="anime.duration" class="opacity-40">·</span>
            <span v-if="anime.duration">{{ anime.duration }}</span>
            <span v-if="seasonYear" class="opacity-40">·</span>
            <span v-if="seasonYear" class="capitalize">{{ seasonYear }}</span>
            <span v-if="anime.rating" class="opacity-40">·</span>
            <span v-if="anime.rating" class="text-xs bg-base-300 rounded px-1.5 py-0.5 font-mono">{{ anime.rating }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JikanAnimeFullDetail } from '~/composables/useJikanApi'

const props = defineProps<{
  anime: JikanAnimeFullDetail
}>()

const { titlePref, displayTitle } = useTitlePreference()

// Show the other title as a subtitle when it differs
const oppositeTitle = computed(() => {
  if (titlePref.value === 'english') {
    // Showing English — show romaji as subtitle if it's different
    return props.anime.title !== props.anime.title_english ? props.anime.title : null
  } else {
    // Showing Romaji — show English as subtitle if it exists
    return props.anime.title_english || null
  }
})

const seasonYear = computed(() => {
  const s = props.anime.season
  const y = props.anime.year
  if (s && y) return `${s} ${y}`
  if (y) return String(y)
  return null
})

const statusClass = computed(() => {
  switch (props.anime.status) {
    case 'Currently Airing': return 'badge-success'
    case 'Not yet aired': return 'badge-info'
    default: return 'badge-ghost'
  }
})
</script>
