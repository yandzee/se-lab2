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
    let flightPlanCoordinates = [
      { lat: 37.772, lng: -122.214 },
      { lat: 21.291, lng: -157.821 },
      { lat: -18.142, lng: 178.431 },
      { lat: -27.467, lng: 153.027 },
    ];
    let flightPath = new google.maps.Polyline({
      path: flightPlanCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    flightPath.setMap(this.map);
  }

  render(orbs) {
    let orb = orbs[orbs.length - 1];
    let step = .1 * 60 * 60 * 1000;
    let n = 20;
    let data = [];
    let ts = Date.now();
    try {
      while (n --> 0) {
        let prop = this.propagate(orb, new Date(ts));
        data.push(prop);
        ts -= step;
      }
    } catch(_) {
      
    }

    console.log(data);
  }

  propagate(orb, date) {
    satellite.prepareSatrec(orb);
    let positionAndVelocity = satellite.propagate(
        orb,
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );
    let gmst = satellite.gstimeFromDate(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );
    // debugger;
    let positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    return positionGd;
  }

  fetchRevolutions(satnum, cb) {
    let f = new Fetcher();
    f.fetchRevolutions(satnum).then(orbs => {
      cb(orbs);
    });
  }

  showTrace() {
    let lastSat = this.activeSatallites[this.activeSatallites.length - 1];
    this.fetchRevolutions(lastSat, (orbs) => {
      this.render(orbs);
    });
  }

  showSatellite(satnum) {
    if (this.activeSatallites.indexOf(satnum) === -1) {
      this.activeSatallites.push(satnum);
      this.showTrace();
    }
  }

  hideSatellite(satnum) {
    let ri = this.activeSatallites.indexOf(satnum);
    if (ri !== -1)
      this.activeSatallites.splice(ri, 1);
  }

  setRevolutions(newRevCount) {
    this.revCount = newRevCount;
  }
}
