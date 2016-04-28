'use strict';

class MapComponent extends EventEmitter {
  constructor() {
    super();
    this.activeSatallites = [];
    this.intervals = [];
    this.revCount = 1;

    this.initMap();
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('google-map'), {
      center: { lat: 0, lng: -180 },
      zoom: 8,
    });
    var flightPlanCoordinates = [
      {lat: 37.772, lng: -122.214},
      {lat: 21.291, lng: -157.821},
      {lat: -18.142, lng: 178.431},
      {lat: -27.467, lng: 153.027}
    ];
    var flightPath = new google.maps.Polyline({
      path: flightPlanCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    flightPath.setMap(this.map);
  }

  showSatellite(satnum) {
    this.activeSatallites.push(satnum);
  }

  hideSatellite(satnum) {
    let ri = this.activeSatallites.indexOf(satnum);
    this.activeSatallites.splice(ri, 1);
  }

  setRevolutions(newRevCount) {
    this.revCount = newRevCount;
  }
}
