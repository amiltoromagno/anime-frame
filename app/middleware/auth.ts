export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const { isAuthenticated, authLoading, initAuth } = useAuth()

  // Ensure auth is initialized
  if (authLoading.value) {
    await initAuth()
  }

  if (!isAuthenticated.value) {
    // Save the intended destination so we can redirect back after login
    sessionStorage.setItem('animeframe-redirect-to', to.fullPath)
    return navigateTo('/login')
  }
})
