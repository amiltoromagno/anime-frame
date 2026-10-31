import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

// ============================================================
// Android hardware back button
// ============================================================
//
// Default Capacitor behaviour is to close the app. We want the
// convention users expect: walk back through the router when there is
// history, otherwise exit.

export default defineNuxtPlugin(() => {
  if (Capacitor.getPlatform() !== 'android') return

  const router = useRouter()

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      router.back()
      return
    }

    void App.exitApp()
  })
})
