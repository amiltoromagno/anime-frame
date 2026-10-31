// GET /api/mal-public/**
// Public, read-only proxy for the official MyAnimeList API v2.
//
// MAL does not send CORS headers, so the browser can never call
// api.myanimelist.net directly. This route attaches the app's client ID
// (app-only auth via X-MAL-CLIENT-ID) and forwards the request.
//
// Only GET/HEAD are allowed: anything that touches a user's list must go
// through /api/mal-proxy, which requires the user's bearer token.

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Only GET is allowed on the public catalog endpoint',
    })
  }

  const config = useRuntimeConfig()
  const clientId = config.public.malClientId

  if (!clientId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'MyAnimeList client ID is not configured (NUXT_PUBLIC_MAL_CLIENT_ID)',
    })
  }

  const requestUrl = getRequestURL(event)
  const malPath = requestUrl.pathname.replace(/^\/api\/mal-public\/?/, '')

  if (!malPath) {
    throw createError({ statusCode: 400, statusMessage: 'Missing MAL API path' })
  }

  if (malPath.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid MAL API path' })
  }

  const malUrl = `https://api.myanimelist.net/v2/${malPath}${requestUrl.search}`

  const response = await fetch(malUrl, {
    method: 'GET',
    headers: {
      'X-MAL-CLIENT-ID': clientId,
      Accept: 'application/json',
    },
  })

  setResponseStatus(event, response.status)

  const contentType = response.headers.get('content-type')
  if (contentType) {
    setResponseHeader(event, 'content-type', contentType)
  }

  // Catalog data changes slowly: let browsers keep it for 5 minutes and
  // shared caches for an hour. Errors are never cached.
  setResponseHeader(
    event,
    'cache-control',
    response.ok ? 'public, max-age=300, s-maxage=3600' : 'no-store',
  )

  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
})
