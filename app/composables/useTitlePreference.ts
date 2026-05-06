import type { JikanAnime, JikanAnimeFullDetail } from '~/composables/useJikanApi'

type TitlePref = 'english' | 'romaji'

const STORAGE_KEY = 'animeframe-title-pref'

export const useTitlePreference = () => {
  const titlePref = useState<TitlePref>('titlePref', () => {
    if (import.meta.client) {
      return (localStorage.getItem(STORAGE_KEY) as TitlePref) || 'romaji'
    }
    return 'romaji'
  })

  const toggleTitlePref = () => {
    titlePref.value = titlePref.value === 'english' ? 'romaji' : 'english'
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, titlePref.value)
    }
  }

  const displayTitle = (anime: Pick<JikanAnime | JikanAnimeFullDetail, 'title' | 'title_english'>): string => {
    if (titlePref.value === 'romaji' || !anime.title_english) {
      return anime.title
    }
    return anime.title_english
  }

  return { titlePref, toggleTitlePref, displayTitle }
}
