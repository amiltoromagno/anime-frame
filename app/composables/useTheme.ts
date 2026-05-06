export const useTheme = () => {
  const theme = useState<string>('theme', () => 'dark')

  const setTheme = (newTheme: string) => {
    theme.value = newTheme
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', newTheme)
      localStorage.setItem('animeframe-theme', newTheme)
    }
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('animeframe-theme')
      if (saved) {
        setTheme(saved)
      } else {
        setTheme('dark')
      }
    }
  }

  const isDark = computed(() => theme.value === 'dark')

  return {
    theme,
    setTheme,
    toggleTheme,
    initTheme,
    isDark,
  }
}
