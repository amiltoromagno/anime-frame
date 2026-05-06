// POST /api/mal-token-refresh
// Proxies the MAL OAuth2 token refresh to avoid CORS issues
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const body = await readBody<{
    refresh_token: string
    client_id: string
  }>(event)

  if (!body.refresh_token || !body.client_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters',
    })
  }

  const params = new URLSearchParams({
    client_id: body.client_id,
    client_secret: config.malClientSecret,
    grant_type: 'refresh_token',
    refresh_token: body.refresh_token,
  })

  const response = await fetch('https://myanimelist.net/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await response.text()
  setResponseStatus(event, response.status)

  try {
    return JSON.parse(data)
  } catch {
    return { error: data }
  }
})
