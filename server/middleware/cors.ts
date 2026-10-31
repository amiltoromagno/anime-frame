// ============================================================
// CORS for the native app and local development
// ============================================================
//
// The Capacitor WebView is a browser: its origin is https://localhost on
// Android, not the site that served the JS. Calls to the Cloudflare-hosted
// /api routes are therefore cross-origin and need CORS headers.
//
// Only explicit origins are allowed — this proxy is not opened to the world.

const DEFAULT_ALLOWED_ORIGINS = [
  'https://localhost', // Capacitor Android (androidScheme: https)
  'capacitor://localhost', // Capacitor iOS, if added later
  'http://localhost', // legacy Android scheme
  'http://localhost:3000', // browser dev server
  'http://127.0.0.1:3000',
]

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/')) return

  const config = useRuntimeConfig()
  const extraOrigins = String(config.corsAllowedOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins])
  const origin = getHeader(event, 'origin')

  // The response varies by Origin, and cacheable catalog responses must
  // advertise that even when the origin is not allowed — otherwise a cached
  // non-CORS response can be served to an allowed origin.
  setResponseHeader(event, 'vary', 'Origin')

  if (origin && allowedOrigins.has(origin)) {
    setResponseHeader(event, 'access-control-allow-origin', origin)
    setResponseHeader(event, 'access-control-allow-methods', 'GET, HEAD, POST, PATCH, DELETE, OPTIONS')
    setResponseHeader(event, 'access-control-allow-headers', 'Authorization, Content-Type, Accept')
    setResponseHeader(event, 'access-control-max-age', '86400')
  }

  // Preflight requests must be answered before the route handler (which
  // would otherwise reject the non-GET method with a 405).
  if (event.method === 'OPTIONS') {
    return sendNoContent(event, 204)
  }
})
