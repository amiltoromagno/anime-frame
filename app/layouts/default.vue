<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <header class="navbar bg-base-100/80 backdrop-blur-lg border-b border-base-content/5 sticky top-0 z-50">
      <div class="navbar-start">
        <!-- Mobile menu -->
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-200 rounded-box z-10 mt-3 w-52 p-2 shadow-lg">
            <li><NuxtLink to="/" class="font-medium">Home</NuxtLink></li>
            <li><NuxtLink to="/browse" class="font-medium">Browse</NuxtLink></li>
            <li><NuxtLink to="/seasonal" class="font-medium">Seasonal</NuxtLink></li>
            <li v-if="isAuthenticated"><NuxtLink to="/mylist" class="font-medium">My List</NuxtLink></li>
          </ul>
        </div>
        <!-- Logo -->
        <NuxtLink to="/" class="btn btn-ghost text-xl gap-2 font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="text-primary hidden sm:inline">Anime Frame</span>
        </NuxtLink>
      </div>

      <!-- Desktop nav -->
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1 gap-1">
          <li>
            <NuxtLink to="/" class="font-medium rounded-lg" active-class="bg-primary/10 text-primary">
              Home
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/browse" class="font-medium rounded-lg" active-class="bg-primary/10 text-primary">
              Browse
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/seasonal" class="font-medium rounded-lg" active-class="bg-primary/10 text-primary">
              Seasonal
            </NuxtLink>
          </li>
          <li v-if="isAuthenticated">
            <NuxtLink to="/mylist" class="font-medium rounded-lg" active-class="bg-primary/10 text-primary">
              My List
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="navbar-end gap-2">
        <!-- Title preference toggle -->
        <button
          class="btn btn-ghost btn-sm font-bold tracking-wide gap-1 px-2"
          @click="toggleTitlePref"
          :aria-label="titlePref === 'english' ? 'Switch to romaji titles' : 'Switch to English titles'"
        >
          <span :class="titlePref === 'english' ? 'text-primary' : 'opacity-40'" class="text-xs transition-all">EN</span>
          <span class="opacity-20 text-xs">/</span>
          <span :class="titlePref === 'romaji' ? 'text-primary' : 'opacity-40'" class="text-sm transition-all">あ</span>
        </button>

        <!-- Theme toggle -->
        <button
          class="btn btn-ghost btn-circle swap swap-rotate"
          @click="toggleTheme"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <!-- Sun icon -->
          <svg
            :class="['h-5 w-5 transition-all duration-300', isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90 absolute']"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <!-- Moon icon -->
          <svg
            :class="['h-5 w-5 transition-all duration-300', !isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90 absolute']"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <!-- User area -->
        <template v-if="authLoading">
          <span class="loading loading-spinner loading-xs" />
        </template>
        <template v-else-if="isAuthenticated && user">
          <!-- My List (icon for mobile) -->
          <NuxtLink to="/mylist" class="btn btn-ghost btn-sm btn-square lg:hidden" aria-label="My List">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 14l2 2 4-4"/></svg>
          </NuxtLink>

          <!-- User dropdown -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-2 px-2">
              <div class="avatar">
                <div class="w-6 rounded-full">
                  <img :src="user.picture" :alt="user.name" />
                </div>
              </div>
              <span class="font-medium text-sm hidden sm:inline max-w-25 truncate">{{ user.name }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 opacity-50 hidden sm:inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <ul tabindex="0" class="dropdown-content menu menu-sm bg-base-200 rounded-box z-10 mt-3 w-48 p-2 shadow-lg">
              <li class="menu-title"><span>{{ user.name }}</span></li>
              <li><NuxtLink to="/mylist" class="font-medium">My List</NuxtLink></li>
              <li><a :href="`https://myanimelist.net/animelist/${user.name}`" target="_blank" class="font-medium">View on MAL</a></li>
              <li><button @click="handleLogout" class="text-error font-medium">Sign Out</button></li>
            </ul>
          </div>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn btn-primary btn-sm font-semibold">
            Sign In
          </NuxtLink>
        </template>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="footer footer-center bg-base-200 text-base-content p-6 border-t border-base-content/5">
      <aside>
        <p class="text-sm opacity-70">Powered by
          <a href="https://jikan.moe/" target="_blank" class="link link-primary">Jikan API</a>
        </p>
      </aside>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { toggleTheme, initTheme, isDark } = useTheme()
const { titlePref, toggleTitlePref } = useTitlePreference()
const { isAuthenticated, user, authLoading, initAuth, logout } = useAuth()
const { fetchFullList } = useUserAnimeList()

onMounted(async () => {
  initTheme()
  // Initialize auth from stored tokens
  await initAuth()
  // Preload user's anime list for status indicators
  if (isAuthenticated.value) {
    fetchFullList()
  }
})

async function handleLogout() {
  await logout()
  await navigateTo('/')
}
</script>
