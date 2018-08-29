import React, {Component} from 'react'
import propTypes from 'prop-types'
import * as API from './API.js'

class Map extends Component {
  state = {
    stations: [],
    markers: [],
    map: null,
    infoWindow: null,
  }

  initMap() {
    const {addStations, setIsLoadingStations} = this.props;

    let map;
    map = new window.google.maps.Map(document.getElementById('map'), {
      center: {lat: 30.044305, lng: 31.235718},
      zoom: 9,
    });
    let infoWindow = new window.google.maps.InfoWindow({
      disableAutoPan: true
    });

    // adjust map tab order
    window.google.maps.event.addListener(map, "tilesloaded", this.adjustMapTabOrder);

    // infowindow close listeners + there's extra listener on #map element in render's return
    infoWindow.addListener('closeclick', _ => this.closeInfoWindow(infoWindow));
    window.google.maps.event.addListener(map, "click", _ => this.closeInfoWindow(infoWindow));

    setIsLoadingStations(true);
    API.googleMaps.getStations(map, addStations);
    this.setState({map, infoWindow});
  }

  adjustMapTabOrder() {
    document.querySelector("#map > div > div > div").setAttribute('tabindex', -1);
    document.querySelector("#map iframe").setAttribute('tabindex', -1);
    document.querySelectorAll('#map a').forEach(function(item) {
      item.setAttribute('tabindex','-1'); 
    });
  }

  getIcon(icon) {
    return icon === 'activated' ?
      'https://www.google.com/maps/vt/icon/name=assets/icons/poi/tactile/pinlet_shadow-2-medium.png,assets/icons/poi/tactile/pinlet_outline_v2-2-medium.png,assets/icons/poi/tactile/pinlet-2-medium.png,assets/icons/poi/quantum/pinlet/transit_pinlet-2-medium.png&highlight=ff000000,ffffff,000000,ffffff&color=ff000000?scale=1'
    :
      'https://www.google.com/maps/vt/icon/name=assets/icons/poi/tactile/pinlet_shadow-2-medium.png,assets/icons/poi/tactile/pinlet_outline_v2-2-medium.png,assets/icons/poi/tactile/pinlet-2-medium.png,assets/icons/poi/quantum/pinlet/transit_pinlet-2-medium.png&highlight=ff000000,ffffff,db4437,ffffff&color=ff000000?scale=1'
  }
 
  drawMarkers() {
    const google = window.google;
    const {stations, activateStation} = this.props;
    const {map} = this.state; 

    if(this.state.markers[0]) {
      removeOldMarkers(this.state.markers);
    }

    function removeOldMarkers(markers) {
      markers.forEach(marker => {
        marker.setMap(null)
      })
    }

    let markers, bounds;

    if (stations.length === 0){
      markers = [];
      map.setCenter({lat: 30.044305, lng: 31.235718});
      map.setZoom(9);
    }
    else {
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
    }

    this.setState({markers});
  }

  populateInfoWindow(infoWindow, marker, info) {
    const {isLoadingInfo} = this.props;

    infoWindow.setContent(
      "<div class='info-window'>" +
        "<h3>" + marker.title + "</h3>" +
        (isLoadingInfo ?
          '<div style="background: url(loading.gif); background-size: 20px 20px; width: 20px; height: 20px;margin-right: auto; margin-left: auto;" ></div>'
        :
          (info === 'no-quota' ?
            "<p class='center'>Server overloaded. Try later!</p>"
          :
            (!info.tips && !info.photos ?
              "<p class='center'>Couldn't retrieve data!</p>"
            :
              (!info.photos.items[0] && !info.tips.items[0] ?
                "<p class='center'>No data available about this station!</p>"
              :
                (info.photos.items[0] ?
                  '<div style="background: url(' + info.photos.items[0].prefix + "250x150" + info.photos.items[0].suffix + '); width: 250px; height: 150px;" ></div>'
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
                "<p class='attribute'>Data obtained from <a href='https://foursquare.com'>" +
                "Foursquare</a></p>"
              ) 
            )
          )
        )

      + "</div>"
    );
  }

  openInfoWindow(infoWindow, map, marker) {
    if(infoWindow.marker) {
      infoWindow.marker.setIcon(this.getIcon('default'));
    }
    infoWindow.marker = marker;
    infoWindow.open(map, marker);
    infoWindow.marker.setIcon(this.getIcon('activated'));
    map.panTo(infoWindow.marker.getPosition());
  }

  closeInfoWindow(infoWindow) {
    if(infoWindow.marker) {
      infoWindow.marker.setIcon(this.getIcon('default'));
    }
    infoWindow.close();
    this.props.activateStation('');
    infoWindow.marker = null;
  }

  handlehamburgerClick() {
      document.querySelector('aside').classList.toggle('open');
      document.querySelector('aside').classList.toggle('close');
  }

  handleAppTitleClick(props) {
      props.filterStations('');
  }

  componentDidMount() {
    if (window.google) {
      this.initMap();
    } else {
      let script = document.body.querySelector('script');
      script.addEventListener('load', e => {
        this.initMap();
      });
      
      window.setTimeout( _ => {
        if (!window.google) {
          this.props.setIsLoadingStations(false);
          this.props.setIsOnline(false);
        }
      }, 1000);
    }

    // reset side menu on resizing window to prevent quirky behavior
    window.addEventListener('resize', function(){
      document.querySelector('aside').classList.remove('open');
      document.querySelector('aside').classList.remove('close');
    });
  }

  render() {
    const {
      stations,
      activatedStationId,
      activatedStationInfo,
      isLoadingStations,
    } = this.props;
    const {map, infoWindow, markers} = this.state; 

    if (this.state.markers.length !==0 && activatedStationId) {
      let marker = markers.find(marker => marker.id === activatedStationId);
      if(marker) {
        this.populateInfoWindow(infoWindow, marker, activatedStationInfo);
        if (infoWindow.marker !== marker) {
          this.openInfoWindow(infoWindow, map, marker)
        }
      }
    } 

    return(
      <main id="main" tabIndex="-1">
        <header>
          <h1>
            <img id="hamburger-icon" src="menu.svg"
              alt="hamburger icon" tabIndex="0"
              onClick={this.handlehamburgerClick}
              onKeyDown={event => { (event.keyCode === 13) && this.handlehamburgerClick(event) }}
            />
            <span
              id="app-title" tabIndex="0"
              onClick={_ => {this.handleAppTitleClick(this.props)}}
              onKeyDown={event => { (event.keyCode === 13) && this.handleAppTitleClick(this.props) }}              
            >Cairo Metro Stations
            </span>
          </h1>
        </header>
        {
          isLoadingStations ?
            <p className="notify loading">
              <span>Loading Stations</span>
              <img src="loading2.gif" alt="loading"/>
            </p>
            :
            (!stations) &&
              <p className="notify">Couldn't retrieve stations!</p>
        }

        <div
          id="map"
          onKeyDown={event => { (event.keyCode === 27) && this.closeInfoWindow(this.state.infoWindow) }}
        >
        </div>
      </main>
    )
  }

  componentDidUpdate() {
    if (this.state.map && !this.props.isLoadingStations && this.props.stations) {
      if (this.props.stations !== this.state.stations) {
        this.drawMarkers();
        this.setState({stations: this.props.stations});
      }
    }

    // deactivate station when its not present in the current search query
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
}

export default Map