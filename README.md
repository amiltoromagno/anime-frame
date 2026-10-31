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

## Android app (Capacitor)

The Android build is a static SPA packaged with Capacitor. Cloudflare remains
the API backend; the client secret never ships inside the app.

### One-time MAL configuration

Add this redirect URI to the MAL API app, next to the web callback:

```text
animeframe://auth/callback
```

Android returns to the app through that custom scheme
(`app/plugins/native-deeplink.client.ts`).

### Prerequisites

- JDK 21
- Android SDK 36 (Android Studio or command-line tools)
- `ANDROID_HOME` pointing at the SDK

### Build and run

```bash
npm run android:sync      # static SPA build + npx cap sync android
npm run android:open      # open android/ in Android Studio
npm run android:run       # build + install on a connected device/emulator
```

Or build an APK from the command line:

```bash
npm run android:apk
# android/app/build/outputs/apk/debug/app-debug.apk

adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Release builds need a keystore and a signing config in
`android/app/build.gradle`.

### API origin and CORS

`npm run build:mobile` bakes in `NUXT_PUBLIC_API_BASE` (default
`https://anime-frame.pages.dev`). The Capacitor WebView origin is
`https://localhost`, which `server/middleware/cors.ts` allowlists. For live
reload, add the LAN dev-server origin:

```dotenv
NUXT_CORS_ALLOWED_ORIGINS=http://192.168.1.10:3000
```

### First run

The APK talks to the deployed backend, so deploy the updated web app before
installing it. Then:

1. Add `animeframe://auth/callback` to the MAL app's redirect URIs.
2. Install `android/app/build/outputs/apk/debug/app-debug.apk`
   (`npm run android:install`).
3. Sign in.

If catalog pages stay empty, the deployed backend is stale or rejecting the
`https://localhost` origin in `server/middleware/cors.ts`.

### Notes

- The application ID is `dev.animeframe.app` in `capacitor.config.ts`; change
  it before the first release if desired.
- Tokens are stored with Android Keystore-backed secure storage
  (`capacitor-secure-storage-plugin`), not `localStorage`.
- `MOBILE_BUILD=true` switches Nuxt to SPA mode and the `static` Nitro preset.
- The hardware back button walks the router history before exiting
  (`app/plugins/android-back.client.ts`).

## API limitations

The official API deliberately exposes a smaller catalog than the website. The
app therefore does **not** include character/voice-actor listings, opening/ending
themes, streaming links or trailers, and Browse supports title search plus
rankings rather than genre/format filters. These are limits of the API, not
missing UI.
