export default defineNuxtPlugin(async () => {
  if (!import.meta.dev || !import.meta.client) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(registration => registration.unregister()))

    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map(cacheKey => caches.delete(cacheKey)))
    }
  }
  catch {
    // Ignore cleanup errors in development.
  }
})
