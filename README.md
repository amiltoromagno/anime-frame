# Anime Frame

A MyAnimeList client built with Nuxt 4. It uses the **official MyAnimeList API v2**
for both the public catalog and your personal list — no third-party data layer.

## How it works

| Concern | Implementation |
| --- | --- |
| Public catalog | `/api/mal-public/**` → MAL API v2, authenticated with the app's client ID (`X-MAL-CLIENT-ID`). MAL sends no CORS headers, so the browser always talks to this server route. |
| Sign in | OAuth2 + PKCE against MyAnimeList. The token exchange and refresh happen server-side so the client secret never reaches the browser. |
| Your list | `/api/mal-proxy/**` → MAL API v2 with the user's bearer token. Reads, updates and deletes go through it. |
| Catalog caching | The client keeps responses for 5 minutes and deduplicates in-flight requests; the proxy sends `Cache-Control` headers. |

## Setup

Install dependencies:

```bash
npm install
```

Create a MyAnimeList API client at <https://myanimelist.net/apiconfig>, then
copy the environment template and fill it in:

```bash
cp .env.example .env
```

```dotenv
NUXT_PUBLIC_MAL_CLIENT_ID=your_client_id_here
NUXT_PUBLIC_MAL_REDIRECT_URI=http://localhost:3000/auth/callback
NUXT_MAL_CLIENT_SECRET=your_client_secret_here
```

The redirect URI in `.env` must exactly match the one registered in the MAL app.

## Development

```bash
npm run dev
```

The app runs on <http://localhost:3000>.

## Build

```bash
npm run build
```

The project targets Cloudflare Pages (`cloudflare_pages` preset, output in `dist`).
For production, set `NUXT_MAL_CLIENT_SECRET` as a secret in the Cloudflare
dashboard — never commit it.

## API limitations

The official API deliberately exposes a smaller catalog than the website. The
app therefore does **not** include character/voice-actor listings, opening/ending
themes, streaming links or trailers, and Browse supports title search plus
rankings rather than genre/format filters. These are limits of the API, not
missing UI.
