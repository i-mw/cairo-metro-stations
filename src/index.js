import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './App.css'
// import App from './App';
// import List from './List.js';
import Map from './Map.js'
// import Map from './oldmap.js';
import registerServiceWorker from './registerServiceWorker';

let allStations = [
  {
    name: 'Maadi',
    place_id: 'maadimaadi',
    geometry: {
      location: {lat: 29.960303, lng: 31.257643}
    }
  },
  {
    name: 'Helwan',
    place_id: 'helwanhelwan',
    geometry: {
      location: {lat: 29.848982, lng: 31.334231}
    }
  },
  {
    name: 'Faisal',
    place_id: 'faisalfaisal',
    geometry: {
      location: {lat: 30.017043, lng: 31.203973}
    }
  }
];

let filteredStations = [
  {
    name: 'Helwan',
    place_id: 'helwanhelwan',
    geometry: {
      location: {lat: 29.848982, lng: 31.334231}
    }
  }
];

// allStations = null;

// filteredStations = null;

let activatedStation = {
  id: 'helwanhelwan',
  info: {
    tips: {
      items: [
        {
          text: "If you're heading to Sadat in the morning, try going to the front of the train. There's often seating space!"
        }
      ]
    },
    photos: {
      items: [
        {
          prefix: "https://igx.4sqi.net/img/general/",
          suffix: "/9891113_um9DFfsa7ABQHmltfLOmMVQLs-47aw6YGFp8UpLcAyQ.jpg"
        }
      ]
    }
  }
};

// activatedStation.id = ''
// activatedStation.info.tips = null;
// activatedStation.info.photos = null;
// activatedStation.info.tips.items = [];
// activatedStation.info.photos.items = [];

let searchTerm = '';
let isLoadingStations = false;
let isLoadingInfo = true;

let filterStations = function(searchTe) {
  if (allStations) {
    let filtered/* Stations */ = /* this.state. */allStations.filter(station => {
      return station.name.toLowerCase().indexOf(searchTe.toLowerCase()) > -1
    });
    // this.setState({searchTerm, filteredStations});
    searchTerm = searchTe;
    filteredStations = filtered;
    console.log(searchTerm);
    console.log(filteredStations);
  } else {
    searchTerm = searchTe;
    filteredStations = null;
    console.log(searchTerm);
    console.log(filteredStations);
  }
}

let activateStation = function(targetStationId) {
  let targetStation = (filteredStations || allStations).find(station => station.place_id === targetStationId);
  let foursqureID = '';
  let stationInfo = {
    tips: {},
    photos: {}
  };

  fetch('https://api.foursquare.com/v2/venues/search?' +
    'client_id=05P0FS504FLZ5TKRIHPZBKZVUFCGIDXD55THE5H0K1YJDJGJ&' +
    'client_secret=OZQE3XKXXVPNIRCCXMD0WTENRO314GO4S4BZCL4LS1HVM1JH&' +
    'v=20180323&' +
    'll=' + targetStation.geometry.location/* .toUrlValue() */ +
    '&radius=500&' +
    'categoryId=4bf58dd8d48988d1fd931735&' +
    'limit=1')
    .then(data => data.json())
    .then(received => {
      foursqureID = received.response.venues[0].id;
    })
    .then(_ => {
      fetch('https://api.foursquare.com/v2/venues/' + foursqureID + '/tips?' +
        'client_id=05P0FS504FLZ5TKRIHPZBKZVUFCGIDXD55THE5H0K1YJDJGJ&' +
        'client_secret=OZQE3XKXXVPNIRCCXMD0WTENRO314GO4S4BZCL4LS1HVM1JH&' +
        'v=20180323&' +
        'sort=popular&' +
        'limit=3')
        .then(data => data.json())
        .then(received => {
          stationInfo.tips = received.response.tips;
        })
        .catch();
      
      fetch('https://api.foursquare.com/v2/venues/' + foursqureID + '/photos?' +
        'client_id=05P0FS504FLZ5TKRIHPZBKZVUFCGIDXD55THE5H0K1YJDJGJ&' +
        'client_secret=OZQE3XKXXVPNIRCCXMD0WTENRO314GO4S4BZCL4LS1HVM1JH&' +
        'v=20180323&' +
        'limit=1')
        .then(data => data.json())
        .then( received => {
          stationInfo.photos = received.response.photos;

          activatedStation.id = targetStationId;
          activatedStation.info = stationInfo;
          console.log(activatedStation);
        })
        .catch();

    })
    .catch();

}















// ReactDOM.render(
  // <List
  //   stations={filteredStations || allStations}
  //   activatedStationId={activatedStation.id}
  //   searchTerm={searchTerm}
  //   isLoadingStations={isLoadingStations}
  //   filterStations={filterStations}
  //   activateStation={activateStation}
  // />
  // , document.getElementById('root'));
// ReactDOM.render(<Map />, document.getElementById('root'));
// ReactDOM.render(<App />, document.getElementById('root'));

ReactDOM.render(
  <Map
    stations={filteredStations || allStations}
    activatedStation={activatedStation}
    isLoadingStations={isLoadingStations}
    isLoadingInfo={isLoadingInfo}
    activateStation={activateStation}
  />
  , document.getElementById('root'));
registerServiceWorker();
