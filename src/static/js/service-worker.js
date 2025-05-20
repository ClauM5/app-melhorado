// Service Worker para PWA Hortifruti Delivery
const CACHE_NAME = 'hortifruti-delivery-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/styles.css',
  '/static/js/app.js',
  '/static/js/cart.js',
  '/static/manifest.json',
  '/static/images/icons/icon-72x72.png',
  '/static/images/icons/icon-96x96.png',
  '/static/images/icons/icon-128x128.png',
  '/static/images/icons/icon-144x144.png',
  '/static/images/icons/icon-152x152.png',
  '/static/images/icons/icon-192x192.png',
  '/static/images/icons/icon-384x384.png',
  '/static/images/icons/icon-512x512.png'
];

// Instalação do service worker e cache de arquivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptação de requisições para servir do cache quando offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response;
        }

        // Clone da requisição
        const fetchRequest = event.request.clone();

        // Tenta buscar do servidor
        return fetch(fetchRequest)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone da resposta
            const responseToCache = response.clone();

            // Adiciona ao cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se falhar e for uma requisição de página, retorna a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Atualização do service worker e remoção de caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento para mostrar notificação de instalação
self.addEventListener('beforeinstallprompt', (e) => {
  // Previne o comportamento padrão do navegador
  e.preventDefault();
  // Armazena o evento para uso posterior
  deferredPrompt = e;
  // Atualiza a interface para notificar o usuário que pode instalar o PWA
  showInstallPromotion();
});
