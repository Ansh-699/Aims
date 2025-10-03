// Service Worker for background attendance data fetching
const CACHE_NAME = 'attendance-cache-v1';
const API_CACHE_NAME = 'attendance-api-cache-v1';

// Cache duration in milliseconds
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Background sync for attendance data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-attendance-sync') {
    console.log('[SW] Background sync triggered for attendance');
    event.waitUntil(backgroundFetchAttendance());
  }
});

// Intercept fetch requests for attendance API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle attendance API requests
  if (url.pathname === '/api/all-attendance') {
    event.respondWith(handleAttendanceRequest(event.request));
  }
});

async function handleAttendanceRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cacheKey = getCacheKey(request);
  
  try {
    // Try to get from cache first
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
      
      // If cache is fresh, return it immediately
      if (cacheAge < CACHE_DURATION) {
        console.log('[SW] Returning fresh cached response');
        return new Response(JSON.stringify(cachedData), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // If cache is stale, return it but fetch new data in background
      console.log('[SW] Returning stale cache, fetching fresh data');
      fetchAndCache(request, cache, cacheKey);
      
      return new Response(JSON.stringify({
        ...cachedData,
        isStale: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No cache, fetch fresh data
    console.log('[SW] No cache found, fetching fresh data');
    return await fetchAndCache(request, cache, cacheKey);
    
  } catch (error) {
    console.error('[SW] Error handling attendance request:', error);
    
    // Try to return stale cache on error
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      return new Response(JSON.stringify({
        ...cachedData,
        isStale: true,
        error: 'Network error, showing cached data'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No cache available, return error
    return new Response(JSON.stringify({
      error: 'Network error and no cached data available'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchAndCache(request, cache, cacheKey) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const data = await response.json();
      
      // Cache the response
      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      }));
      
      console.log('[SW] Cached fresh attendance data');
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    throw error;
  }
}

function getCacheKey(request) {
  // Create a cache key based on the authorization header
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return `attendance-${token.slice(-10)}`;
}

async function backgroundFetchAttendance() {
  try {
    // Get all clients (open tabs)
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      // Send message to client to trigger background fetch
      client.postMessage({
        type: 'BACKGROUND_FETCH_ATTENDANCE'
      });
    }
  } catch (error) {
    console.error('[SW] Background fetch error:', error);
  }
}

// Periodic background sync (when supported)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  // Register for background sync every 5 minutes when the page is active
  setInterval(() => {
    self.registration.sync.register('background-attendance-sync');
  }, 5 * 60 * 1000);
}