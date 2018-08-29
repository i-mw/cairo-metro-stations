/**
 * This file contains all AJAX request that are made to outside servers
 * These are for two destination: Google maps and Foursquare
 * 
 * Requests to Google Maps: to obtain metro stations present in cairo 
 *  - which are 59 stations at the current moment in 2018
 * 
 * Requests to Foursquare: to obtain data (one tip and one photo)
 * about each station when requested
 */

 /* Foursquare Requests */
export const foursquare = {
  keys: {
    clientId: '05P0FS504FLZ5TKRIHPZBKZVUFCGIDXD55THE5H0K1YJDJGJ',
    clientSecret: 'OZQE3XKXXVPNIRCCXMD0WTENRO314GO4S4BZCL4LS1HVM1JH'
  },

  getPlaceId(location) {
    return fetch('https://api.foursquare.com/v2/venues/search?' +
            'client_id=' + this.keys.clientId + '&' +
            'client_secret=' + this.keys.clientSecret + '&' +
            'v=20180323&' +
            'll=' + location +
            '&radius=420&' +
            'categoryId=4bf58dd8d48988d1fd931735&' +
            'limit=1')
              .then(response => response.json())
              .then(data => data)
  },

  getTips(placeId) {
    return fetch('https://api.foursquare.com/v2/venues/' + placeId + '/tips?' +
            'client_id=' + this.keys.clientId + '&' +
            'client_secret=' + this.keys.clientSecret + '&' +
            'v=20180323&' +
            'sort=popular&' +
            'limit=1')
              .then(response => response.json())
              .then(data => data)
  },

  getPhotos(placeId) {
    return fetch('https://api.foursquare.com/v2/venues/' + placeId + '/photos?' +
            'client_id=' + this.keys.clientId + '&' +
            'client_secret=' + this.keys.clientSecret + '&' +
            'v=20180323&' +
            'limit=1')  
              .then(response => response.json())
              .then(data => data)
  }
}

/* Google Requests */
export const googleMaps = {  
  getStations(map, cb) {
    let google = window.google,
    options = {
      location: new google.maps.LatLng(30.044305, 31.235718),
      radius: 50000,
      type: ['subway_station']
    },
    response,
    stations = [],
    placesService = new google.maps.places.PlacesService(map);

    placesService.nearbySearch(
      options,
      function(results, status, pagination) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          stations = stations.concat(results);
          if (pagination.hasNextPage) {
            pagination.nextPage();
          } else {
            response = stations;
            cb(response);
          }
        } else {
          cb(status);
        }
    });
  }
}