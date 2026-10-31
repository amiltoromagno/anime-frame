<template>
  <section class="max-w-7xl mx-auto px-6 pt-8 pb-4">
    <!-- Section label -->
    <div class="flex items-center gap-2 mb-5">
      <span class="text-sm font-semibold uppercase tracking-wider text-primary">Featured</span>
      <div class="h-px flex-1 bg-base-content/10" />
      <!-- Navigation arrows -->
      <div v-if="animeList.length > 1" class="flex items-center gap-1">
        <button
          @click="prev"
          class="btn btn-ghost btn-xs btn-circle"
          aria-label="Previous"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="text-xs tabular-nums opacity-50 min-w-[3ch] text-center">
          {{ currentIndex + 1 }}/{{ animeList.length }}
        </span>
        <button
          @click="next"
          class="btn btn-ghost btn-xs btn-circle"
          aria-label="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>

    <!-- Spotlight card -->
    <div
      v-if="currentAnime"
      class="rounded-2xl overflow-hidden bg-base-200 border border-base-content/5 grid"
    >
      <Transition name="fade">
        <div :key="currentAnime.id" class="col-start-1 row-start-1 flex flex-col md:flex-row md:h-72 w-full">
        <!-- Cover image -->
        <div class="relative md:w-48 flex-shrink-0 bg-base-300">
          <img
            :src="currentAnime.main_picture?.large || currentAnime.main_picture?.medium"
            :alt="displayTitle(currentAnime)"
            class="w-full h-48 md:h-72 object-cover"
            loading="lazy"
          />
          <!-- Score overlay on image -->
          <div
            v-if="currentAnime.mean"
            class="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-warning" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span class="text-white font-bold text-sm">{{ currentAnime.mean.toFixed(1) }}</span>
            <span class="text-white/50 text-xs">/ 10</span>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 p-5 lg:p-6 flex flex-col justify-between overflow-hidden">
          <div>
            <!-- Meta row -->
            <div class="flex flex-wrap items-center gap-2 mb-2 text-xs">
              <span v-if="currentAnime.rank" class="text-primary font-bold">#{{ currentAnime.rank }} Ranked</span>
              <span v-if="currentAnime.rank" class="opacity-30">·</span>
              <span v-if="currentAnime.media_type" class="opacity-60">{{ mediaTypeLabel(currentAnime.media_type) }}</span>
              <span v-if="currentAnime.num_episodes" class="opacity-30">·</span>
              <span v-if="currentAnime.num_episodes" class="opacity-60">{{ currentAnime.num_episodes }} eps</span>
              <span v-if="currentAnime.status" class="opacity-30">·</span>
              <span v-if="currentAnime.status" class="opacity-60">{{ airingStatusLabel(currentAnime.status) }}</span>
            </div>

            <!-- Title -->
            <h2 class="text-xl lg:text-2xl font-bold leading-snug mb-2">
              {{ displayTitle(currentAnime) }}
            </h2>

            <!-- Genres -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span
                v-for="genre in currentAnime.genres?.slice(0, 4)"
                :key="genre.id"
                class="badge badge-sm badge-outline opacity-70"
              >
                {{ genre.name }}
              </span>
            </div>

            <!-- Synopsis -->
            <p class="text-sm text-base-content/60 leading-relaxed line-clamp-2 lg:line-clamp-3">
              {{ currentAnime.synopsis }}
            </p>
          </div>

          <!-- Bottom row -->
          <div class="flex items-center justify-between mt-4 pt-3 border-t border-base-content/5">
            <div class="flex items-center gap-4 text-xs opacity-50">
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                {{ formatCount(currentAnime.num_list_users) }}
              </span>
              <span v-if="currentAnime.start_season">{{ seasonLabel(currentAnime.start_season) }}</span>
              <span v-if="currentAnime.studios?.length">{{ currentAnime.studios[0]?.name }}</span>
            </div>
            <NuxtLink
              :to="`/anime/${currentAnime.id}`"
              class="btn btn-primary btn-sm"
            >
              Details
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </NuxtLink>
          </div>
        </div>
        </div>
      </Transition>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else
      class="rounded-2xl overflow-hidden bg-base-200 border border-base-content/5"
    >
      <div class="flex flex-col md:flex-row animate-pulse">
        <div class="md:w-48 flex-shrink-0 h-48 md:h-auto bg-base-300/60" />
        <div class="flex-1 p-5 lg:p-6 space-y-4 min-h-[200px]">
          <div class="flex gap-2">
            <div class="h-4 w-20 rounded-full bg-base-300/50" />
            <div class="h-4 w-12 rounded-full bg-base-300/30" />
            <div class="h-4 w-16 rounded-full bg-base-300/30" />
          </div>
          <div class="h-7 w-[70%] rounded-lg bg-base-300/60" />
          <div class="flex gap-2">
            <div class="h-5 w-16 rounded-full bg-base-300/40" />
            <div class="h-5 w-20 rounded-full bg-base-300/40" />
            <div class="h-5 w-14 rounded-full bg-base-300/40" />
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-full rounded-full bg-base-300/30" />
            <div class="h-3.5 w-[85%] rounded-full bg-base-300/30" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AnimeNode } from '~/utils/anime'

const { displayTitle } = useTitlePreference()

const props = defineProps<{
  animeList: AnimeNode[]
}>()

const currentIndex = ref(0)
const currentAnime = computed(() => props.animeList[currentIndex.value] || null)

const next = () => {
  if (props.animeList.length > 1) {
    currentIndex.value = (currentIndex.value + 1) % props.animeList.length
  }
}

const prev = () => {
  if (props.animeList.length > 1) {
    currentIndex.value = (currentIndex.value - 1 + props.animeList.length) % props.animeList.length
  }
}

// Auto-rotate
let interval: ReturnType<typeof setInterval>

onMounted(() => {
  interval = setInterval(next, 10000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
