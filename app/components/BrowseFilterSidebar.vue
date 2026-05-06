<template>
  <div class="bg-base-200 rounded-xl p-5 border border-base-content/5 space-y-6">
    <!-- Header & Clear -->
    <div class="flex items-center justify-between">
      <h2 class="font-bold text-lg">Filters</h2>
      <button
        v-if="hasFilters"
        class="text-xs font-semibold text-error hover:underline"
        @click="clearFilters"
      >
        Clear All
      </button>
    </div>

    <!-- Search input -->
    <div class="form-control">
      <label class="label px-0 pt-0 pb-1.5"><span class="label-text font-semibold text-xs uppercase tracking-wider text-base-content/60">Search</span></label>
      <div class="relative">
        <input
          v-model="localFilters.q"
          type="text"
          placeholder="e.g. Naruto"
          class="input input-sm input-bordered w-full pr-8"
        />
        <svg v-if="localFilters.q" @click="localFilters.q = ''" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
    </div>

    <!-- Sort By -->
    <div class="form-control">
      <label class="label px-0 pt-0 pb-1.5"><span class="label-text font-semibold text-xs uppercase tracking-wider text-base-content/60">Sort By</span></label>
      <div class="flex gap-2">
        <select v-model="localFilters.order_by" class="select select-sm select-bordered flex-1">
          <option value="">Default Ranking</option>
          <option value="score">Score</option>
          <option value="popularity">Popularity</option>
          <option value="members">Members</option>
          <option value="title">Title</option>
          <option value="start_date">Start Date</option>
        </select>
        <button
          class="btn btn-sm btn-square btn-outline border-base-content/20"
          :class="{ 'opacity-50 pointer-events-none': !localFilters.order_by }"
          @click="toggleSortDir"
          :aria-label="localFilters.sort === 'asc' ? 'Ascending' : 'Descending'"
        >
          <svg v-if="localFilters.sort === 'asc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v2H3V3m0 8h12v2H3v-2m0 8h6v2H3v-2z" /></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18v-2H3v2m0-8h12v-2H3v2m0-8h6v-2H3v2z" /></svg>
        </button>
      </div>
    </div>

    <!-- Type -->
    <div class="form-control">
      <label class="label px-0 pt-0 pb-1.5"><span class="label-text font-semibold text-xs uppercase tracking-wider text-base-content/60">Format</span></label>
      <select v-model="localFilters.type" class="select select-sm select-bordered w-full">
        <option value="">All Formats</option>
        <option value="tv">TV</option>
        <option value="movie">Movie</option>
        <option value="ova">OVA</option>
        <option value="special">Special</option>
        <option value="ona">ONA</option>
      </select>
    </div>

    <!-- Status -->
    <div class="form-control">
      <label class="label px-0 pt-0 pb-1.5"><span class="label-text font-semibold text-xs uppercase tracking-wider text-base-content/60">Airing Status</span></label>
      <select v-model="localFilters.status" class="select select-sm select-bordered w-full">
        <option value="">All Statuses</option>
        <option value="airing">Currently Airing</option>
        <option value="complete">Finished</option>
        <option value="upcoming">Upcoming</option>
      </select>
    </div>

    <!-- Genres Grid -->
    <div class="form-control">
      <div class="flex items-center justify-between pb-2 border-b border-base-content/10 mb-3">
        <label class="label px-0 py-0"><span class="label-text font-semibold text-xs uppercase tracking-wider text-base-content/60">Genres</span></label>
        <button class="text-[10px] font-bold text-primary uppercase tracking-wide hover:underline" @click="genresExpanded = !genresExpanded">
          {{ genresExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-2 overflow-hidden transition-all duration-300" :style="{ maxHeight: genresExpanded ? '1000px' : '150px' }">
        <label v-for="g in sortedGenres" :key="g.mal_id" class="cursor-pointer flex items-start gap-2 group">
          <input
            type="checkbox"
            class="checkbox checkbox-xs checkbox-primary mt-0.5 rounded"
            :checked="selectedGenreIds.includes(g.mal_id)"
            @change="toggleGenre(g.mal_id)"
          />
          <span class="label-text text-xs leading-tight group-hover:text-primary transition-colors flex-1">{{ g.name }}</span>
        </label>
      </div>
      
      <!-- Fade over rest of genres when collapsed -->
      <div v-show="!genresExpanded" class="h-12 -mt-12 bg-gradient-to-t from-base-200 to-transparent pointer-events-none relative z-10" />
    </div>

  </div>
</template>

<script setup lang="ts">
import type { JikanAnimeSearchFilter, JikanGenre } from '~/composables/useJikanApi'

const props = defineProps<{
  modelValue: JikanAnimeSearchFilter
  genres: JikanGenre[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: JikanAnimeSearchFilter): void
}>()

// Fast clone of props.modelValue to work with locally
const localFilters = ref<JikanAnimeSearchFilter>({ ...props.modelValue })

// We manage selected genres as an array of numbers internally for the checkboxes
const selectedGenreIds = ref<number[]>(
  props.modelValue.genres ? props.modelValue.genres.split(',').map(Number) : []
)

const genresExpanded = ref(false)

const sortedGenres = computed(() => {
  return [...props.genres].sort((a, b) => a.name.localeCompare(b.name))
})

const hasFilters = computed(() => {
  return !!(
    localFilters.value.q ||
    localFilters.value.type ||
    localFilters.value.status ||
    localFilters.value.order_by ||
    selectedGenreIds.value.length > 0
  )
})

const toggleGenre = (id: number) => {
  const idx = selectedGenreIds.value.indexOf(id)
  if (idx === -1) {
    selectedGenreIds.value.push(id)
  } else {
    selectedGenreIds.value.splice(idx, 1)
  }
}

const toggleSortDir = () => {
  localFilters.value.sort = localFilters.value.sort === 'asc' ? 'desc' : 'asc'
}

const clearFilters = () => {
  localFilters.value = {
    q: '',
    type: '',
    status: '',
    order_by: '',
    sort: 'desc'
  }
  selectedGenreIds.value = []
}

// Watch inner state and emit up to parent — never syncs back down
watch(
  [localFilters, selectedGenreIds],
  () => {
    const payload: JikanAnimeSearchFilter = { ...localFilters.value }
    // Convert array back to comma string for Jikan API
    if (selectedGenreIds.value.length > 0) {
      payload.genres = selectedGenreIds.value.join(',')
    } else {
      delete payload.genres
    }
    emit('update:modelValue', payload)
  },
  { deep: true }
)
</script>
