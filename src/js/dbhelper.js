import idb from 'idb';
import * as L from 'leaflet';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  static get DB_PROMISE(){
    return idb.open('mws-restaurant-stage-3', 2, upgradeDb => {
      switch(upgradeDb.oldVersion){
        case 0:
          upgradeDb.createObjectStore('restaurants', {keyPath:'id'});
        case 1: 
          upgradeDb.createObjectStore('reviews', {keyPath:'id'});
      }
      
    })
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {

    let fetchURL= (id) ? DBHelper.DATABASE_URL +'restaurants/'+id : DBHelper.DATABASE_URL +'restaurants';
    fetch(fetchURL, { method: 'GET' })
      .then(resp => resp.json())
        .then(restaurants => callback(null, restaurants))
        .catch(err => callback("Request failed, returned:" +err, null));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants;
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    },id);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/assets/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(map);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
  
  static updateFavStatus(id, isFav){
    let fetchURL= DBHelper.DATABASE_URL +'restaurants/'+id+'/?is_favorite='+isFav;
    fetch(fetchURL, { method: 'PUT' })
      .then(resp => {
        console.log(resp.json());
        DBHelper.DB_PROMISE
        .then(db => {
          let tx = db.transaction('restaurants', 'readwrite');
          let restStore = tx.objectStore('restaurants');
          restStore.get(id)
            .then(restaurant =>{
              if(restaurant){
                restaurant.is_favorite = isFav;
                restStore.put(restaurant);
              }  
            })
        })
      }) 
      .catch(err => console.error("Request failed, returned: "+err));  
  }

  static getReviewsByRestaurantId(id){
    let fetchURL = DBHelper.DATABASE_URL+'reviews/?restaurant_id='+id;
    return fetch(fetchURL, { method: 'GET'})
      .then(resp => resp.json())
      .then(reviews => {
        DBHelper.DB_PROMISE
          .then(db => {
            if (!db) return;
            let tx = db.transaction('reviews', 'readwrite');
            let revStore = tx.objectStore('reviews');
            if(Array.isArray(reviews)){
              reviews.forEach(function(review){
                revStore.put(review);
              })
            }else{ revStore.put(reviews); }
          })
        return Promise.resolve(reviews);
      })
      .catch(err => { //when fetch fails = offline
        return DBHelper.getIDBObjById('mws-restaurant-stage-3','reviews', id)
          .then(reviews => {
              return Promise.resolve(reviews);
          })
      })  
  }

  static getIDBObjById(index, table, id){
    return DBHelper.DB_PROMISE
      .then(db =>{
        if (!db) return;
        let tx = db.transaction(table);
        let store = tx.objectStore(table);
        let indexName = store.index(index);
        return indexName.getAll(id);
      })
  }

  static saveNewReview(reviewObj){
    let fetchURL = DBHelper.DATABASE_URL+'reviews/';
    if (!navigator.onLine){
        this.saveLater(reviewObj);
      }

      let reviewDBObj ={
        restaurant_id: parseInt(reviewObj.restaurant_id),
        name: reviewObj.name,
        rating: parseInt(reviewObj.rating),
        comments: reviewObj.comments
      }

      let fetchOptions={
        method: 'POST',
        body: JSON.stringify(reviewDBObj),
        //headers: new Headers({ 'content-type': 'application/json'})
      }; 
      fetch(fetchURL, fetchOptions)
        .then(resp =>{
          console.log('Saved Successfully with ' + resp.status + ': '+resp.statusText);
        })
        .catch(err => console.log('Save failed with error: '+err));
  }

  static saveLater(reviewObj){
    localStorage.setItem('reviewToSave', JSON.stringify(reviewObj));
    window.addEventListener('online', e => {
      let reviewToSave = localStorage.getItem('reviewToSave');
      if(reviewToSave) DBHelper.saveNewReview(reviewObj);
      localStorage.removeItem('reviewToSave');
    })  
  }


}

export default DBHelper;