<template>
  <aside class="space-y-5">
    <!-- Genres -->
    <section v-if="anime.genres?.length">
      <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">Genres</h3>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="g in anime.genres"
          :key="g.mal_id"
          class="badge badge-primary badge-outline text-xs font-medium"
        >{{ g.name }}</span>
      </div>
    </section>

    <!-- Themes -->
    <section v-if="anime.themes?.length">
      <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">Themes</h3>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="t in anime.themes"
          :key="t.mal_id"
          class="badge badge-secondary badge-outline text-xs"
        >{{ t.name }}</span>
      </div>
    </section>

    <!-- Demographics -->
    <section v-if="anime.demographics?.length">
      <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">Demographics</h3>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="d in anime.demographics"
          :key="d.mal_id"
          class="badge badge-accent badge-outline text-xs"
        >{{ d.name }}</span>
      </div>
    </section>

    <div class="divider my-1" />

    <!-- Info table -->
    <dl class="space-y-3 text-sm">
      <div v-if="anime.studios?.length">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Studios</dt>
        <dd class="space-y-0.5">
          <span v-for="(s, i) in anime.studios" :key="s.mal_id">
            <a :href="s.url" target="_blank" class="link link-primary text-sm">{{ s.name }}</a><span v-if="i < anime.studios.length - 1">, </span>
          </span>
        </dd>
      </div>

      <div v-if="anime.producers?.length">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Producers</dt>
        <dd class="text-base-content/70 leading-relaxed">
          <span v-for="(p, i) in anime.producers" :key="p.mal_id">
            {{ p.name }}<span v-if="i < anime.producers.length - 1">, </span>
          </span>
        </dd>
      </div>

      <div v-if="anime.licensors?.length">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Licensors</dt>
        <dd class="text-base-content/70 leading-relaxed">
          <span v-for="(l, i) in anime.licensors" :key="l.mal_id">
            {{ l.name }}<span v-if="i < anime.licensors.length - 1">, </span>
          </span>
        </dd>
      </div>

      <div v-if="anime.source">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Source</dt>
        <dd class="text-base-content/70">{{ anime.source }}</dd>
      </div>

      <div v-if="anime.aired?.string">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Aired</dt>
        <dd class="text-base-content/70">{{ anime.aired.string }}</dd>
      </div>

      <div v-if="anime.broadcast?.string">
        <dt class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-1">Broadcast</dt>
        <dd class="text-base-content/70">{{ anime.broadcast.string }}</dd>
      </div>


    </dl>

    <div class="divider my-1" />

    <!-- Streaming -->
    <section v-if="anime.streaming?.length">
      <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">Streaming</h3>
      <div class="flex flex-col gap-1.5">
        <a
          v-for="s in anime.streaming"
          :key="s.name"
          :href="s.url"
          target="_blank"
          class="btn btn-xs btn-outline justify-start gap-2 normal-case"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {{ s.name }}
        </a>
      </div>
    </section>

    <!-- External links -->
    <section v-if="anime.external?.length">
      <h3 class="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-2">External Links</h3>
      <div class="flex flex-col gap-1.5">
        <a
          v-for="e in anime.external"
          :key="e.name"
          :href="e.url"
          target="_blank"
          class="link link-hover text-sm text-base-content/70 hover:text-primary flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {{ e.name }}
        </a>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { JikanAnimeFullDetail } from '~/composables/useJikanApi'

defineProps<{
  anime: JikanAnimeFullDetail
}>()

const formatNumber = (n: number) =>
  new Intl.NumberFormat().format(n)
</script>
