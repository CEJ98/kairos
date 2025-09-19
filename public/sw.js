// Service Worker para Kairos Fitness PWA
const CACHE_NAME = 'kairos-fitness-v1.0.0'
const STATIC_CACHE = 'kairos-static-v1.0.0'
const DYNAMIC_CACHE = 'kairos-dynamic-v1.0.0'
const IMAGE_CACHE = 'kairos-images-v1.0.0'

// Archivos críticos para cachear
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/auth/login',
  '/manifest.json',
  '/offline.html',
  // CSS y JS críticos se cachearán automáticamente por Next.js
]

// Rutas de la API que se pueden cachear
const CACHEABLE_API_ROUTES = [
  '/api/exercises',
  '/api/workouts',
  '/api/progress'
]

// Estrategias de caché
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Configuración de rutas y estrategias
const ROUTE_STRATEGIES = {
  // Archivos estáticos - Cache First
  static: {
    pattern: /\.(js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 // 30 días
  },
  
  // Páginas - Stale While Revalidate
  pages: {
    pattern: /^https:\/\/[^\/]+\/(?!api\/)/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 // 1 día
  },
  
  // API que cambia poco - Network First con fallback
  staticAPI: {
    pattern: /\/api\/(exercises|workouts\/templates|categories)/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: DYNAMIC_CACHE,
    maxAge: 60 * 60 // 1 hora
  },
  
  // API dinámicas - Network Only
  dynamicAPI: {
    pattern: /\/api\/(progress|community|notifications|billing)/,
    strategy: CACHE_STRATEGIES.NETWORK_ONLY
  },
  
  // Imágenes - Cache First con límite
  images: {
    pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: IMAGE_CACHE,
    maxAge: 7 * 24 * 60 * 60, // 7 días
    maxEntries: 100
  }
}

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Service Worker: Error caching static files', error)
      })
  )
})

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== IMAGE_CACHE
            })
            .map(cacheName => {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      
      // Tomar control de todas las pestañas
      self.clients.claim()
    ])
  )
})

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Solo manejar requests HTTP/HTTPS del mismo origen
  if (!request.url.startsWith('http') || url.origin !== location.origin) {
    return
  }
  
  // Determinar estrategia basada en la URL
  const strategy = getStrategyForRequest(request)
  
  if (strategy) {
    event.respondWith(handleRequest(request, strategy))
  }
})

// Determinar estrategia de caché para request
function getStrategyForRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // Comprobar cada patrón
  for (const [name, config] of Object.entries(ROUTE_STRATEGIES)) {
    if (config.pattern.test(pathname) || config.pattern.test(request.url)) {
      return config
    }
  }
  
  // Estrategia por defecto para páginas
  return ROUTE_STRATEGIES.pages
}

// Manejar request según estrategia
async function handleRequest(request, strategy) {
  const { cacheName, maxAge, maxEntries } = strategy
  
  switch (strategy.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge, maxEntries)
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge)
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge)
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request)
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, cacheName)
      
    default:
      return fetch(request)
  }
}

// Estrategia Cache First
async function cacheFirst(request, cacheName, maxAge, maxEntries) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Limpiar caché si excede el límite
      if (maxEntries) {
        await limitCacheSize(cacheName, maxEntries)
      }
      
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback a caché aunque esté expirado
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Última opción: página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }
    
    throw error
  }
}

// Estrategia Network First
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse
    }
    
    throw error
  }
}

// Estrategia Stale While Revalidate
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Actualizar en background
  const networkPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(error => {
      console.error('SW: Background update failed', error)
    })
  
  // Devolver caché si está disponible
  if (cachedResponse) {
    // Disparar actualización en background
    networkPromise
    return cachedResponse
  }
  
  // Si no hay caché, esperar network
  try {
    return await networkPromise
  } catch (error) {
    // Fallback a página offline si es document
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }
    throw error
  }
}

// Estrategia Network Only
async function networkOnly(request) {
  return fetch(request)
}

// Estrategia Cache Only
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName)
  return cache.match(request)
}

// Verificar si respuesta está expirada
function isExpired(response, maxAge) {
  if (!maxAge) return false
  
  const dateHeader = response.headers.get('date')
  if (!dateHeader) return false
  
  const date = new Date(dateHeader)
  const now = new Date()
  
  return (now - date) > (maxAge * 1000)
}

// Limitar tamaño del caché
async function limitCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxEntries) {
    // Eliminar las más antiguas
    const keysToDelete = keys.slice(0, keys.length - maxEntries)
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
  }
}

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('SW: Push received')
  
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Tienes una nueva notificación de Kairos Fitness',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'kairos-notification',
      timestamp: Date.now(),
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/action-view.svg'
        },
        {
          action: 'dismiss',
          title: 'Cerrar',
          icon: '/icons/action-dismiss.svg'
        }
      ],
      data: {
        url: data.url || '/dashboard',
        timestamp: Date.now()
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Kairos Fitness', options)
    )
  } catch (error) {
    console.error('SW: Error showing notification', error)
  }
})

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('SW: Notification clicked')
  
  const notification = event.notification
  const action = event.action
  const data = notification.data
  
  notification.close()
  
  if (action === 'dismiss') {
    return
  }
  
  // Abrir/enfocar ventana
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const url = data?.url || '/dashboard'
        
        // Buscar si ya hay una ventana abierta con la app
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        
        // Abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Background Sync para datos offline
self.addEventListener('sync', event => {
  console.log('SW: Background sync triggered')
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí se sincronizarían datos pendientes
      syncPendingData()
    )
  }
})

// Función para sincronizar datos pendientes
async function syncPendingData() {
  try {
    // Obtener datos pendientes del IndexedDB
    // Enviar al servidor
    console.log('SW: Syncing pending data...')
    
    // Notificar a la app que se completó la sincronización
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('SW: Error syncing data', error)
  }
}

// Manejar mensajes de la app
self.addEventListener('message', event => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_UPDATE':
      // Forzar actualización de caché específico
      event.waitUntil(updateCache(payload.url))
      break
      
    default:
      console.log('SW: Unknown message type', type)
  }
})

// Actualizar caché específico
async function updateCache(url) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const response = await fetch(url)
    
    if (response.ok) {
      await cache.put(url, response)
      console.log('SW: Cache updated for', url)
    }
  } catch (error) {
    console.error('SW: Error updating cache for', url, error)
  }
}