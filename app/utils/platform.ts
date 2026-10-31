// ============================================================
// Platform helpers
// ============================================================

/**
 * True when the app is running inside a Capacitor native shell
 * (Android today, iOS if it is ever added). Always false during SSR.
 *
 * Capacitor is imported lazily so the server bundle never evaluates it.
 */
export async function isNativeApp(): Promise<boolean> {
  if (!import.meta.client) return false
  const { Capacitor } = await import('@capacitor/core')
  return Capacitor.isNativePlatform()
}
