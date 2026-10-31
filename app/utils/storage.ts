// ============================================================
// appStorage — persistent key/value storage
// ============================================================
//
// Web:      localStorage (same keys the app has always used).
// Android:  capacitor-secure-storage-plugin, which is backed by
//           EncryptedSharedPreferences/Keystore on the device.
//
// The plugin is imported lazily so it never lands in the SSR bundle.

import { isNativeApp } from '~/utils/platform'

async function secureStorage() {
  const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin')
  return SecureStoragePlugin
}

export const appStorage = {
  async get(key: string): Promise<string | null> {
    if (await isNativeApp()) {
      try {
        const { value } = await (await secureStorage()).get({ key })
        return value ?? null
      } catch {
        // The plugin rejects when the key does not exist.
        return null
      }
    }

    if (!import.meta.client) return null
    return localStorage.getItem(key)
  },

  async set(key: string, value: string): Promise<void> {
    if (await isNativeApp()) {
      await (await secureStorage()).set({ key, value })
      return
    }

    if (import.meta.client) localStorage.setItem(key, value)
  },

  async remove(key: string): Promise<void> {
    if (await isNativeApp()) {
      try {
        await (await secureStorage()).remove({ key })
      } catch {
        // Already absent.
      }
      return
    }

    if (import.meta.client) localStorage.removeItem(key)
  },
}
