<template>
  <aside class="space-y-5">
    <!-- Genres (MAL flattens genres, themes and demographics into one list) -->
    <section v-if="anime.genres?.length">
      <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">Genres</h3>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="g in anime.genres"
          :key="g.id"
          class="badge badge-primary badge-outline text-xs font-medium"
        >{{ g.name }}</span>
      </div>
    </section>

    <div class="divider my-1" />

    <!-- Info table -->
    <dl class="space-y-3 text-sm">
      <div v-if="anime.studios?.length">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Studios</dt>
        <dd class="space-y-0.5">
          <span v-for="(studio, i) in anime.studios" :key="studio.id">
            <a
              :href="`https://myanimelist.net/anime/producer/${studio.id}`"
              target="_blank"
              class="link link-primary text-sm"
            >{{ studio.name }}</a><span v-if="i < anime.studios.length - 1">, </span>
          </span>
        </dd>
      </div>

      <div v-if="anime.source">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Source</dt>
        <dd class="text-base-content/70 capitalize">{{ anime.source.replace(/_/g, ' ') }}</dd>
      </div>

      <div v-if="anime.start_date || anime.end_date">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Aired</dt>
        <dd class="text-base-content/70">{{ airedLabel }}</dd>
      </div>

      <div v-if="broadcastLabel(anime.broadcast)">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Broadcast</dt>
        <dd class="text-base-content/70">{{ broadcastLabel(anime.broadcast) }}</dd>
      </div>
    </dl>

    <!-- Member statistics (only returned by the single-anime endpoint) -->
    <template v-if="anime.statistics">
      <div class="divider my-1" />
      <section>
        <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">Member Stats</h3>
        <dl class="space-y-1 text-xs">
          <div
            v-for="row in statRows"
            :key="row.label"
            class="flex items-center justify-between gap-2"
          >
            <dt class="text-base-content/50">{{ row.label }}</dt>
            <dd class="font-semibold tabular-nums">{{ formatCount(row.value) }}</dd>
          </div>
        </dl>
      </section>
    </template>
  </aside>
</template>

<script setup lang="ts">
import type { AnimeNode } from '~/utils/anime'

const props = defineProps<{
  anime: AnimeNode
}>()

const airedLabel = computed(() => {
  const start = formatPartialDate(props.anime.start_date)
  const end = formatPartialDate(props.anime.end_date)
  if (start && end) return `${start} – ${end}`
  return start || end || '—'
})

const statRows = computed(() => {
  const stats = props.anime.statistics
  if (!stats) return []

  return [
    { label: 'Watching', value: stats.status.watching },
    { label: 'Completed', value: stats.status.completed },
    { label: 'On Hold', value: stats.status.on_hold },
    { label: 'Dropped', value: stats.status.dropped },
    { label: 'Plan to Watch', value: stats.status.plan_to_watch },
    { label: 'Total Members', value: stats.num_list_users },
  ]
})
</script>
