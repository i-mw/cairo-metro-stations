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
            '&radius=500&' +
            'categoryId=4bf58dd8d48988d1fd931735&' +
            'limit=1')
              .then(response => response.json())
              .then(data => data.response.venues[0].id)
  },

  getTips(placeId) {
    return fetch('https://api.foursquare.com/v2/venues/' + placeId + '/tips?' +
            'client_id=' + this.keys.clientId + '&' +
            'client_secret=' + this.keys.clientSecret + '&' +
            'v=20180323&' +
            'sort=popular&' +
            'limit=1')
              .then(response => response.json())
              .then(data => data.response.tips)
  },

  getPhotos(placeId) {
    return fetch('https://api.foursquare.com/v2/venues/' + placeId + '/photos?' +
            'client_id=' + this.keys.clientId + '&' +
            'client_secret=' + this.keys.clientSecret + '&' +
            'v=20180323&' +
            'limit=1')  
              .then(response => response.json())
              .then( data => data.response.photos)
  }
}

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
          response = 'bad';
          cb(response);
        }
    });
  }
}