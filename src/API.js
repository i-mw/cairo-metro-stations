export const foursquare = {
  // keys: {
  //   clientId: '05P0FS504FLZ5TKRIHPZBKZVUFCGIDXD55THE5H0K1YJDJGJ',
  //   clientSecret: 'OZQE3XKXXVPNIRCCXMD0WTENRO314GO4S4BZCL4LS1HVM1JH'
  // },

  // keys: {
  //   clientId: 'H3YM4S4DOJOSIKRGQIXRH15LJ3Y4YHHESRRZIDD2TXUMLA1F',
  //   clientSecret: 'Q1GRWZKDTXRPP3NLHOP2M4RTL1ZTBA1NAT5EJ2OED2PEQYRE'
  // },

  // keys: {
  //   clientId: 'SQ4DUW3REDAGG21W324DIDXBKAAHSWKJL0YZFUWAJBT3YAAK',
  //   clientSecret: 'ZITLVK0JJMDX2OBGXQV33HML13UZS2GOVF3ZN4AXEBSWUKAS'
  // },

  // keys: {
  //   clientId: 'JQV2OUETLB4YFDADMAXAQT1FLAEGDGTO3IAEPV1REZFDC1PH',
  //   clientSecret: 'UQ3YCGJJZHYNERXXUNDNNS4JBGEST4M1QGSVUQSB5HD2ZVQ5'
  // },

  // keys: {
  //   clientId: 'DHL4OUMEKM2N1IELF4I30I4Y2ZBUWD0LEV04DS5HLWVZAZHQ',
  //   clientSecret: 'YFNHQ4G3FNBDOYDZOP4NFLOJFDIRUMIFH3OGMYI33ZF3RGRA'
  // },

  // keys: {
  //   clientId: 'F3QZA5P41P43VTBB5FU51VRTLX35OTAQ5UVBS4K2MU3NEPHW',
  //   clientSecret: 'NK2530GRTGXS4CHVZM1ECQCOHOOXPOQSWQNEGDC13CXU1G2L'
  // },

  // keys: {
  //   clientId: '4CMBOEV0AOUBYEKTJBDJGXUGZYKCN5HX1HCD0GQSNGNSWA3F',
  //   clientSecret: '4ENM5TMBGSTNYCZS0EO4NTLH4O5LKAXT400ZNNVP1SLCHUP0'
  // },

  keys: {
    clientId: 'PZC3JKPZDLJRYAK0RG5QQQF4SB52GGXQN0NJUBOJDLCXOHDJ',
    clientSecret: 'BQW0HLVICM4NZG1W33SSNDJUH05NJYV45Y22PPRTTMGJCRT0'
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