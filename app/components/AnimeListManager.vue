<template>
  <div class="bg-base-200 rounded-xl p-4 border border-base-content/5 space-y-4">
    <!-- ❖ Not authenticated -->
    <template v-if="!isAuthenticated">
      <p class="text-sm text-base-content/60 text-center">
        <NuxtLink to="/login" class="link link-primary font-semibold">Sign in</NuxtLink>
        with MyAnimeList to track this anime.
      </p>
    </template>

    <!-- ❖ Loading -->
    <template v-else-if="loading">
      <div class="flex items-center justify-center py-4">
        <span class="loading loading-spinner loading-sm text-primary" />
      </div>
    </template>

    <!-- ❖ Error -->
    <template v-else-if="error">
      <p class="text-sm text-error text-center">{{ error }}</p>
      <button @click="loadStatus" class="btn btn-ghost btn-xs w-full">Retry</button>
    </template>

    <!-- ❖ Not in list ── Add form -->
    <template v-else-if="!inList">
      <h3 class="font-bold text-sm uppercase tracking-wider text-base-content/50">Track</h3>
      <div class="space-y-2">
        <select
          v-model="addStatus"
          class="select select-sm select-bordered w-full"
        >
          <option value="" disabled>Add to list...</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="dropped">Dropped</option>
          <option value="plan_to_watch">Plan to Watch</option>
        </select>
        <button
          :disabled="!addStatus || saving"
          class="btn btn-primary btn-sm w-full"
          :class="{ 'opacity-50': !addStatus }"
          @click="addToList"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          {{ saving ? 'Adding...' : 'Add to List' }}
        </button>
      </div>
    </template>

    <!-- ❖ In list ── Manage form -->
    <template v-else>
      <!-- Header row -->
      <h3 class="font-bold text-sm uppercase tracking-wider text-base-content/50">My Status</h3>

      <!-- Status selector -->
      <div class="form-control">
        <label class="label px-0 py-0 pb-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Status</span>
        </label>
        <select
          v-model="form.status"
          class="select select-sm select-bordered w-full"
          @change="scheduleSave"
        >
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="dropped">Dropped</option>
          <option value="plan_to_watch">Plan to Watch</option>
        </select>
      </div>

      <!-- Score -->
      <div class="form-control">
        <label class="label px-0 py-0 pb-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Score</span>
        </label>
        <select
          v-model.number="form.score"
          class="select select-sm select-bordered w-full"
          @change="scheduleSave"
        >
          <option :value="0">Not scored</option>
          <option v-for="s in 10" :key="s" :value="s">{{ s }} {{ s >= 9 ? '★' : s >= 7 ? '☆' : '' }}</option>
        </select>
      </div>

      <!-- Episodes watched -->
      <div class="form-control">
        <label class="label px-0 py-0 pb-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Episodes Watched</span>
        </label>
        <div class="flex items-center gap-2">
          <button
            class="btn btn-xs btn-outline btn-square"
            :disabled="(form.num_watched_episodes || 0) <= 0"
            @click="form.num_watched_episodes = Math.max(0, (form.num_watched_episodes || 0) - 1); scheduleSave()"
          >−</button>
          <span class="font-bold text-sm min-w-[4ch] text-center tabular-nums">
            {{ form.num_watched_episodes ?? 0 }}
            <span v-if="totalEpisodes" class="text-base-content/40 font-normal">/ {{ totalEpisodes }}</span>
          </span>
          <button
            class="btn btn-xs btn-outline btn-square"
            :disabled="totalEpisodes ? (form.num_watched_episodes || 0) >= totalEpisodes : false"
            @click="form.num_watched_episodes = (form.num_watched_episodes || 0) + 1; scheduleSave()"
          >+</button>
        </div>
      </div>

      <!-- Rewatching toggle -->
      <div class="form-control">
        <label class="cursor-pointer label px-0 py-0 justify-start gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-primary checkbox-xs"
            :checked="form.is_rewatching"
            @change="form.is_rewatching = !form.is_rewatching; scheduleSave()"
          />
          <span class="label-text text-xs font-semibold">Rewatching</span>
        </label>
      </div>

      <!-- Rewatch count (only shown when has been rewatched) -->
      <div v-if="form.num_times_rewatched && form.num_times_rewatched > 0" class="form-control">
        <label class="label px-0 py-0 pb-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Rewatched</span>
        </label>
        <div class="flex items-center gap-2">
          <button class="btn btn-xs btn-outline btn-square" :disabled="(form.num_times_rewatched || 0) <= 0" @click="form.num_times_rewatched = Math.max(0, (form.num_times_rewatched || 0) - 1); scheduleSave()">−</button>
          <span class="font-bold text-sm min-w-[3ch] text-center tabular-nums">{{ form.num_times_rewatched ?? 0 }}×</span>
          <button class="btn btn-xs btn-outline btn-square" @click="form.num_times_rewatched = (form.num_times_rewatched || 0) + 1; scheduleSave()">+</button>
        </div>
      </div>

      <!-- Dates -->
      <div class="flex flex-col gap-2">
        <div class="form-control">
          <label class="label px-0 py-0 pb-1">
            <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Start</span>
          </label>
          <input
            type="date"
            class="input input-xs input-bordered w-full"
            :value="form.start_date || ''"
            @change="form.start_date = ($event.target as HTMLInputElement).value || null; scheduleSave()"
          />
        </div>
        <div class="form-control">
          <label class="label px-0 py-0 pb-1">
            <span class="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Finish</span>
          </label>
          <input
            type="date"
            class="input input-xs input-bordered w-full"
            :value="form.finish_date || ''"
            @change="form.finish_date = ($event.target as HTMLInputElement).value || null; scheduleSave()"
          />
        </div>
      </div>

      <!-- Remove + Save indicator -->
      <div class="pt-2 space-y-3">
        <!-- Confirm remove -->
        <div v-if="confirmRemove" class="bg-error/10 rounded-lg p-3 space-y-2 text-center">
          <p class="text-xs font-semibold">Remove from your list?</p>
          <div class="flex gap-2">
            <button
              class="btn btn-error btn-xs flex-1"
              :class="{ 'loading': saving }"
              :disabled="saving"
              @click="removeFromList"
            >Yes</button>
            <button class="btn btn-ghost btn-xs flex-1" @click="confirmRemove = false">Cancel</button>
          </div>
        </div>

        <!-- Remove button -->
        <button
          v-if="!confirmRemove"
          class="btn btn-ghost btn-xs text-error gap-1 w-full"
          @click="confirmRemove = true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Remove from list
        </button>

        <div class="flex items-center justify-between pt-1">
          <span v-if="saveState === 'saving'" class="text-xs text-base-content/40 flex items-center gap-1">
            <span class="loading loading-spinner loading-xs" /> Saving...
          </span>
          <span v-else-if="saveState === 'saved'" class="text-xs text-success flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Saved
          </span>
          <span v-else-if="saveState === 'error'" class="text-xs text-error flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Save failed
          </span>
          <span v-else class="text-xs text-base-content/30">All changes auto-saved</span>

          <!-- Force sync button -->
          <button
            v-if="saveState === 'error'"
            class="btn btn-ghost btn-xs text-primary"
            @click="saveChanges"
          >Retry</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MalAnimeStatus, MalListStatus, MalUpdateListParams } from '~/composables/useMalApi'

const props = defineProps<{
  animeId: number
  totalEpisodes?: number | null
}>()

const { isAuthenticated } = useAuth()
const { updateAnimeListStatus, deleteAnimeListStatus, getAnimeListStatus } = useMalApi()
const { getStatus, updateEntry, removeEntry, addEntryFromApi } = useUserAnimeList()

// ── State ───────────────────────────────────────────────────

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const confirmRemove = ref(false)
const inList = ref(false)
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const addStatus = ref<MalAnimeStatus | ''>('')

let saveTimer: ReturnType<typeof setTimeout> | null = null

const form = reactive<MalUpdateListParams>({
  status: undefined,
  score: 0,
  num_watched_episodes: 0,
  is_rewatching: false,
  num_times_rewatched: 0,
  start_date: null,
  finish_date: null,
})

// ── Load current status ─────────────────────────────────────

async function loadStatus() {
  if (!isAuthenticated.value) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    // Always fetch fresh from the API for the detail page
    const status = await getAnimeListStatus(props.animeId)
    if (status) {
      applyStatus(status)
      inList.value = true
      // Sync cache with fresh data
      updateEntry(props.animeId, status)
    } else {
      inList.value = false
      resetForm()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load list status'
  } finally {
    loading.value = false
  }
}

function applyStatus(status: MalListStatus) {
  form.status = status.status
  form.score = status.score
  form.num_watched_episodes = status.num_episodes_watched
  form.is_rewatching = status.is_rewatching
  form.num_times_rewatched = status.num_times_rewatched
  form.start_date = status.start_date
  form.finish_date = status.finish_date
  inList.value = true
}

function resetForm() {
  form.status = undefined
  form.score = 0
  form.num_watched_episodes = 0
  form.is_rewatching = false
  form.num_times_rewatched = 0
  form.start_date = null
  form.finish_date = null
}

// ── Add to list ─────────────────────────────────────────────

async function addToList() {
  if (!addStatus.value) return

  saving.value = true
  error.value = null

  try {
    const result = await updateAnimeListStatus(props.animeId, {
      status: addStatus.value as MalAnimeStatus,
    })
    applyStatus(result)
    inList.value = true
    addStatus.value = ''

    // Update cache
    updateEntry(props.animeId, result)
  } catch (err: any) {
    error.value = err.message || 'Failed to add to list'
  } finally {
    saving.value = false
  }
}

// ── Remove from list ────────────────────────────────────────

async function removeFromList() {
  saving.value = true
  error.value = null

  try {
    await deleteAnimeListStatus(props.animeId)
    inList.value = false
    confirmRemove.value = false
    resetForm()

    // Update cache
    removeEntry(props.animeId)
  } catch (err: any) {
    error.value = err.message || 'Failed to remove from list'
  } finally {
    saving.value = false
  }
}

// ── Auto-save ───────────────────────────────────────────────

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveState.value = 'idle'
  saveTimer = setTimeout(() => saveChanges(), 800)
}

async function saveChanges() {
  if (!inList.value || !form.status) return

  saveState.value = 'saving'
  error.value = null

  const payload: MalUpdateListParams = {
    status: form.status,
    score: form.score || 0,
    num_watched_episodes: form.num_watched_episodes || 0,
    is_rewatching: form.is_rewatching,
    num_times_rewatched: form.num_times_rewatched || 0,
    start_date: form.start_date,
    finish_date: form.finish_date,
  }

  try {
    const result = await updateAnimeListStatus(props.animeId, payload)
    updateEntry(props.animeId, result)
    saveState.value = 'saved'
    setTimeout(() => {
      if (saveState.value === 'saved') saveState.value = 'idle'
    }, 2000)
  } catch (err: any) {
    saveState.value = 'error'
    error.value = err.message || 'Save failed'
  }
}

// ── Init ────────────────────────────────────────────────────

onMounted(() => {
  loadStatus()
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
})
</script>
