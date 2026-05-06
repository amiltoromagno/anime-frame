<script setup lang="ts">
definePageMeta({
  layout: false,
})

const route = useRoute()
const { handleCallback } = useAuth()

const status = ref<'processing' | 'error' | 'success'>('processing')
const errorMessage = ref('Something went wrong while signing in.')
const debugInfo = ref('')

onMounted(async () => {
  const code = route.query.code as string | undefined
  const state = route.query.state as string | undefined

  // Log query params for debugging
  console.log('[Callback] Route query:', { code: code?.slice(0, 8) + '...', state: state?.slice(0, 8) + '...', all: route.query })

  // MAL may also pass an error query param
  if (route.query.error) {
    status.value = 'error'
    errorMessage.value = `Authorization denied: ${route.query.error_description || route.query.error}`
    debugInfo.value = `error=${route.query.error}`
    return
  }

  if (!code || !state) {
    status.value = 'error'
    errorMessage.value = 'Invalid callback — missing authorization code or state parameter.'
    debugInfo.value = `code=${!!code} state=${!!state}`
    return
  }

  const result = await handleCallback(code, state)
  if (result === true) {
    status.value = 'success'
    // Restore where the user was heading, or go home
    const redirectTo = sessionStorage.getItem('animeframe-redirect-to') || '/'
    sessionStorage.removeItem('animeframe-redirect-to')
    await navigateTo(redirectTo, { replace: true })
  } else {
    status.value = 'error'
    errorMessage.value = result || 'Failed to complete sign in. Your session may have expired. Please try again.'
    debugInfo.value = `code=${code.slice(0, 8)}... state=${state.slice(0, 8)}...`
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100">
    <div class="text-center">
      <!-- Success spinner -->
      <template v-if="status === 'processing'">
        <div class="loading loading-spinner loading-lg text-primary mb-4" />
        <h1 class="text-xl font-bold">Completing sign in...</h1>
        <p class="text-base-content/60 mt-2">You'll be redirected shortly.</p>
      </template>

      <!-- Error -->
      <template v-else-if="status === 'error'">
        <div class="text-5xl mb-4">😵</div>
        <h1 class="text-xl font-bold">Sign in failed</h1>
        <p class="text-base-content/60 mt-2 max-w-sm">{{ errorMessage }}</p>
        <p v-if="debugInfo" class="text-xs text-base-content/30 mt-4 font-mono">{{ debugInfo }}</p>
        <NuxtLink to="/login" class="btn btn-primary btn-sm mt-6 rounded-full">
          Try again
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

