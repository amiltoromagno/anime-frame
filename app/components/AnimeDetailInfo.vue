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
    <section v-if="relationGroups.length">
      <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-3">Related</h2>
      <div class="space-y-2">
        <div
          v-for="group in relationGroups"
          :key="group.label"
          class="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1"
        >
          <span class="text-xs font-bold text-base-content/50 uppercase tracking-wide">{{ group.label }}</span>
          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="relation in group.entries"
              :key="relation.node.id"
              :to="`/anime/${relation.node.id}`"
              class="text-sm link link-primary"
            >{{ relation.node.title }}</NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AnimeNode, AnimeRelation } from '~/utils/anime'

const props = defineProps<{
  anime: AnimeNode
}>()

const synopsisExpanded = ref(false)

// MAL returns a flat `related_anime` list; group it by relation type for display.
const relationGroups = computed(() => {
  const groups = new Map<string, AnimeRelation[]>()

  for (const relation of props.anime.related_anime ?? []) {
    const label = relation.relation_type_formatted
      || capitalize(relation.relation_type.replace(/_/g, ' '))
    const entries = groups.get(label) ?? []
    entries.push(relation)
    groups.set(label, entries)
  }

  return [...groups.entries()].map(([label, entries]) => ({ label, entries }))
})
</script>
