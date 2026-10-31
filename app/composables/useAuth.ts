// ============================================================
// useAuth — MyAnimeList OAuth2 + PKCE authentication composable
// ============================================================

import { appStorage } from '~/utils/storage'
import { isNativeApp } from '~/utils/platform'

export interface MalUser {
  id: number
  name: string
  picture: string
}

interface MalTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

// ── Storage keys ────────────────────────────────────────────
const STORAGE_KEYS = {
  accessToken: 'animeframe-access-token',
  refreshToken: 'animeframe-refresh-token',
  tokenExpiry: 'animeframe-token-expiry',
  user: 'animeframe-user',
}

const OAUTH_KEYS = {
  verifier: 'animeframe-pkce-verifier',
  state: 'animeframe-oauth-state',
}

const REDIRECT_TARGET_KEY = 'animeframe-redirect-to'

const MAL_AUTH_BASE = 'https://myanimelist.net/v1/oauth2'

// MAL requires redirect_uri to exactly match a pre-registered URI.
// Add this custom scheme to the MAL app config for the Android build.
const NATIVE_REDIRECT_URI = 'animeframe://auth/callback'

// ── PKCE helpers ────────────────────────────────────────────

function generateCodeVerifier(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => charset[byte % charset.length]!).join('')
}

function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Token storage ───────────────────────────────────────────
// On Android this goes through Android Keystore-backed secure storage;
// on the web it remains localStorage so existing sessions keep working.

async function saveTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const expiresAt = Date.now() + expiresIn * 1000
  await Promise.all([
    appStorage.set(STORAGE_KEYS.accessToken, accessToken),
    appStorage.set(STORAGE_KEYS.refreshToken, refreshToken),
    appStorage.set(STORAGE_KEYS.tokenExpiry, String(expiresAt)),
  ])
}

async function clearTokens() {
  await Promise.all([
    appStorage.remove(STORAGE_KEYS.accessToken),
    appStorage.remove(STORAGE_KEYS.refreshToken),
    appStorage.remove(STORAGE_KEYS.tokenExpiry),
    appStorage.remove(STORAGE_KEYS.user),
  ])
}

async function getStoredTokens(): Promise<{
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}> {
  const [accessToken, refreshToken, expiry] = await Promise.all([
    appStorage.get(STORAGE_KEYS.accessToken),
    appStorage.get(STORAGE_KEYS.refreshToken),
    appStorage.get(STORAGE_KEYS.tokenExpiry),
  ])

  return {
    accessToken,
    refreshToken,
    expiresAt: expiry ? Number(expiry) : null,
  }
}

// ── OAuth hand-off state ────────────────────────────────────
// Web: sessionStorage (cleared on tab close).
// Android: secure storage, so the verifier survives the app being killed
// while the user is in the system browser.

async function storeOauthSession(verifier: string, state: string, native: boolean): Promise<void> {
  if (native) {
    await Promise.all([
      appStorage.set(OAUTH_KEYS.verifier, verifier),
      appStorage.set(OAUTH_KEYS.state, state),
    ])
    return
  }

  if (import.meta.client) {
    sessionStorage.setItem(OAUTH_KEYS.verifier, verifier)
    sessionStorage.setItem(OAUTH_KEYS.state, state)
  }
}

async function readOauthSession(native: boolean): Promise<{
  verifier: string | null
  state: string | null
}> {
  if (native) {
    const [verifier, state] = await Promise.all([
      appStorage.get(OAUTH_KEYS.verifier),
      appStorage.get(OAUTH_KEYS.state),
    ])
    return { verifier, state }
  }

  if (!import.meta.client) return { verifier: null, state: null }
  return {
    verifier: sessionStorage.getItem(OAUTH_KEYS.verifier),
    state: sessionStorage.getItem(OAUTH_KEYS.state),
  }
}

async function clearOauthSession(native: boolean): Promise<void> {
  if (native) {
    await Promise.all([
      appStorage.remove(OAUTH_KEYS.verifier),
      appStorage.remove(OAUTH_KEYS.state),
    ])
    return
  }

  if (import.meta.client) {
    sessionStorage.removeItem(OAUTH_KEYS.verifier)
    sessionStorage.removeItem(OAUTH_KEYS.state)
  }
}

// ── Redirect target (post-login destination) ───────────────

export async function setRedirectTarget(path: string): Promise<void> {
  if (!path.startsWith('/')) return
  await appStorage.set(REDIRECT_TARGET_KEY, path)
}

export async function takeRedirectTarget(): Promise<string> {
  const target = await appStorage.get(REDIRECT_TARGET_KEY)
  await appStorage.remove(REDIRECT_TARGET_KEY)
  return target && target.startsWith('/') ? target : '/'
}

// ── Main composable ─────────────────────────────────────────

export const useAuth = () => {
  const config = useRuntimeConfig()
  const clientId = config.public.malClientId as string
  const redirectUri = config.public.malRedirectUri as string
  const apiBase = String(config.public.apiBase ?? '').replace(/\/$/, '')
  const api = (path: string) => `${apiBase}${path}`

  const user = useState<MalUser | null>('auth-user', () => null)
  const accessToken = useState<string | null>('auth-access-token', () => null)
  const refreshToken = useState<string | null>('auth-refresh-token', () => null)
  const expiresAt = useState<number | null>('auth-expires-at', () => null)
  const authLoading = useState<boolean>('auth-loading', () => true)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const tokenExpired = computed(() => expiresAt.value !== null && Date.now() >= expiresAt.value)

  // ── Init from stored tokens ─────────────────────────────
  async function initAuth() {
    authLoading.value = true
    try {
      const stored = await getStoredTokens()
      if (stored.accessToken && stored.refreshToken) {
        accessToken.value = stored.accessToken
        refreshToken.value = stored.refreshToken
        expiresAt.value = stored.expiresAt

        // Restore user from cache
        const cachedUser = await appStorage.get(STORAGE_KEYS.user)
        if (cachedUser) {
          try { user.value = JSON.parse(cachedUser) } catch { /* ignore */ }
        }

        // Refresh if expired
        if (tokenExpired.value) {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            await logout()
            authLoading.value = false
            return
          }
        }

        // Fetch fresh profile if we don't have user yet
        if (!user.value) {
          await fetchUserProfile()
        }
      }
    } catch (err) {
      console.error('[useAuth] init failed:', err)
      await clearTokens()
    } finally {
      authLoading.value = false
    }
  }

  // ── Login (redirect to MAL) ────────────────────────────
  async function login(): Promise<void> {
    if (!clientId) {
      console.error('[useAuth] MAL_CLIENT_ID is not configured')
      return
    }

    const verifier = generateCodeVerifier()
    const state = generateState()
    const native = await isNativeApp()

    await storeOauthSession(verifier, state, native)

    // MAL only supports the "plain" PKCE method — code_challenge must equal code_verifier
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: native ? NATIVE_REDIRECT_URI : redirectUri,
      code_challenge: verifier,
      code_challenge_method: 'plain',
      state,
    })

    const authUrl = `${MAL_AUTH_BASE}/authorize?${params.toString()}`

    if (native) {
      // Open the system browser (Custom Tab) instead of navigating the WebView.
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: authUrl })
      return
    }

    window.location.href = authUrl
  }

  // ── Handle OAuth callback ──────────────────────────────
  async function handleCallback(code: string, state: string): Promise<true | string> {
    try {
      const native = await isNativeApp()
      const saved = await readOauthSession(native)

      // Validate state
      if (!saved.state || state !== saved.state) {
        console.error('[useAuth] State mismatch — possible CSRF attack')
        return 'Security check failed (state mismatch). This may happen if you opened the page in a new tab. Please try again.'
      }

      if (!saved.verifier) {
        console.error('[useAuth] No PKCE verifier found')
        return 'Login session expired. Please try signing in again.'
      }

      await clearOauthSession(native)

      // Exchange code for tokens via our proxy (keeps client_secret server-side)
      const body = JSON.stringify({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: native ? NATIVE_REDIRECT_URI : redirectUri,
        code_verifier: saved.verifier,
      })

      const response = await fetch(api('/api/mal-token-exchange'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('[useAuth] Token exchange failed:', response.status, errText)
        return `MAL token exchange failed (${response.status}). ${errText}`
      }

      const data: MalTokenResponse = await response.json()
      await saveTokens(data.access_token, data.refresh_token, data.expires_in)

      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token
      expiresAt.value = Date.now() + data.expires_in * 1000

      // Fetch user profile
      await fetchUserProfile()
      return true
    } catch (err) {
      console.error('[useAuth] handleCallback error:', err)
      return `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
    }
  }

  // ── Fetch user profile ─────────────────────────────────
  async function fetchUserProfile(): Promise<void> {
    if (!accessToken.value) return

    try {
      // Proxy through our server route to avoid CORS
      const response = await fetch(api('/api/mal-user'), {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      })

      if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`)

      const data = await response.json()
      const malUser: MalUser = {
        id: data.id,
        name: data.name,
        picture: data.picture,
      }

      user.value = malUser
      await appStorage.set(STORAGE_KEYS.user, JSON.stringify(malUser))
    } catch (err) {
      console.error('[useAuth] fetchUserProfile error:', err)
      throw err
    }
  }

  // ── Refresh access token ───────────────────────────────
  async function refreshAccessToken(): Promise<boolean> {
    if (!refreshToken.value) return false

    try {
      // Proxy through our server route to avoid CORS and keep client_secret server-side
      const response = await fetch(api('/api/mal-token-refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          refresh_token: refreshToken.value,
        }),
      })

      if (!response.ok) {
        console.error('[useAuth] Token refresh failed:', response.status)
        return false
      }

      const data: MalTokenResponse = await response.json()
      await saveTokens(data.access_token, data.refresh_token, data.expires_in)

      accessToken.value = data.access_token
      refreshToken.value = data.refresh_token
      expiresAt.value = Date.now() + data.expires_in * 1000
      return true
    } catch (err) {
      console.error('[useAuth] refreshAccessToken error:', err)
      return false
    }
  }

  // ── Logout ─────────────────────────────────────────────
  async function logout() {
    // Note: MAL OAuth2 doesn't have a token revocation endpoint in the v1 form,
    // so we just clear our local state
    accessToken.value = null
    refreshToken.value = null
    expiresAt.value = null
    user.value = null
    await clearTokens()

    // Navigate to home if on a protected page
    if (import.meta.client && window.location.pathname.startsWith('/mylist')) {
      await navigateTo('/')
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    authLoading,
    initAuth,
    login,
    handleCallback,
    refreshAccessToken,
    logout,
  }
}
