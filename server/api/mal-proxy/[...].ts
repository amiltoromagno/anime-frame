// Catch-all proxy for MyAnimeList API v2
// Client calls /api/mal-proxy/users/@me/animelist?status=watching
// → server forwards to https://api.myanimelist.net/v2/users/@me/animelist?status=watching

export default defineEventHandler(async (event) => {
  // Extract the MAL API path from the URL
  // e.g., /api/mal-proxy/users/@me/animelist → users/@me/animelist
  const malPath = event.path.replace(/^\/api\/mal-proxy\/?/, '')
  const malUrl = `https://api.myanimelist.net/v2/${malPath}`

  console.log(`[mal-proxy] ${event.method} ${event.path} → ${malUrl}`)

  // Read the access token from the client's Authorization header
  const authHeader = getHeader(event, 'authorization') || getHeader(event, 'x-mal-token')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing MAL access token',
    })
  }

  // Forward the request to MAL
  const headers: Record<string, string> = {
    Authorization: authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`,
  }

  // Forward Content-Type only for requests with a body
  const hasBody = event.method !== 'GET' && event.method !== 'HEAD'
  if (hasBody) {
    const contentType = getHeader(event, 'content-type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }
  }

  try {
    const response = await fetch(malUrl, {
      method: event.method,
      headers,
      body: hasBody ? await readRawBody(event) : undefined,
    })

    const responseBody = await response.text()

    setResponseStatus(event, response.status)

    // Forward relevant response headers
    const responseContentType = response.headers.get('content-type')
    if (responseContentType) {
      setResponseHeader(event, 'content-type', responseContentType)
    }

    try {
      return JSON.parse(responseBody)
    } catch {
      return responseBody
    }
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `MAL API proxy error: ${err.message}`,
    })
  }
})
