<template>
  <div
    class="group relative flex gap-3 bg-base-200 rounded-xl transition-all duration-200 hover:bg-base-300 hover:shadow-md border border-base-content/5"
  >
    <!-- Poster -->
    <NuxtLink :to="`/anime/${entry.node.id}`" class="shrink-0 rounded-l-xl overflow-hidden">
      <img
        :src="posterUrl"
        :alt="entry.node.title"
        class="w-20 h-28 object-cover bg-base-300"
        loading="lazy"
      />
    </NuxtLink>

    <!-- Info -->
    <div class="flex-1 min-w-0 py-2.5 pr-3 flex flex-col justify-between gap-1">
      <!-- Title & status -->
      <div>
        <NuxtLink
          :to="`/anime/${entry.node.id}`"
          class="font-semibold text-sm line-clamp-1 hover:text-primary transition-colors"
        >
          {{ displayTitle }}
        </NuxtLink>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="badge badge-xs" :class="statusBadgeClass">{{ statusLabel }}</span>
          <span v-if="entry.node.media_type" class="text-[10px] text-base-content/40 uppercase">{{ entry.node.media_type }}</span>
          <span v-if="entry.node.num_episodes" class="text-[10px] text-base-content/40">{{ entry.node.num_episodes }} eps</span>
        </div>
      </div>

      <!-- Bottom row: score + progress + menu -->
      <div class="flex items-center gap-3">
        <!-- Score inline edit -->
        <div class="dropdown dropdown-top">
          <button
            class="btn btn-ghost btn-xs gap-0.5 px-1.5"
            :class="scoreTextClass"
            tabindex="0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {{ entry.list_status.score || '?' }}
          </button>
          <div tabindex="0" class="dropdown-content bg-base-100 rounded-xl shadow-xl border border-base-content/10 p-2 z-20 min-w-45">
            <p class="text-xs font-semibold text-base-content/50 mb-1.5 px-1">Score</p>
            <div class="flex gap-0.5">
              <button
                v-for="s in 10"
                :key="s"
                class="btn btn-xs btn-square"
                :class="s <= entry.list_status.score ? 'text-yellow-400 bg-yellow-400/10' : 'text-base-content/20'"
                @click="setScore(s)"
              >{{ s }}</button>
            </div>
          </div>
        </div>

        <!-- Progress inline edit -->
        <div class="flex items-center gap-1">
          <button
            class="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100"
            :disabled="(entry.list_status.num_episodes_watched || 0) <= 0"
            @click="updateEpisodes(Math.max(0, (entry.list_status.num_episodes_watched || 0) - 1))"
          >−</button>
          <button
            class="dropdown dropdown-top"
            @click.stop
          >
            <span
              class="text-xs font-bold tabular-nums cursor-pointer hover:text-primary transition-colors"
              tabindex="0"
            >
              {{ entry.list_status.num_episodes_watched || 0 }}
              <span v-if="entry.node.num_episodes" class="text-base-content/30 font-normal">/{{ entry.node.num_episodes }}</span>
            </span>
            <div tabindex="0" class="dropdown-content bg-base-100 rounded-xl shadow-xl border border-base-content/10 p-3 z-20 min-w-40">
              <p class="text-xs font-semibold text-base-content/50 mb-2">Episodes Watched</p>
              <div class="flex items-center gap-2">
                <button class="btn btn-xs btn-outline btn-square" @click="updateEpisodes(Math.max(0, (entry.list_status.num_episodes_watched || 0) - 5))">−5</button>
                <input
                  type="number"
                  :value="entry.list_status.num_episodes_watched || 0"
                  min="0"
                  :max="entry.node.num_episodes || 9999"
                  class="input input-xs input-bordered w-16 text-center tabular-nums"
                  @change="updateEpisodes(Number(($event.target as HTMLInputElement).value))"
                />
                <button class="btn btn-xs btn-outline btn-square" @click="updateEpisodes(Math.min(entry.node.num_episodes || 9999, (entry.list_status.num_episodes_watched || 0) + 5))">+5</button>
              </div>
            </div>
          </button>
        </div>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- More menu -->
        <div class="dropdown dropdown-end">
          <button class="btn btn-ghost btn-xs btn-square opacity-40 group-hover:opacity-100 transition-opacity" tabindex="0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          <ul tabindex="0" class="dropdown-content menu menu-sm bg-base-100 rounded-xl shadow-xl border border-base-content/10 z-20 w-44 p-2">
            <li class="menu-title"><span>Change Status</span></li>
            <li v-for="opt in statusOptions" :key="opt.value">
              <button @click="changeStatus(opt.value)" :class="{ 'text-primary font-semibold': opt.value === entry.list_status.status }">
                {{ opt.label }}
              </button>
            </li>
            <li><button @click="removeEntryFromList" class="text-error">Remove from List</button></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MalListEntry, MalAnimeStatus } from '~/composables/useMalApi'
import { useTitlePreference } from '~/composables/useTitlePreference'

const props = defineProps<{
  entry: MalListEntry
}>()

const emit = defineEmits<{
  (e: 'update'): void
}>()

const { updateAnimeListStatus, deleteAnimeListStatus } = useMalApi()
const { updateEntry, removeEntry } = useUserAnimeList()
const { titlePref } = useTitlePreference()

const displayTitle = computed(() => {
  const node = props.entry.node
  if (titlePref.value === 'english' && node.alternative_titles?.en) {
    return node.alternative_titles.en
  }
  return node.title
})

// ── Computed ────────────────────────────────────────────────

const posterUrl = computed(() => {
  return props.entry.node.main_picture?.large
    || props.entry.node.main_picture?.medium
    || ''
})

const statusBadgeClass = computed(() => {
  switch (props.entry.list_status.status) {
    case 'watching': return 'badge-success'
    case 'completed': return 'badge-info'
    case 'on_hold': return 'badge-warning'
    case 'dropped': return 'badge-error'
    case 'plan_to_watch': return 'badge-ghost'
    default: return 'badge-ghost'
  }
})

const statusLabel = computed(() => {
  switch (props.entry.list_status.status) {
    case 'watching': return 'Watching'
    case 'completed': return 'Completed'
    case 'on_hold': return 'On Hold'
    case 'dropped': return 'Dropped'
    case 'plan_to_watch': return 'Planned'
    default: return ''
  }
})

const scoreTextClass = computed(() => {
  const s = props.entry.list_status.score
  if (!s) return 'text-base-content/30'
  if (s >= 8) return 'text-success'
  if (s >= 6) return 'text-warning'
  return 'text-error'
})

const statusOptions = [
  { value: 'watching' as MalAnimeStatus, label: 'Watching' },
  { value: 'completed' as MalAnimeStatus, label: 'Completed' },
  { value: 'on_hold' as MalAnimeStatus, label: 'On Hold' },
  { value: 'dropped' as MalAnimeStatus, label: 'Dropped' },
  { value: 'plan_to_watch' as MalAnimeStatus, label: 'Plan to Watch' },
]

// ── Inline edits ────────────────────────────────────────────

async function setScore(score: number) {
  try {
    const result = await updateAnimeListStatus(props.entry.node.id, { score })
    updateEntry(props.entry.node.id, result)
    emit('update')
  } catch (err) {
    console.error('Failed to update score:', err)
  }
}

async function updateEpisodes(num: number) {
  try {
    const result = await updateAnimeListStatus(props.entry.node.id, {
      num_watched_episodes: num,
    })
    updateEntry(props.entry.node.id, result)
    emit('update')
  } catch (err) {
    console.error('Failed to update episodes:', err)
  }
}

async function changeStatus(status: MalAnimeStatus) {
  try {
    const result = await updateAnimeListStatus(props.entry.node.id, { status })
    updateEntry(props.entry.node.id, result)
    emit('update')
  } catch (err) {
    console.error('Failed to change status:', err)
  }
}

async function removeEntryFromList() {
  try {
    await deleteAnimeListStatus(props.entry.node.id)
    removeEntry(props.entry.node.id)
    emit('update')
  } catch (err) {
    console.error('Failed to remove entry:', err)
  }
}

// Expose remove function for parent to use
defineExpose({ removeEntryFromList })
</script>
