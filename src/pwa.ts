// PWA service worker DISABLED during active development.
//
// The auto-updating Workbox SW was precaching every html/js/css file and
// serving stale copies — old styling plus HTML that referenced island JS
// chunks whose hashes changed on rebuild (so the Estimator/BookingForm
// islands silently failed to load). Until launch we unregister any existing
// service worker and wipe its caches so the browser always gets the current
// build. Re-enable by restoring registerSW() once the site is stable.

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })
    .catch(() => {})

  if (window.caches) {
    caches
      .keys()
      .then((keys) => keys.forEach((key) => caches.delete(key)))
      .catch(() => {})
  }
}
