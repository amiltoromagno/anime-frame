import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

// ============================================================
// OAuth deep-link handler (Android)
// ============================================================
//
// MAL redirects to animeframe://auth/callback?code=...&state=...
// Android launches the app and Capacitor emits `appUrlOpen`.
// We forward the parameters to the existing /auth/callback page, which
// already knows how to validate state and exchange the code.

interface AuthDeepLink {
  path: string
  query: Record<string, string>
}

function parseAuthDeepLink(raw: string): AuthDeepLink | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'animeframe:' || url.host !== 'auth') return null

    const query: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      query[key] = value
    })

    return { path: '/auth/callback', query }
  } catch {
    return null
  }
}

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  async function handleUrl(raw: string): Promise<void> {
    const target = parseAuthDeepLink(raw)
    if (!target) return

    // The Custom Tab that ran the MAL login is no longer needed.
    try {
      await Browser.close()
    } catch {
      // Nothing open, or the user already closed it.
    }

    await router.replace(target)
  }

  App.addListener('appUrlOpen', ({ url }) => {
    void handleUrl(url)
  })

  // Cold start: the app was launched by the OAuth redirect.
  App.getLaunchUrl()
    .then(async (launch) => {
      if (!launch?.url) return
      await router.isReady()
      await handleUrl(launch.url)
    })
    .catch((error) => {
      console.error('[DeepLink] Failed to read launch URL:', error)
    })
})
