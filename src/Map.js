import React, {Component} from 'react';
import propTypes from 'prop-types';
import * as API from './API.js';
import hamburgerIcon from './assets/menu.svg';
import loadingIconCircle from './assets/loading.gif';
import loadingIconStripes from './assets/loading2.gif';

/**
 * @constructor
 * @description Map component representing the main view mainly map
 * execution series: componentDidMount() -> render() -> componentDidUpdate()
 * then the last two are repeated
 */
class Map extends Component {
  // stations and markers are stored here for comparison with prop values
  // map and infoWindow are stored here to be used globally between methods
  state = {
    stations: [],
    markers: [],
    map: null,
    infoWindow: null,
  }

  /**
   * @description Initialize map and all google maps script dependencies
   * after the script loads successfully
   */
  initMap() {
    const {addStations, setIsLoadingStations} = this.props;

    // Initialize map
    let map;
    map = new window.google.maps.Map(document.getElementById('map'), {
      center: {lat: 30.044305, lng: 31.235718},
      zoom: 9,
    });

    // Initialize global info window
    let infoWindow = new window.google.maps.InfoWindow({
      disableAutoPan: true
    });

    // Various ways to close info window..
    // there's extra listener on #map element in render's return
    // click close button
    infoWindow.addListener('closeclick', _ => this.closeInfoWindow(infoWindow));
    // click away on the map
    window.google.maps.event.addListener(map, "click", _ => this.closeInfoWindow(infoWindow));

    // adjust map elements tab order
    window.google.maps.event.addListener(map, "tilesloaded", this.adjustMapTabOrder);

    // Time to load stations/places from google maps servers
    setIsLoadingStations(true);
    // Use the request provide in ./API.js and pass it parent component method
    // as callback to be executed from there(inside API.js)
    API.googleMaps.getStations(map, addStations);

    //Store map and info window on state
    this.setState({map, infoWindow});
  }

  /**
   * @description Removes some invisible elements inside #map html element from tab order
   */
  adjustMapTabOrder() {
    document.querySelector("#map > div > div > div").setAttribute('tabindex', -1);
    document.querySelector("#map iframe").setAttribute('tabindex', -1);
    document.querySelectorAll('#map a').forEach(function(item) {
      item.setAttribute('tabindex','-1'); 
    });
  }

  /**
   * @description Returns map marker icon url
   * @param {string} icon - one of two, 'default' or 'activated' to return corresponding icon
   */
  getIcon(icon) {
    return icon === 'activated' ?
      // Activated marker icon
      'https://www.google.com/maps/vt/icon/name=assets/icons/poi/tactile/pinlet_shadow-2-medium.png,assets/icons/poi/tactile/pinlet_outline_v2-2-medium.png,assets/icons/poi/tactile/pinlet-2-medium.png,assets/icons/poi/quantum/pinlet/transit_pinlet-2-medium.png&highlight=ff000000,ffffff,000000,ffffff&color=ff000000?scale=1'
    :
      // Default icon
      'https://www.google.com/maps/vt/icon/name=assets/icons/poi/tactile/pinlet_shadow-2-medium.png,assets/icons/poi/tactile/pinlet_outline_v2-2-medium.png,assets/icons/poi/tactile/pinlet-2-medium.png,assets/icons/poi/quantum/pinlet/transit_pinlet-2-medium.png&highlight=ff000000,ffffff,db4437,ffffff&color=ff000000?scale=1'
  }
 
  /**
   * @description Represent retrieved stations by markers on map
   */
  drawMarkers() {
    const google = window.google;
    const {stations, activateStation} = this.props;
    const {map} = this.state; 

    // Check if there're old markers on the map
    if(this.state.markers[0]) {
      // Remove them from the map
      removeOldMarkers(this.state.markers);
    }

    // Remove old markers from the map before drawing new ones
    function removeOldMarkers(markers) {
      markers.forEach(marker => {
        marker.setMap(null)
      })
    }

    let markers, bounds;

    // Empty stations ('no matching search query') will be represented by empty map
    // and zoom out to the initial location
    if (stations.length === 0){
      markers = [];
      map.setCenter({lat: 30.044305, lng: 31.235718});
      map.setZoom(9);
    }
    else {
      // Set markers based off map
      markers = stations.map(station => {
        let marker = new google.maps.Marker({
          position: station.geometry.location,
          title: station.name,
          id: station.place_id,
          icon: this.getIcon('default')
        });
        return marker;
      });
      
      bounds = new google.maps.LatLngBounds();

      markers.forEach(marker => {
        // Make sure that marker is visible
        bounds.extend(marker.position);
        // Click a marker activates corresponding station
        marker.addListener('click', function() {
          activateStation(this.id);
        });
        marker.setMap(map);
      });

      // Set max zoom before fitting map to bounds, because
      // google maps will zoom in extremely (more than 13)
      // if there's only one marker
      map.setOptions({ maxZoom: 13 });
      map.fitBounds(bounds);
      google.maps.event.addListener(map, 'bounds_changed', function() {
        // Then reset max zoom again, so the user can zoom in freely
        map.setOptions({ maxZoom: undefined });
      });
    }

    // Store marker on state
    this.setState({markers});
  }

  /**
   * @description write data obtained from Foursquare into info window
   * @param {object} infoWindow - the global and the only info window
   * @param {object} marker - marker that will be set as anchor for info window
   * @param {object} info - data retrieved from Foursquare servers
   */
  populateInfoWindow(infoWindow, marker, info) {
    const {isLoadingInfo} = this.props;

    infoWindow.setContent(
      "<div role='dialog' aria-label='info window' class='info-window'>" +
        "<h3>" + marker.title + "</h3>" +
        // Show loading icon if still loading
        (isLoadingInfo ?
          '<div role="status" aria-label="loading" ' +
          'style="background: url(' + loadingIconCircle + '); ' +
          'background-size: 20px 20px; ' +
          'width: 20px; height: 20px;margin-right: auto; ' +
          'margin-left: auto;" ></div>'
        :
          // Foursquare quota exceeded
          (info === 'no-quota' ?
            "<p role='status' class='center'>Server overloaded. Try later!</p>"
          :
            // Mostly network error
            (!info.tips && !info.photos ?
              "<p role='status' class='center'>Couldn't retrieve data!</p>"
            :
              // No data available about this station
              // Or station not found on Foursquare
              (!info.photos.items[0] && !info.tips.items[0] ?
                "<p role='status' class='center'>No data available about this station!</p>"
              :
                (info.photos.items[0] ?
                  '<div  role="img" aria-label="'+ marker.title +
                  '" style="background: url(' + info.photos.items[0].prefix +
                  "250x150" + info.photos.items[0].suffix +
                  '); width: 250px; height: 150px;" ></div>'
                  :
                  ''
                )
                +
                (info.tips.items[0] ?
                  "<p><strong> Tip: </strong></p>" +
                  "<p>" + info.tips.items[0].text + "</p>"
                  :
                  ''
                )
                +
                "<p class='attribute'>Data obtained from " +
                "<a href='https://foursquare.com'>&copy;Foursquare</a></p>"
              ) 
            )
          )
        )

      + "</div>"
    );
  }

  /**
   * @description Open info window after populating it
   * @param {object} infoWindow - the global and the only info window
   * @param {*} map - the global and the only map
   * @param {*} marker - marker that will be set as anchor for info window
   */
  openInfoWindow(infoWindow, map, marker) {
    // if the info window is already open on another anchor marker
    if(infoWindow.marker) {
      // Change old anchor marker icon to default one
      infoWindow.marker.setIcon(this.getIcon('default'));
    }
    // For reference
    infoWindow.marker = marker;
    infoWindow.open(map, marker);
    // Change icon to active one
    infoWindow.marker.setIcon(this.getIcon('activated'));
    // Center map on anchor marker
    map.panTo(infoWindow.marker.getPosition());
  }

  /**
   * @description Close info window
   * - called by three events: close button click - map click - escape press
   * @param {object} infoWindow - the global and the only info window
   */
  closeInfoWindow(infoWindow) {
    // Check if info window was open
    if(infoWindow.marker) {
      infoWindow.marker.setIcon(this.getIcon('default'));
    }
    infoWindow.close();
    this.props.activateStation('');
    infoWindow.marker = null;
  }

  /**
   * @description Handle clicking the hamburger icon on the header
   * toggles side menu
   */
  handlehamburgerClick() {
      document.querySelector('aside').classList.toggle('open');
      document.querySelector('aside').classList.toggle('close');
  }

  /**
   * @description - Clicking the app title (cairo metro stations) resets search query
   * @param {object} props - Parent component props
   */
  handleAppTitleClick(props) {
      props.filterStations('');
  }

  /**
   * @description Part of react life cycle, executed before render()
   * specifically were added here to listen for google maps script loading
   * and fire initMap() and all script dependencies
   */
  componentDidMount() {
    if (window.google) {
      this.initMap();
    } else {
      let script = document.body.querySelector('script');
      script.addEventListener('load', e => {
        this.initMap();
      });
      
      // Network failure, script not loaded
      window.setTimeout( _ => {
        if (!window.google) {
          this.props.setIsLoadingStations(false);
          this.props.setIsOnline(false);
        }
      }, 1000);
    }

    // Reset side menu to its default appearence on resizing window
    // to prevent quirky behavior
    window.addEventListener('resize', function(){
      if (document.querySelector('aside')) {
        document.querySelector('aside').classList.remove('open');
        document.querySelector('aside').classList.remove('close');
      }
    });
  }

  /**
   * @description Draw UI - executed after componentDidMount
   */
  render() {
    const {
      stations,
      activatedStationId,
      activatedStationInfo,
      isLoadingStations,
    } = this.props;
    const {map, infoWindow, markers} = this.state; 

    // Handle the process of populating and opening info window
    // There's an activated info window
    if (this.state.markers.length !==0 && activatedStationId) {
      // Find anchor marker for info window
      let marker = markers.find(marker => marker.id === activatedStationId);
      if(marker) {
        // Populate info window
        this.populateInfoWindow(infoWindow, marker, activatedStationInfo);
        // Don't open info window on the same marker to prevent flickering
        if (infoWindow.marker !== marker) {
          // Open info window 
          this.openInfoWindow(infoWindow, map, marker)
        }
      }
    } 

    return(
      <main id="main" tabIndex="-1">
        <header role="banner">
          <h1 aria-labelledby="app-title">
            <img id="hamburger-icon" src={hamburgerIcon}
              alt="hamburger icon" aria-label="toggle side menu" tabIndex="0"
              onClick={this.handlehamburgerClick}
              onKeyDown={event => { (event.keyCode === 13) && this.handlehamburgerClick(event) }}
            />
            <span
              id="app-title" tabIndex="0" aria-hidden="true"
              onClick={_ => {this.handleAppTitleClick(this.props)}}
              onKeyDown={event => { (event.keyCode === 13) && this.handleAppTitleClick(this.props) }}              
            >Cairo Metro Stations
            </span>
          </h1>
        </header>
        {
          // loading stations
          isLoadingStations ?
            <p className="notify loading" role="status" aria-label="loading stations">
              <span aria-hidden="true">Loading Stations</span>
              <img src={loadingIconStripes} alt="loading" aria-hidden="true"/>
            </p>
            :
            // Failed loading stations
            (!stations) &&
              <p role="status" className="notify">Couldn't retrieve stations!</p>
        }

        <div
          id="map" role="application" aria-label="google maps"
          onKeyDown={event => { (event.keyCode === 27) && this.closeInfoWindow(this.state.infoWindow) }}
        >
        </div>
      </main>
    )
  }

  /**
   * @description Part of react life cycle, executed after render()
   * specifically were added here to prevent setting state inside render()
   */
  componentDidUpdate() {
    if (this.state.map && !this.props.isLoadingStations && this.props.stations) {
      // Only draw markers on the map when there're new stations to prevent flickering
      if (this.props.stations !== this.state.stations) {
        this.drawMarkers();
        // Store stations to compare later
        this.setState({stations: this.props.stations});
      }
    }

    // Deactivate station when its not present in the current search query
    if (this.props.activatedStationId) {
      let marker = this.state.markers.find(marker => marker.id === this.props.activatedStationId);
      if(!marker) {
        this.props.activateStation('');
      }
    } 
  }
}

Map.propTypes = {
  stations: propTypes.array,
  activatedStationId: propTypes.string.isRequired,
  activatedStationInfo: propTypes.oneOfType([
    propTypes.object,
    propTypes.string
  ]),
  isLoadingStations: propTypes.bool.isRequired,
  isLoadingInfo: propTypes.bool.isRequired,
  activateStation: propTypes.func.isRequired,
  filterStations: propTypes.func.isRequired,
  addStations: propTypes.func.isRequired,
  setIsLoadingStations: propTypes.func.isRequired,
  setIsOnline: propTypes.func.isRequired
};

export default Map;