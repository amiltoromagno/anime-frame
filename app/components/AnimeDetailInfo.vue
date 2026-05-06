<template>
  <div class="space-y-6">
    <!-- Synopsis -->
    <section v-if="anime.synopsis">
      <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-3">Synopsis</h2>
      <div class="relative">
        <p
          class="text-sm text-base-content/80 leading-relaxed whitespace-pre-line"
          :class="{ 'line-clamp-5': !synopsisExpanded }"
        >{{ anime.synopsis }}</p>
        <button
          v-if="!synopsisExpanded"
          class="mt-2 text-primary text-sm font-semibold hover:underline"
          @click="synopsisExpanded = true"
        >Read more</button>
        <button
          v-else
          class="mt-2 text-primary text-sm font-semibold hover:underline"
          @click="synopsisExpanded = false"
        >Show less</button>
      </div>
    </section>

    <!-- Background -->
    <section v-if="anime.background">
      <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-3">Background</h2>
      <p class="text-base-content/70 leading-relaxed text-sm">{{ anime.background }}</p>
    </section>


    <!-- Related anime -->
    <section v-if="anime.relations?.length">
      <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-3">Related</h2>
      <div class="space-y-2">
        <div
          v-for="rel in anime.relations"
          :key="rel.relation"
          class="flex flex-wrap gap-x-4 gap-y-1 items-baseline"
        >
          <span class="text-xs font-bold text-base-content/50 uppercase tracking-wide w-28 shrink-0">{{ rel.relation }}</span>
          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="entry in rel.entry"
              :key="entry.mal_id"
              :to="entry.type === 'anime' ? `/anime/${entry.mal_id}` : '#'"
              class="text-sm link link-primary"
            >{{ entry.name }}</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Opening themes -->
    <section v-if="anime.theme?.openings?.length">
      <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-3">Opening Themes</h2>
      <ol class="space-y-1 list-decimal list-inside">
        <li
          v-for="(op, i) in anime.theme.openings"
          :key="i"
          class="text-sm text-base-content/70"
        >{{ op }}</li>
      </ol>
    </section>

    <!-- Ending themes -->
    <section v-if="anime.theme?.endings?.length">
      <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-3">Ending Themes</h2>
      <ol class="space-y-1 list-decimal list-inside">
        <li
          v-for="(ed, i) in anime.theme.endings"
          :key="i"
          class="text-sm text-base-content/70"
        >{{ ed }}</li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { JikanAnimeFullDetail } from '~/composables/useJikanApi'

const props = defineProps<{
  anime: JikanAnimeFullDetail
}>()

const synopsisExpanded = ref(false)

</script>
