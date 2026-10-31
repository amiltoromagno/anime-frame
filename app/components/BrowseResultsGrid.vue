<template>
  <div class="space-y-8">
    
    <!-- Active Filters Badges / Count -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="text-sm text-base-content/60">
        <span v-if="loading && results.length === 0" class="animate-pulse">Loading...</span>
        <span v-else-if="results.length > 0">Showing results</span>
        <span v-else>No results found</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && results.length === 0" class="py-24 text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-bold mb-2">No anime found</h3>
      <p class="text-base-content/60 max-w-sm mx-auto">Try a different search term, or pick another ranking.</p>
    </div>

    <!-- Results Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <AnimeCard
        v-for="anime in results"
        :key="anime.id"
        :anime="anime"
        :list-status="getListStatus(anime.id)"
      />
      
      <!-- Skeletons (tail end) -->
      <template v-if="loading">
        <div v-for="i in 12" :key="`skel-${i}`" class="rounded-xl overflow-hidden aspect-[3/4] bg-base-200 border border-base-content/5 animate-pulse relative">
          <div class="absolute bottom-0 left-0 right-0 h-16 bg-base-300" />
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div v-if="hasNextPage" class="flex justify-center pt-8 pb-12">
      <button 
        class="btn btn-outline btn-wide rounded-full font-bold"
        :class="{ 'loading': loading }"
        :disabled="loading"
        @click="$emit('load-more')"
      >
        {{ loading ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnimeNode } from '~/utils/anime'
import type { MalAnimeStatus } from '~/composables/useMalApi'

const props = defineProps<{
  results: AnimeNode[]
  loading: boolean
  hasNextPage: boolean
  listStatusMap?: Record<number, MalAnimeStatus>
}>()

defineEmits<{
  (e: 'load-more'): void
}>()

function getListStatus(id: number): MalAnimeStatus | null {
  return props.listStatusMap?.[id] ?? null
}
</script>
