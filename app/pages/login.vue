<template>
  <div class="min-h-screen flex" data-theme="dark">
    <!-- Left panel - Decorative -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <!-- Animated background -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-base-300 to-secondary/20" />

      <!-- Decorative pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E'); " />
      </div>

      <!-- Content -->
      <div class="relative flex flex-col justify-center items-center p-12 w-full">
        <!-- Floating anime cards decoration -->
        <div class="relative w-full max-w-md aspect-square mb-8">
          <!-- Card 1 -->
          <div class="absolute top-0 left-8 w-36 h-52 rounded-xl bg-base-100 shadow-2xl shadow-primary/20 border border-base-content/10 overflow-hidden transform -rotate-12 hover:rotate-0 transition-transform duration-500">
            <div class="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary/50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="absolute top-12 right-4 w-40 h-56 rounded-xl bg-base-100 shadow-2xl shadow-secondary/20 border border-base-content/10 overflow-hidden transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <div class="w-full h-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-14 w-14 text-secondary/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-44 h-60 rounded-xl bg-base-100 shadow-2xl shadow-accent/20 border border-base-content/10 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <div class="w-full h-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Text -->
        <div class="text-center">
          <h2 class="text-3xl font-extrabold mb-3">
            Track Your <span class="text-gradient">Anime Journey</span>
          </h2>
          <p class="text-base-content/60 max-w-sm mx-auto">
            Join thousands of anime fans who organize, rate, and discover anime with Anime Frame.
          </p>
        </div>
      </div>
    </div>

    <!-- Right panel - Login form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-base-100">
      <div class="w-full max-w-md">
        <!-- Brand -->
        <div class="text-center mb-8">
          <NuxtLink to="/" class="inline-flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="text-3xl font-extrabold text-gradient">Anime Frame</span>
          </NuxtLink>
          <h1 class="text-2xl font-bold mb-2">Welcome back!</h1>
          <p class="text-base-content/60 text-sm">Sign in to continue tracking your anime</p>
        </div>

        <!-- Already authenticated -->
        <div v-if="isAuthenticated" class="text-center space-y-4">
          <div class="avatar">
            <div class="w-16 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
              <img :src="user?.picture" :alt="user?.name" />
            </div>
          </div>
          <p class="font-semibold text-lg">Signed in as {{ user?.name }}</p>
          <p class="text-base-content/60 text-sm">You're already signed in with MyAnimeList.</p>
          <div class="flex gap-3 justify-center">
            <NuxtLink to="/" class="btn btn-primary btn-sm rounded-full">Go Home</NuxtLink>
            <NuxtLink to="/mylist" class="btn btn-outline btn-sm rounded-full">My List</NuxtLink>
            <button @click="handleLogout" class="btn btn-ghost btn-sm">Sign Out</button>
          </div>
        </div>

        <!-- Login with MAL -->
        <div v-else class="space-y-6">
          <!-- MAL OAuth Button -->
          <button
            @click="handleLogin"
            :disabled="loginLoading"
            class="btn btn-primary w-full font-semibold text-base gap-3 h-14"
            :class="{ 'opacity-70': loginLoading }"
          >
            <svg v-if="!loginLoading" class="h-6 w-6 shrink-0" viewBox="0 0 48 48" fill="currentColor">
              <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 28l-8-8 1.41-1.41L20 29.17l14.59-14.58L36 16l-16 16z" fill="currentColor"/>
            </svg>
            <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ loginLoading ? 'Redirecting...' : 'Sign in with MyAnimeList' }}
          </button>

          <!-- Info -->
          <div class="bg-base-200 rounded-xl p-4 text-sm text-base-content/70 space-y-2">
            <p class="font-semibold text-base-content">Why sign in?</p>
            <ul class="space-y-1.5">
              <li class="flex items-start gap-2">
                <svg class="h-4 w-4 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Track what you're watching
              </li>
              <li class="flex items-start gap-2">
                <svg class="h-4 w-4 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Score and review anime
              </li>
              <li class="flex items-start gap-2">
                <svg class="h-4 w-4 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Sync your MAL list automatically
              </li>
              <li class="flex items-start gap-2">
                <svg class="h-4 w-4 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Discover new anime tailored to you
              </li>
            </ul>
          </div>

          <!-- Config warning -->
          <p v-if="!clientIdConfigured" class="text-xs text-center text-warning">
            ⚠ MyAnimeList Client ID not configured. Set <code class="bg-base-200 px-1 rounded">NUXT_PUBLIC_MAL_CLIENT_ID</code> in your <code class="bg-base-200 px-1 rounded">.env</code> file.
          </p>
        </div>

        <!-- Divider -->
        <div class="divider text-xs text-base-content/40 my-6">POWERED BY</div>

        <!-- MAL logo -->
        <p class="text-center text-sm text-base-content/50">
          <a href="https://myanimelist.net" target="_blank" class="link link-primary font-semibold">MyAnimeList</a>
          &nbsp;— data is synced directly with your MAL account
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const config = useRuntimeConfig()
const { login, logout, isAuthenticated, user } = useAuth()
const loginLoading = ref(false)
const clientIdConfigured = computed(() => !!config.public.malClientId)

useHead({
  title: 'Sign In — Anime Frame',
})

async function handleLogin() {
  loginLoading.value = true
  // Save current page as redirect target
  const route = useRoute()
  if (route.query.redirect) {
    sessionStorage.setItem('animeframe-redirect-to', route.query.redirect as string)
  }
  await login()
  // login() redirects the browser, so we won't reach here
}

async function handleLogout() {
  await logout()
  await navigateTo('/login')
}
</script>
