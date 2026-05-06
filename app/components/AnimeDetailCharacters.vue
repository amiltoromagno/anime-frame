<template>
  <section>
    <h2 class="text-base font-bold uppercase tracking-widest text-base-content/40 mb-4">Characters & Voice Actors</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="item in visibleCharacters"
        :key="item.character.mal_id"
        class="flex items-stretch bg-base-200 rounded-xl overflow-hidden hover:bg-base-300 transition-colors"
      >
        <!-- Character side -->
        <div class="flex items-center gap-3 flex-1 p-3 min-w-0">
          <img
            :src="item.character.images?.jpg?.image_url || item.character.images?.webp?.image_url"
            :alt="item.character.name"
            class="w-12 h-16 object-cover rounded-lg shrink-0 bg-base-300"
            loading="lazy"
          />
          <div class="min-w-0">
            <p class="font-semibold text-sm truncate">{{ item.character.name }}</p>
            <p class="text-xs text-base-content/50 mt-0.5">{{ item.role }}</p>
          </div>
        </div>

        <!-- Voice actor side (right-aligned, Japanese preferred) -->
        <div v-if="japaneseVA(item)" class="flex items-center gap-3 flex-row-reverse p-3 min-w-0">
          <img
            :src="japaneseVA(item)!.person.images.jpg.image_url"
            :alt="japaneseVA(item)!.person.name"
            class="w-12 h-16 object-cover rounded-lg shrink-0 bg-base-300"
            loading="lazy"
          />
          <div class="min-w-0 text-right">
            <p class="font-semibold text-sm truncate">{{ japaneseVA(item)!.person.name }}</p>
            <p class="text-xs text-base-content/50 mt-0.5">Japanese</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Show more / less -->
    <div v-if="characters.length > INITIAL_LIMIT" class="mt-4 text-center">
      <button
        class="btn btn-sm btn-outline rounded-full"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show less' : `Show all ${characters.length} characters` }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { JikanCharacter } from '~/composables/useJikanApi'

const props = defineProps<{
  characters: JikanCharacter[]
}>()

const INITIAL_LIMIT = 12
const showAll = ref(false)

const visibleCharacters = computed(() =>
  showAll.value ? props.characters : props.characters.slice(0, INITIAL_LIMIT)
)

const japaneseVA = (item: JikanCharacter) =>
  item.voice_actors?.find((va) => va.language === 'Japanese')
</script>
