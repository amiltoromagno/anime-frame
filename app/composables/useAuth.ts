// ============================================================
// useAuth — MyAnimeList OAuth2 + PKCE authentication composable
// ============================================================

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

const MAL_AUTH_BASE = 'https://myanimelist.net/v1/oauth2'
const MAL_API_BASE = 'https://api.myanimelist.net/v2'

// ── PKCE helpers ────────────────────────────────────────────

function generateCodeVerifier(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => charset[byte % charset.length]).join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier)
  return base64UrlEncode(hash)
}

function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Token storage ───────────────────────────────────────────

function saveTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const expiresAt = Date.now() + expiresIn * 1000
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken)
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken)
    localStorage.setItem(STORAGE_KEYS.tokenExpiry, String(expiresAt))
  }
}

function clearTokens() {
  if (import.meta.client) {
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    localStorage.removeItem(STORAGE_KEYS.tokenExpiry)
    localStorage.removeItem(STORAGE_KEYS.user)
  }
}

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null; expiresAt: number | null } {
  if (!import.meta.client) {
    return { accessToken: null, refreshToken: null, expiresAt: null }
  }
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
    expiresAt: localStorage.getItem(STORAGE_KEYS.tokenExpiry)
      ? Number(localStorage.getItem(STORAGE_KEYS.tokenExpiry))
      : null,
  }
}

// ── Main composable ─────────────────────────────────────────

export const useAuth = () => {
  const config = useRuntimeConfig()
  const clientId = config.public.malClientId as string
  const redirectUri = config.public.malRedirectUri as string

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
      const stored = getStoredTokens()
      if (stored.accessToken && stored.refreshToken) {
        accessToken.value = stored.accessToken
        refreshToken.value = stored.refreshToken
        expiresAt.value = stored.expiresAt

        // Restore user from cache
        if (import.meta.client) {
          const cachedUser = localStorage.getItem(STORAGE_KEYS.user)
          if (cachedUser) {
            try { user.value = JSON.parse(cachedUser) } catch { /* ignore */ }
          }
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
      clearTokens()
    } finally {
      authLoading.value = false
    }
  }

  // ── Login (redirect to MAL) ────────────────────────────
  function login() {
    if (!clientId) {
      console.error('[useAuth] MAL_CLIENT_ID is not configured')
      return
    }

    const verifier = generateCodeVerifier()
    const state = generateState()

    // Store PKCE + state in sessionStorage (cleared on tab close)
    if (import.meta.client) {
      sessionStorage.setItem('animeframe-pkce-verifier', verifier)
      sessionStorage.setItem('animeframe-oauth-state', state)
    }

    // MAL only supports the "plain" PKCE method — code_challenge must equal code_verifier
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: verifier,
      code_challenge_method: 'plain',
      state,
    })

    // Redirect to MAL for authorization
    window.location.href = `${MAL_AUTH_BASE}/authorize?${params.toString()}`
  }

  // ── Handle OAuth callback ──────────────────────────────
  async function handleCallback(code: string, state: string): Promise<true | string> {
    try {
      // Validate state
      const savedState = import.meta.client
        ? sessionStorage.getItem('animeframe-oauth-state')
        : null
      if (state !== savedState) {
        console.error('[useAuth] State mismatch — possible CSRF attack')
        return 'Security check failed (state mismatch). This may happen if you opened the page in a new tab. Please try again.'
      }

      const verifier = import.meta.client
        ? sessionStorage.getItem('animeframe-pkce-verifier')
        : null
      if (!verifier) {
        console.error('[useAuth] No PKCE verifier found')
        return 'Login session expired. Please try signing in again.'
      }

      // Clean up session storage
      if (import.meta.client) {
        sessionStorage.removeItem('animeframe-pkce-verifier')
        sessionStorage.removeItem('animeframe-oauth-state')
      }

      // Exchange code for tokens via our proxy (avoids CORS)
      const body = JSON.stringify({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      })

      const response = await fetch('/api/mal-token-exchange', {
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
      saveTokens(data.access_token, data.refresh_token, data.expires_in)

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
      const response = await fetch('/api/mal-user', {
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
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(malUser))
      }
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
      const response = await fetch('/api/mal-token-refresh', {
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
      saveTokens(data.access_token, data.refresh_token, data.expires_in)

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
    clearTokens()

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
