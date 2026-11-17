/**
 * Service Worker for Personal Growth Dashboard PWA
 * 
 * Caching Strategy:
 * - App Shell (HTML, JS, CSS): Cache-first with update check
 * - Manifest & Encrypted Data: Network-first (always fetch latest)
 * - Images/Fonts: Cache-first
 * 
 * Security:
 * - NEVER cache passwords, keys, or decrypted content
 * - NEVER cache blob: URLs (in-memory decrypted images)
 * - Only cache encrypted .enc files and public assets
 */

const CACHE_VERSION = 'v1';
const CACHE_SHELL = `shell-${CACHE_VERSION}`;
const CACHE_DATA = `data-${CACHE_VERSION}`;
const CACHE_STATIC = `static-${CACHE_VERSION}`;

// Files to precache for offline (app shell)
const SHELL_FILES = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: Precache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_SHELL).then(async (cache) => {
      console.log('[SW] Caching shell files');
      // Cache files one by one to handle failures gracefully
      for (const url of SHELL_FILES) {
        try {
          await cache.add(new Request(url, { cache: 'reload' }));
          console.log('[SW] Cached:', url);
        } catch (err) {
          console.warn('[SW] Failed to cache:', url, err);
          // Continue with other files
        }
      }
      console.log('[SW] Shell caching complete, skipping waiting');
      return self.skipWaiting(); // Activate immediately
    })
    .catch(err => {
      console.error('[SW] Install failed:', err);
      // Don't throw - allow SW to install even if caching fails
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches not matching current version
          if (!cacheName.startsWith(CACHE_VERSION.split('-')[0])) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim(); // Take control immediately
    })
    .catch(err => {
      console.error('[SW] Activation failed:', err);
    })
  );
});

// Fetch: Route requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // NEVER cache blob: URLs (decrypted in-memory content)
  if (url.protocol === 'blob:') {
    return; // Let browser handle normally
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Route based on request type
  if (isManifestOrData(url)) {
    // Network-first for manifest and encrypted data (always fetch latest)
    event.respondWith(networkFirstStrategy(request, CACHE_DATA));
  } else if (isAppShell(url)) {
    // Cache-first for app shell with background update
    event.respondWith(cacheFirstWithUpdate(request, CACHE_SHELL));
  } else if (isStaticAsset(url)) {
    // Cache-first for static assets (fonts, etc.)
    event.respondWith(cacheFirstStrategy(request, CACHE_STATIC));
  } else {
    // Default: Network-first for everything else
    event.respondWith(networkFirstStrategy(request, CACHE_STATIC));
  }
});

// Message handler: Check for updates, clear cache, etc.
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Trigger update check
    event.waitUntil(
      self.registration.update().then(() => {
        event.ports[0].postMessage({ type: 'UPDATE_CHECKED' });
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear all caches
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      }).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Activate new service worker immediately
    self.skipWaiting();
  }
});

/** Helper: Check if URL is manifest or encrypted data */
function isManifestOrData(url) {
  return (
    url.pathname === '/data/manifest.json' ||
    url.pathname.startsWith('/data/encrypted/') ||
    url.pathname.match(/\/data\/.*\.enc$/)
  );
}

/** Helper: Check if URL is app shell (HTML, JS, CSS) */
function isAppShell(url) {
  return (
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.mjs')
  );
}

/** Helper: Check if URL is static asset */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)
  );
}

/** Strategy: Network-first, fall back to cache */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses (200-299)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (err) {
    // Network failed, try cache
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add custom header to indicate offline
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Offline-Response', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // No cache either, return error
    return new Response('Offline and no cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/** Strategy: Cache-first, fall back to network */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (err) {
    console.error('[SW] Fetch failed:', request.url, err);
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/** Strategy: Cache-first with background update */
async function cacheFirstWithUpdate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Start network request in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(err => {
    console.log('[SW] Background update failed:', request.url);
    return null;
  });
  
  // Return cached immediately, or wait for network
  return cachedResponse || fetchPromise;
}

console.log('[SW] Service worker loaded');
