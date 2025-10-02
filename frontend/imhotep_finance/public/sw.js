const CACHE_NAME = 'imhotep-finance-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/register',
  '/profile',
  '/dashboard',
  '/show_trans',
  '/show_networth_details',
  '/wishlist',
  '/show_scheduled_trans',
  '/show-target-history',
  '/monthly-reports',
  '/imhotep_finance.png',
  '/icon-monochrome.png',
  '/manifest.json'
];

const RUNTIME_CACHE = 'imhotep-finance-runtime-v1';
const API_CACHE = 'imhotep-finance-api-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_CACHE_URLS);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notify all clients that the service worker is ready
      return self.clients.claim();
    }).then(() => {
      // Send message to all clients that SW is activated
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED' });
        });
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone response for caching
          const responseToCache = response.clone();
          
          // Cache successful responses
          if (response.ok) {
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request).then(cached => {
            if (cached) {
              return cached;
            }
            
            // Return a custom offline API response
            return new Response(
              JSON.stringify({ 
                error: 'Network unavailable',
                offline: true,
                message: 'You appear to be offline. Please check your connection and try again.'
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle navigation requests with cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache different types of resources in appropriate caches
          const cacheToUse = STATIC_CACHE_URLS.includes(url.pathname) ? CACHE_NAME : RUNTIME_CACHE;
          
          caches.open(cacheToUse)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/') || 
                   new Response(
                     generateOfflinePage(),
                     {
                       headers: { 'Content-Type': 'text/html' }
                     }
                   );
          }
          
          // For images, return a placeholder
          if (request.destination === 'image') {
            return new Response(
              '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="14">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});

// Generate offline page HTML
function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Imhotep Finance - Offline</title>
        <link rel="icon" href="/favicon.png">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ed7143 0%, #ff6b6b 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 20px;
          }
          
          .offline-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 48px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideUp 0.6s ease-out;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .offline-icon {
            font-size: 5rem;
            margin-bottom: 24px;
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .offline-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(45deg, #fff, #f8fafc);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .offline-subtitle {
            font-size: 1.125rem;
            margin-bottom: 8px;
            opacity: 0.9;
            font-weight: 600;
          }
          
          .offline-message {
            font-size: 1rem;
            margin-bottom: 32px;
            opacity: 0.8;
            line-height: 1.6;
          }
          
          .button-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .retry-button {
            background: linear-gradient(135deg, #fff, #f1f5f9);
            color: #ed7143;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          }
          
          .go-home-button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
          }
          
          .go-home-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
          
          .chef-logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }
          
          @media (max-width: 640px) {
            .offline-container {
              padding: 32px 24px;
              margin: 16px;
            }
            
            .offline-title {
              font-size: 2rem;
            }
            
            .button-group {
              gap: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="chef-logo">👨‍🍳</div>
          <div class="offline-icon">🔌</div>
          <h1 class="offline-title">You're Offline</h1>
          <h2 class="offline-subtitle">No Internet Connection</h2>
          <p class="offline-message">
            It looks like you're not connected to the internet. 
            Imhotep Finance needs an active connection to manage your finances, 
            but you can still browse your cached content.
          </p>
          <div class="button-group">
            <button class="retry-button" onclick="window.location.reload()">
              🔄 Try Again
            </button>
            <a href="/" class="go-home-button">
              🏠 Go to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Background sync for when the user comes back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      console.log('Background sync triggered')
    );
  }
});

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New financial update available!',
    icon: '/imhotep_finance.png',
    badge: '/imhotep_finance.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Update',
        icon: '/imhotep_finance.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/imhotep_finance.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Imhotep Finance', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});
