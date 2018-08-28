import React, { Component } from 'react';
import './App.css';
import * as API from './API.js';
import List from './List.js';
import Map from './Map.js';

class App extends Component {
  state = {
    allStations: null,
    filteredStations: null,
    activatedStationId: '',
    activatedStationInfo: {
      tips: null,
      photos: null
    },
    searchTerm: '',
    isLoadingStations: true,
    isLoadingInfo: false,
    isOnline: true
  }
  
  addStations = response => {
    if (response === 'bad') {
      this.setState({isOnline: false, isLoadingStations: false, isLoadingInfo: false});
    } else {
      this.setState({allStations: response, isLoadingStations: false, isOnline: true});
    }
  }

  filterStations = searchTerm => {
    if (this.state.allStations) {
      let filteredStations = this.state.allStations.filter(station => {
        return station.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1
      });
      this.setState({searchTerm, filteredStations});
    } else {
      this.setState({searchTerm, filteredStations: null});
    }
  }

  activateStation = (targetStationId) => {
    if (targetStationId !== this.state.activatedStationId) {
      if (targetStationId === '') {
        this.setState({activatedStationId: targetStationId});
      } else {

        this.setState({activatedStationId: targetStationId, isLoadingInfo: true});
        let targetStation = (this.state.filteredStations || this.state.allStations).find(station => station.place_id === targetStationId);

        API.foursquare.getPlaceId(targetStation.geometry.location.toUrlValue())
          .then(data => {
            if(data.meta.code === 429) {
              this.setState({activatedStationInfo: 'no-quota', isLoadingInfo: false, isOnline: true});
            }
            else if(data.meta.code === 200 && !data.response.venues[0]) {
              this.setState({activatedStationInfo: {tips: {items: []}, photos: {items: []}}, isLoadingInfo: false, isOnline: true})
            } else {

              let placeId = data.response.venues[0].id;
              API.foursquare.getTips(placeId)
              .then(tipsData => {
                if(tipsData.meta.code === 429) {
                  this.setState({activatedStationInfo: 'no-quota', isLoadingInfo: false, isOnline: true});
                } else {
                  
                  API.foursquare.getPhotos(placeId)
                  .then(photosData => {
                    if(photosData.meta.code === 429) {
                      this.setState({activatedStationInfo: 'no-quota', isLoadingInfo: false, isOnline: true});
                    } else {
                      this.setState({
                        activatedStationInfo: {tips: tipsData.response.tips, photos: photosData.response.photos},
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

        let catchErrors = error => {
          if(error.toString() === 'TypeError: Failed to fetch'){
            this.setState({
              isLoadingInfo: false,
              isOnline: false,
              isLoadingStations: false,
              activatedStationInfo: {tips: null, photos: null}
            });
          } else {
            this.setState({
              isLoadingInfo: false,
              activatedStationInfo: {tips: null, photos: null}
            });
          }
        }
        
      }
    }
  }

  setIsLoadingStations = isLoadingStations => {
    this.setState({isLoadingStations});
  }

  setIsOnline = isOnline => {
    this.setState({isOnline});
  }

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
      <div className="container">
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
          addStations={this.addStations}
          setIsLoadingStations={this.setIsLoadingStations}
          setIsOnline={this.setIsOnline}
        />

        { // User is offline
          (!isOnline) && 
            (<p className="network-error">Network error! Check your connection.</p>)
        }
      </div>
    );
  }
}

export default App;
