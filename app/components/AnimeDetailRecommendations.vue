<template>
  <section>
    <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-4">Recommendations</h2>

    <div class="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
      <NuxtLink
        v-for="rec in recommendations.slice(0, 16)"
        :key="rec.entry.mal_id"
        :to="`/anime/${rec.entry.mal_id}`"
        class="group shrink-0 w-36 snap-start"
      >
        <div class="relative rounded-xl overflow-hidden aspect-[3/4] bg-base-300 mb-2">
          <img
            :src="rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url"
            :alt="rec.entry.title"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <!-- Vote badge -->
          <div class="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {{ rec.votes }}
          </div>
          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p class="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {{ rec.entry.title }}
        </p>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { JikanRecommendation } from '~/composables/useJikanApi'

defineProps<{
  recommendations: JikanRecommendation[]
}>()
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}
</style>
