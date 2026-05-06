<template>
  <section class="py-8">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Section header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <span v-if="icon" class="text-2xl">{{ icon }}</span>
          {{ title }}
        </h2>
        <NuxtLink
          v-if="viewAllLink"
          :to="viewAllLink"
          class="btn btn-ghost btn-sm text-primary"
        >
          View All
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>

      <!-- Scrollable row -->
      <div class="relative group/row">
        <!-- Scroll left button -->
        <button
          v-if="canScrollLeft"
          @click="scrollLeft"
          class="absolute left-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm bg-base-100/80 backdrop-blur shadow-lg opacity-0 group-hover/row:opacity-100 transition-opacity -translate-x-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <!-- Cards container -->
        <div
          ref="scrollContainer"
          class="flex gap-4 overflow-x-auto scroll-container pb-2"
          @scroll="updateScrollState"
        >
          <!-- Loading skeletons -->
          <template v-if="loading">
            <div
              v-for="i in 8"
              :key="'skeleton-' + i"
              class="flex-shrink-0 w-44 lg:w-52 animate-pulse"
            >
              <div class="rounded-xl bg-base-200 overflow-hidden">
                <div class="aspect-[3/4] bg-base-300/70" />
                <div class="p-3 space-y-2">
                  <div class="h-4 w-4/5 rounded-full bg-base-300/70" />
                  <div class="h-3 w-3/5 rounded-full bg-base-300/50" />
                </div>
              </div>
            </div>
          </template>

          <!-- Anime cards -->
          <template v-else>
            <div
              v-for="anime in animeList"
              :key="anime.mal_id"
              class="flex-shrink-0 w-44 lg:w-52"
            >
              <AnimeCard :anime="anime" :list-status="getListStatus(anime.mal_id)" />
            </div>
          </template>
        </div>

        <!-- Scroll right button -->
        <button
          v-if="canScrollRight"
          @click="scrollRight"
          class="absolute right-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm bg-base-100/80 backdrop-blur shadow-lg opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { JikanAnime } from '~/composables/useJikanApi'
import type { MalAnimeStatus } from '~/composables/useMalApi'

const props = defineProps<{
  title: string
  icon?: string
  viewAllLink?: string
  animeList: JikanAnime[]
  loading?: boolean
  listStatusMap?: Record<number, MalAnimeStatus>
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

function getListStatus(id: number): MalAnimeStatus | null {
  return props.listStatusMap?.[id] ?? null
}

const updateScrollState = () => {
  const el = scrollContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 10
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

const scrollLeft = () => {
  scrollContainer.value?.scrollBy({ left: -600, behavior: 'smooth' })
}

const scrollRight = () => {
  scrollContainer.value?.scrollBy({ left: 600, behavior: 'smooth' })
}

onMounted(() => {
  nextTick(() => updateScrollState())
})
</script>
