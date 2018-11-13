import idb from 'idb';

let cacheID = 'mws-restaurant-001';

let dbPromise = idb.open('mws-restaurant-stage-2', 1, upgradeDb => {
    let keyValStore = upgradeDb.createObjectStore('restaurants');

})

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheID).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                // '/css/',
                '/src/css/styles.css',
                '/main.bundle.min.js',
                '/restaurant.bundle.min.js'
            ])
            .catch(err => {
                console.log('Cache open failed: ' + err);
            });
        })
    );
});

self.addEventListener('fetch', function(event) {
    let cacheRequest = event.request;
    if (event.request.url.indexOf('restaurant.html') > -1 ){
        cacheRequest = new Request('restaurant.html');
    }
    event.respondWith(
      caches.match(cacheRequest).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });