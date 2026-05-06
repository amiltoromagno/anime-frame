// GET /api/mal-user
// Proxies the MAL /users/@me request to avoid CORS issues
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid Authorization header',
    })
  }

  const response = await fetch('https://api.myanimelist.net/v2/users/@me', {
    headers: {
      Authorization: authHeader,
    },
  })

  const data = await response.text()
  setResponseStatus(event, response.status)

  try {
    return JSON.parse(data)
  } catch {
    return { error: data }
  }
})
