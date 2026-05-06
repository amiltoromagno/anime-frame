<template>
  <NuxtLink
    :to="`/anime/${anime.mal_id}`"
    class="group block relative overflow-hidden rounded-xl bg-base-200 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
  >
    <!-- Image container -->
    <div class="relative aspect-[3/4] overflow-hidden">
      <img
        :src="anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url"
        :alt="displayTitle(anime)"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <!-- Score badge -->
      <div
        v-if="anime.score && !listStatus"
        class="absolute top-2 left-2 badge badge-sm font-bold gap-1"
        :class="scoreClass"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {{ anime.score.toFixed(1) }}
      </div>

      <!-- List status badge (overrides score position) -->
      <div
        v-if="listStatus"
        class="absolute top-2 left-2 z-10 badge badge-sm font-bold gap-1"
        :class="statusBadgeClass"
      >
        {{ statusLabel }}
      </div>
      <!-- Score below status when both present -->
      <div
        v-if="anime.score && listStatus"
        class="absolute top-9 left-2 badge badge-xs font-bold gap-0.5"
        :class="scoreClass"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {{ anime.score.toFixed(1) }}
      </div>

      <!-- Type badge -->
      <div
        v-if="anime.type"
        class="absolute top-2 right-2 badge badge-sm badge-neutral font-medium"
      >
        {{ anime.type }}
      </div>

      <!-- Hover info -->
      <div class="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="genre in anime.genres?.slice(0, 3)"
            :key="genre.mal_id"
            class="badge badge-xs badge-outline badge-primary"
          >
            {{ genre.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Title -->
    <div class="p-3">
      <h3 class="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
        {{ displayTitle(anime) }}
      </h3>
      <div class="flex items-center gap-2 mt-1 text-xs opacity-60">
        <span v-if="anime.episodes">{{ anime.episodes }} eps</span>
        <span v-if="anime.episodes && anime.season">·</span>
        <span v-if="anime.season" class="capitalize">{{ anime.season }} {{ anime.year }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { JikanAnime } from '~/composables/useJikanApi'
import type { MalAnimeStatus } from '~/composables/useMalApi'

const props = defineProps<{
  anime: JikanAnime
  listStatus?: MalAnimeStatus | null
}>()

const { displayTitle } = useTitlePreference()

const scoreClass = computed(() => {
  const score = props.anime.score
  if (!score) return 'badge-ghost'
  if (score >= 8) return 'badge-success text-success-content'
  if (score >= 6) return 'badge-warning text-warning-content'
  return 'badge-error text-error-content'
})

const statusBadgeClass = computed(() => {
  switch (props.listStatus) {
    case 'watching': return 'badge-success text-success-content'
    case 'completed': return 'badge-info text-info-content'
    case 'on_hold': return 'badge-warning text-warning-content'
    case 'dropped': return 'badge-error text-error-content'
    case 'plan_to_watch': return 'badge-ghost'
    default: return 'badge-ghost'
  }
})

const statusLabel = computed(() => {
  switch (props.listStatus) {
    case 'watching': return 'Watching'
    case 'completed': return 'Completed'
    case 'on_hold': return 'On Hold'
    case 'dropped': return 'Dropped'
    case 'plan_to_watch': return 'Planned'
    default: return ''
  }
})
</script>
