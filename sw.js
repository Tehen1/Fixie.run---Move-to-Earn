const CACHE_NAME = 'fixierun-v1';
const GITHUB_PATH = '/Fixie.run---Move-to-Earn'; // Ton chemin GitHub Pages

const ASSETS = [
  `${GITHUB_PATH}/`,
  `${GITHUB_PATH}/index.html`,
  `${GITHUB_PATH}/style.css`,
  `${GITHUB_PATH}/app.js`,
  `${GITHUB_PATH}/manifest.webmanifest`,
  // Ne pas inclure les icônes si elles n'existent pas encore
];

// Install avec gestion d'erreurs
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache un par un pour éviter les erreurs
        return Promise.allSettled(
          ASSETS.map(url => 
            cache.add(url).catch(err => console.log(`Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => console.log('Install failed:', err))
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch avec gestion des erreurs
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
            
            return response;
          });
      })
      .catch(() => {
        // Fallback pour navigation
        if (event.request.mode === 'navigate') {
          return caches.match(`${GITHUB_PATH}/index.html`);
        }
      })
  );
});
