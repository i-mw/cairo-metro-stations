import React, {Component} from 'react'
import propTypes from 'prop-types'

class Map extends Component {
  state = {
    markers: [],
    activatedMarker: {}
  }

  componentDidMount() {
    if (window.google) {
      this.initMap();
    } else {
      let script = document.body.querySelector('script');
      script.addEventListener('load', e => {
        this.initMap();
      });
    }
  }

  initMap() {
    const {
      stations,
      activatedStation,
      isLoadingStations,
      isLoadingInfo,
      activateStation
      } = this.props;
    const google = window.google;
    let map, markers, infoWindow, bounds;

    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 30.044305, lng: 31.235718},
      zoom: 10,
    });

    if (!isLoadingStations && stations && stations.length !== 0) {
      markers = stations.map(station => {
        let marker = new google.maps.Marker({
          position: station.geometry.location,
          title: station.name,
          id: station.place_id
        });
        return marker;
      });

      infoWindow = new google.maps.InfoWindow();
      bounds = new google.maps.LatLngBounds();

      markers.forEach(marker => {
        bounds.extend(marker.position);
        marker.addListener('click', function() {
          activateStation(this.id);
        });
        marker.setMap(map);
      });

      map.setOptions({ maxZoom: 13 });
      map.fitBounds(bounds);

      google.maps.event.addListener(map, 'bounds_changed', function() {
        map.setOptions({ maxZoom: undefined });
      });


      if (activatedStation.id) {
        let activatedMarker = markers.find(marker => {
          return marker.id === activatedStation.id;
        });
        populateInfoWindow(activatedMarker, infoWindow, activatedStation.info);
      }

      function populateInfoWindow(marker, infoWindow, info) {
        if (!isLoadingInfo && !info.tips && !info.photos) {
          infoWindow.setContent(
            "<div class='info-window'>" + 
              "<p class='center'>Couldn't retrieve data!</p>" +
            "</div>"
          );
        }
        else if (!isLoadingInfo && !info.photos.items[0] && !info.tips.items[0]) {
          infoWindow.setContent(
            "<div class='info-window'>" +
              "<p class='center'>No data available about this station!</p>" +
            "</div>"
          );
        }
        else if (!isLoadingInfo && info.photos.items[0] && info.tips.items[0]) {
          infoWindow.setContent(
            "<div class='info-window'>" + 
              "<img src=" + info.photos.items[0].prefix + "250x150" + info.photos.items[0].suffix + "/>" +
              "<p><strong> Tip: </strong></p>" +
              "<p>" + info.tips.items[0].text + "</p>" +
            "</div>"
          );
        }
        else if (!isLoadingInfo && info.photos.items[0] && !info.tips.items[0]) {
          infoWindow.setContent(
            "<div class='info-window'>" + 
              "<img src=" + info.photos.items[0].prefix + "250x150" + info.photos.items[0].suffix + "/>" +
            "</div>"
          );
        }
        else if (!isLoadingInfo && !info.photos.items[0] && info.tips.items[0]) {
          infoWindow.setContent(
            "<div class='info-window'>" + 
              "<p><strong> Tip: </strong></p>" +
              "<p>" + info.tips.items[0].text + "</p>" +
            "</div>"
          );
        }
        else if (isLoadingInfo) {
          infoWindow.setContent(
            "<div class='info-window'>" + 
              "<img src='loading.gif' alt='loading' class='loading'/>" +
            "</div>"
          );
        }

        infoWindow.open(map, marker);
      }
    } else if (!isLoadingStations && stations && stations.length === 0) {
      // TODO: handle empty stations search after previous stations were rendered
    }
  }

  render() {
    const {stations, isLoadingStations} = this.props;

    return(
      <main>
        <header>
          <h1>
            <img id="hamburger-icon" src="menu.svg" alt="hamburger icon"/>
            <span>Cairo Metro Stations</span>
          </h1>
        </header>
        {
          isLoadingStations ?
            <p className="notify loading">
              <span>Loading Stations</span>
              <img src="loading2.webp" alt="loading"/>
            </p>
            :
            (!stations) &&
              <p className="notify">Couldn't retrieve stations!</p>
        }
        <div id="map"></div>
      </main>
    )
  }
}

Map.propTypes = {
  stations: propTypes.array,
  activatedStation: propTypes.object.isRequired,
  isLoadingStations: propTypes.bool.isRequired,
  isLoadingInfo: propTypes.bool.isRequired,
  activateStation: propTypes.func.isRequired
}

export default Map