/* eslint-disable no-restricted-globals */
const STATIC_CACHE  = 'lp-static-v1'
const DYNAMIC_CACHE = 'lp-dynamic-v1'
const CORE_ASSETS   = ['/', '/index.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(CORE_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (!req.url.startsWith(self.location.origin)) return
  const url = new URL(req.url)

  // Cache-first: static assets and lesson JSON
  if (url.pathname.startsWith('/assets/') || url.pathname.includes('/content/')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached
        return fetch(req).then(resp => {
          caches.open(DYNAMIC_CACHE).then(c => c.put(req, resp.clone())).catch(() => {})
          return resp
        }).catch(() => cached)
      })
    )
    return
  }

  // Network-first: HTML
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req).catch(() => caches.match(req)).then(r => r || null)
    )
    return
  }
})
