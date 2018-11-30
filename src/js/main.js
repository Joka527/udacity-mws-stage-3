import DBHelper from './dbhelper.js';
import * as L from 'leaflet';

var restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, resp) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      neighborhoods = resp;
      fillNeighborhoodsHTML(resp);
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, resp) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      cuisines = resp;
      fillCuisinesHTML(resp);
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoiam9rYTUyNyIsImEiOiJjam5pZ3k0NzEwb2oxM3FxOTR5eG5xenY5In0.R7wFSeh1HSuITAsDoWN9rg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML(restaurants);
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurantsData) => {
  // Remove all restaurants
  restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (markers) {
    markers.forEach(marker => marker.remove());
  }
  markers = [];
  restaurants = restaurantsData;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap(restaurants);
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const image = document.createElement('img');
  const favorite = document.createElement('button');

  image.className = 'restaurant-img';
  image.alt=restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  li.append(image);

  favorite.innerHTML = '❤';
  favorite.classList.add('fav');

  favorite.onclick = function(){
    const isFav = !restaurant.is_favorite;
    DBHelper.updateFavStatus(restaurant.id, isFav);
    restaurant.is_favorite = !restaurant.is_favorite;
    updateFavClass(favorite, restaurant.is_favorite); 
  }
  updateFavClass(favorite, restaurant.is_favorite); 
  li.append(favorite);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.setAttribute("title","Link to view details for "+restaurant.name);
  more.onclick = function(){
    const url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  }
  li.append(more)

  return li
}

const updateFavClass = (el, isFav) => {
  if (isFav){
    el.classList.remove('notFav');
    el.classList.add('fav');
    el.setAttribute('aria-label', 'remove from favorites!');
  }else{
    el.classList.remove('fav');
    el.classList.add('notFav');
    el.setAttribute('aria-label', 'add to favorites!');
  }
}
/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    markers.push(marker);
  });

} 
/* addMarkersToMap = (restaurants = restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    markers.push(marker);
  });
} */

