// POST /api/mal-token-exchange
// Proxies the MAL OAuth2 token exchange to avoid CORS issues
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const body = await readBody<{
    client_id: string
    code: string
    redirect_uri: string
    code_verifier: string
    grant_type: string
  }>(event)

  if (!body.client_id || !body.code || !body.redirect_uri || !body.code_verifier) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters',
    })
  }

  const params = new URLSearchParams({
    client_id: body.client_id,
    client_secret: config.malClientSecret,
    code: body.code,
    redirect_uri: body.redirect_uri,
    code_verifier: body.code_verifier,
    grant_type: body.grant_type || 'authorization_code',
  })

  const response = await fetch('https://myanimelist.net/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await response.text()

  // Forward the status code and body back to the client
  setResponseStatus(event, response.status)

  try {
    // MAL returns JSON (even errors)
    return JSON.parse(data)
  } catch {
    return { error: data }
  }
})

