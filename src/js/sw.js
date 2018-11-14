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
    const reqURLString= event.request.url;
    const reqURLObj= new URL(event.request.url);

    if (reqURLObj.port === '1337'){
        const pathsArr= reqURLObj.pathname.split('/');
        const id = pathsArr[pathsArr.length-1] === 'restaurants' ? null : pathsArr[pathsArr.length-1];
        if(id){
            event.respondWith(
                dbPromise.then(db => {
                    let tx = db.transaction('restaurants');
                    let restStore = tx.objectStore('restaurants');
                    return restStore.get(id);
                })
                .then(data => {
                    return (data && data.data) || 
                        fetch(event.request)
                            .then(resp => resp.json())
                            .then(respjson => {
                                return dbPromise.then(db => {
                                    const tx = db.transaction('restaurants', 'readwrite');
                                    tx.objectStore('restaurants').put({ 'id': id, 'data': respjson});
                                    return respjson;
                                });
            
                            })
                })
                .then(final => new Response(JSON.stringify(final)))
            );
        }   
    }else{
        if (reqURLObj.href.indexOf('restaurant.html') > -1 ){
            cacheRequest = new Request('restaurant.html');
        }
        event.respondWith(
            caches.match(cacheRequest).then(function(response) {
                return response || fetch(event.request);
            })
        );
    }
  });