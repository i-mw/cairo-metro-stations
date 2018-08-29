import React, {Component} from 'react';
import propTypes from 'prop-types';
import loadingIconStripes from './assets/loading2.gif';

class List extends Component {

  handleFilterSubmit = event => {
    event.preventDefault();
    let searchTerm = document.getElementById('filter-input').value;
    this.props.filterStations(searchTerm);
  }

  handleStationClick= event => {
    this.props.activateStation(event.target.getAttribute('id'));
  }

  render() {
    const {stations, activatedStationId, searchTerm, isLoadingStations} = this.props;
    return (
      <aside>
        <form>
          <input
            id="filter-input" type="text" aria-label="search stations"
            placeholder={isLoadingStations? "loading..." : "Search for a station"}
            autoComplete="off"
            value={searchTerm}
            onChange={this.handleFilterSubmit}
            onKeyDown={event => { (event.keyCode === 13) && this.handleFilterSubmit(event) }}
          />
          <input
            id="filter-button" type="button" value="Filter" aria-label="filter stations"
            onClick={this.handleFilterSubmit}
            onKeyDown={event => { (event.keyCode === 13) && this.handleFilterSubmit(event) }}
          />
        </form>
        { 
          isLoadingStations ? 
            <img src={loadingIconStripes} alt="loading" className="loading"/>
            :
            !stations ?
              <p className="center">Couldn't retrieve stations!</p>
              :
              stations.length === 0 ?
                <p className="center">No matching stations!</p>
                :
                <ul id="stations-list" aria-label="matched stations">
                  { 
                    stations.map(station => {
                      return (
                      <li
                        key={station.place_id}
                        id={station.place_id}
                        tabIndex="0"
                        className={(station.place_id === activatedStationId) ? "highlight" : undefined}
                        onClick={this.handleStationClick}
                        onKeyDown={event => { (event.keyCode === 13) && this.handleStationClick(event) }}
                      >
                        {station.name}
                      </li>
                    )
                    })
                  }
                </ul>
        }
      </aside>
    )
  }

  componentDidUpdate() {
    let highlighted = document.querySelector('.highlight');
    if (highlighted) {
      let aboveElement = highlighted.getBoundingClientRect().top;
      if (aboveElement < 40 || aboveElement + 30 > window.innerHeight) {
        highlighted.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
      }
    }
  }
}

List.propTypes = {
  stations: propTypes.array,
  activatedStationId: propTypes.string.isRequired,
  searchTerm: propTypes.string.isRequired,
  isLoadingStations: propTypes.bool.isRequired,
  filterStations: propTypes.func.isRequired,
  activateStation: propTypes.func.isRequired
};

export default List;