import React, { Component } from 'react';
import './App.css';
import * as API from './API.js';
import List from './List.js';
import Map from './Map.js';

/**
 * @constructor
 * @description App component representing the whole app
 * It wraps List and Map component,
 */
class App extends Component {
  // All data are stored here
  // All data are initially set inside this component
  // except 'allStations' which is initially set inside Map component
  // because that component controls everything related to map
  // stations refers to google map places
  state = {
    allStations: null,
    filteredStations: null,
    // activated station refers an open place that the app
    // is getting details about from Foursquare servers
    // and will represent them in an info window
    activatedStationId: '',
    activatedStationInfo: {
      tips: null,
      photos: null
    },
    searchTerm: '',
    // data to handle errors
    isLoadingStations: true,
    isLoadingInfo: false,
    isOnline: true
  }
  
  /**
   * @description Initially sets 'allStations' which is the initial
   * set of places obtained from google maps
   * - This method is called once from Map component 
   * @param {object | string} response - Places obtained from servers
   * or response message if failed
   */
  addStations = response => {
    // Network failed
    if (response === 'UNKNOWN_ERROR') {
      this.setState({isOnline: false, isLoadingStations: false, isLoadingInfo: false});
    } else if (response === "OVER_QUERY_LIMIT") {
      this.setState({isOnline: true, isLoadingStations: false, isLoadingInfo: false});
    }
    // Stations(places) retrieved successfully
    else {
      this.setState({allStations: response, isLoadingStations: false, isOnline: true});
    }
  }

  /**
   * @description Filters stations in 'allStations' and stores
   * filtered stations into 'filteredStations'
   * @param {string} searchTerm - search term entered by the user to check against
   */
  filterStations = searchTerm => {
    // Run filtering process if there's only a new search term,
    // To prevent flickering and performance issues
    if (this.state.searchTerm !== searchTerm) {
      // Prevent the user from searching when the app didn't get stations(places)
      // from google maps servers yet
      if (this.state.allStations) {
        let filteredStations = this.state.allStations.filter(station => {
          return station.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1
        });
        this.setState({searchTerm, filteredStations});
      } else {
        this.setState({searchTerm, filteredStations: null});
      }
    }
  }

  /**
   * @description Activates a station by user click on a station 
   * that opens an info window and retrieves data from Foursquare server
   * - stations are referrenced by id {string} which is obtained from google maps
   * @param {string} targetStationId - station id
   */
  activateStation = (targetStationId) => {
    // Make sure that user isn't activated already activated station
    // To prevent flickering
    if (targetStationId !== this.state.activatedStationId) {
      if (targetStationId === '') {
        this.setState({activatedStationId: targetStationId});
      } else {

        // Set required station Id before requesting data from Foursquare
        this.setState({
          activatedStationId: targetStationId,
          isLoadingInfo: true});
        // Get the matching station from station lists to retrieve its location
        // And make a call to Foursquare servers with that location
        let targetStation = (this.state.filteredStations || this.state.allStations)
          .find(station => station.place_id === targetStationId);

        // Get Foursquare placeId
        API.foursquare.getPlaceId(targetStation.geometry.location.toUrlValue())
          .then(data => {
            if(data.meta.code === 429) {
              this.setState({
                activatedStationInfo: 'no-quota',
                isLoadingInfo: false,
                isOnline: true});
            }
            else if(data.meta.code === 200 && !data.response.venues[0]) {
              this.setState({
                activatedStationInfo: {tips: {items: []}, photos: {items: []}},
                isLoadingInfo: false,
                isOnline: true})
            } else {

              let placeId = data.response.venues[0].id;
              // Then get tips about that place using placeId
              API.foursquare.getTips(placeId)
              .then(tipsData => {
                if(tipsData.meta.code === 429) {
                  this.setState({
                    activatedStationInfo: 'no-quota',
                    isLoadingInfo: false,
                    isOnline: true});
                } else {
                  
                  // then get photos
                  API.foursquare.getPhotos(placeId)
                  .then(photosData => {
                    if(photosData.meta.code === 429) {
                      this.setState({
                        activatedStationInfo: 'no-quota',
                        isLoadingInfo: false,
                        isOnline: true});
                    } else {
                      this.setState({
                        activatedStationInfo: {tips: tipsData.response.tips,
                          photos: photosData.response.photos},
                        isLoadingInfo: false,
                        isOnline: true
                    });
                    }
                  })
                  .catch(error => {catchErrors(error)});
                  
                }
              })
              .catch(error => {catchErrors(error)});
            }
          })
          .catch(error => {catchErrors(error)});

        // Handle errors
        let catchErrors = error => {
          // Network Error
          if(error.toString() === 'TypeError: Failed to fetch'){
            this.setState({
              isLoadingInfo: false,
              isOnline: false,
              isLoadingStations: false,
              activatedStationInfo: {tips: null, photos: null}
            });
          } else {
            // Not a network error
            this.setState({
              isLoadingInfo: false,
              activatedStationInfo: {tips: null, photos: null}
            });
          }
        }
        
      }
    }
  }

  /**
   * @description Change the state of retrieving stations/places from google maps
   * @param {boolean} - state of connecting google maps servers
   */
  setIsLoadingStations = isLoadingStations => {
    this.setState({isLoadingStations});
  }

  /**
   * @description Change user internet connection state
   * @param {boolean} - state of internet connection
   */
  setIsOnline = isOnline => {
    this.setState({isOnline});
  }

  /**
   * @description moves focus from skip link at top left corner to main conent area
   * Called by clicking the skip link
   */
  handleSkipLink() {
    document.getElementById('main').focus();
  }

  /**
   * @description Draws UI
   */
  render() {
    const {
      allStations,
      filteredStations,
      searchTerm,
      activatedStationId,
      activatedStationInfo,
      isLoadingStations,
      isLoadingInfo,
      isOnline
    } = this.state;

    return (
      <div className="container" role="region" aria-label="app container">
        <div tabIndex="0" className="skip-link"
          role="link" aria-label="skip to main content"
          onClick={this.handleSkipLink}
          onKeyDown={event => { (event.keyCode === 13) && this.handleSkipLink(event) }}          
          >Skip to main content</div>
          
        <List
          stations={filteredStations || allStations}
          activatedStationId={activatedStationId}
          searchTerm={searchTerm}
          isLoadingStations={isLoadingStations}
          filterStations={this.filterStations}
          activateStation={this.activateStation}
        />

        <Map
          stations={filteredStations || allStations}
          activatedStationId={activatedStationId}
          activatedStationInfo={activatedStationInfo}
          isLoadingStations={isLoadingStations}
          isLoadingInfo={isLoadingInfo}
          activateStation={this.activateStation}
          filterStations={this.filterStations}          
          addStations={this.addStations}
          setIsLoadingStations={this.setIsLoadingStations}
          setIsOnline={this.setIsOnline}
        />

        { // User is offline, notify him/er
          (!isOnline) && 
            (<p role="alert" className="network-error">Network error! Check your connection.</p>)
        }
      </div>
    );
  }
}

export default App;
