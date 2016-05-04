'use strict';

class MapComponent extends EventEmitter {
  constructor($mapComponent) {
    super();
    this.activeSatallites = [];
    this.fetcher = new Fetcher();

    this.sinceInput = $mapComponent.find('#since-date');
    this.untilInput = $mapComponent.find('#until-date');
    this.revolInput = $mapComponent.find('#revol-amount');
    this.showButton = $mapComponent.find('#show-btn');

    let now = new Date();
    this.untilInput.prop('valueAsDate', now);
    this.sinceInput.prop('valueAsDate', now.setDate(now.getDate() - 1));

    this.since = new Date(this.sinceInput.val());
    this.until = new Date(this.untilInput.val());

    this.initMap();
    this.makeHandlers();
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('google-map'), {
      center: { lat: 0, lng: -180 },
      zoom: 1,
    });
    this.paths = [];
  }

  createPath(points) {
    let colors = ['#ff0000', '#00ff00', '#0000ff', '#008080', '#ffd700',
                  '#800080', '#f6546a', '#40e0d0', '#3b5998', '#8b0000', ];

    let path = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: colors[randInt(0, colors.length)],
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    return path;
  }

  makeHandlers() {
    let $showButton = this.showButton;
    let $sinceInput = this.sinceInput;
    let $revolInput = this.revolInput;
    let $untilInput = this.untilInput;

    $showButton.click(e => {
      let since = new Date($sinceInput.val());
      let until = new Date($untilInput.val());
      if (until - since < 0) return; // TODO: show error
      let nrevs = $untilInput.val();
      this.since = since;
      this.until = until;
      this.nrevs = nrevs;

      this.updateTraces();
    });
  }

  fetchRevolutions(satnum, ts, nrevs) {
    return this.fetcher.fetchRevolutions(satnum, ts, nrevs);
  }

  fetchSatTrace(sat, since, until, step, nrevs, traces) {
    let promises = [];
    traces[sat] = [];
    for (let ts = since; ts <= until; ts += step) {
      let p = this.fetchRevolutions(sat, ts, nrevs).then(orbs => {
        let closest = this.closest(orbs, ts);
        let point = this.coords(closest, ts);
        traces[sat].push(point);
      });
      promises.push(p);
    }

    return Promise.all(promises).then(_ => {
      traces[sat].sort((a, b) => a.timestamp > b.timestamp);
    });
  }

  updateTraces() {
    if (this.activeSatallites.length === 0)
      return this.clearMap();

    let since = this.since.getTime();
    let until = this.until.getTime();
    let nrevs = this.nrevs;
    let traces = {};
    let step = (until - since) / 50; // which step?

    Promise.all(this.activeSatallites.map(sat =>
      this.fetchSatTrace(sat, since, until, step, nrevs, traces)
    )).then(_ => this.render(traces));
  }

  coords(point, ts) {
    let date = new Date(ts);
    let dateProps = [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ];
    satellite.prepareSatrec(point);
    let posAndVel = satellite.propagate(point, ...dateProps);
    let gmst = satellite.gstimeFromDate(...dateProps);
    let posGeodetic = satellite.eciToGeodetic(posAndVel.position, gmst);
    return posGeodetic;
  }

  render(traces) {
    for (let satnum in traces) {
      let gpoints = traces[satnum].map(p => ({ lat: p.latitude, lng: p.longitude }));
      console.log('satnum = ' + satnum);
      console.log(gpoints);
      let path = this.createPath(gpoints);
      this.showPath(path);
    }
  }

  showPath(path) {
    this.paths.push(path);
    path.setMap(this.map);
  }

  clearMap() {
    for (let path of this.paths)
      path.setMap(null);
    this.paths = [];
  }

  // render(orbs) {
  //   let orb = orbs[orbs.length - 1];
  //   let step = .1 * 60 * 60 * 1000;
  //   let n = 20;
  //   let data = [];
  //   let ts = Date.now();
  //   try {
  //     while (n-- > 0) {
  //       let prop = this.propagate(orb, new Date(ts));
  //       data.push(prop);
  //       ts -= step;
  //     }
  //   } catch (_) { }

  //   console.log(data);
  // }

  // propagate(orb, date) {
  //   satellite.prepareSatrec(orb);
  //   let positionAndVelocity = satellite.propagate(
  //       orb,
  //       date.getUTCFullYear(),
  //       date.getUTCMonth() + 1,
  //       date.getUTCDate(),
  //       date.getUTCHours(),
  //       date.getUTCMinutes(),
  //       date.getUTCSeconds()
  //   );
  //   let gmst = satellite.gstimeFromDate(
  //       date.getUTCFullYear(),
  //       date.getUTCMonth() + 1,
  //       date.getUTCDate(),
  //       date.getUTCHours(),
  //       date.getUTCMinutes(),
  //       date.getUTCSeconds()
  //   );
  //   let positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
  //   return positionGd;
  // }

  closest(orbs, ts) {
    let cl = orbs[0];
    let minTsDiff = Math.abs(ts - cl.timestamp);

    for (let point of orbs) {
      let ots = point.timestamp;
      let tsDiff = Math.abs(ts - ots);
      if (tsDiff < minTsDiff) {
        cl = point;
        minTsDiff = tsDiff;
      }
    }

    return cl;
  }

  showSatellite(satnum) {
    if (this.activeSatallites.indexOf(satnum) === -1) {
      this.activeSatallites.push(satnum);
      console.log('activeSatallites: ', this.activeSatallites);
      this.updateTraces();
    }
  }

  hideSatellite(satnum) {
    let ri = this.activeSatallites.indexOf(satnum);
    if (ri !== -1) {
      this.activeSatallites.splice(ri, 1);
      console.log('activeSatallites: ', this.activeSatallites);
      this.updateTraces();
    }
  }

  setRevolutions(newRevCount) {
    this.revCount = newRevCount;
  }
}
