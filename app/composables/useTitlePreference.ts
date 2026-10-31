import type { AnimeNode } from '~/utils/anime'

type TitlePref = 'english' | 'romaji'

const STORAGE_KEY = 'animeframe-title-pref'

type TitledAnime = Pick<AnimeNode, 'title' | 'alternative_titles'>

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

  const displayTitle = (anime: TitledAnime): string => {
    const english = anime.alternative_titles?.en?.trim()
    if (titlePref.value === 'romaji' || !english) {
      return anime.title
    }
    return english
  }

  return { titlePref, toggleTitlePref, displayTitle }
}
