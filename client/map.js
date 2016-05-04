'use strict';

class MapComponent extends EventEmitter {
  constructor($mapComponent) {
    super();
    this.activeSatallites = [];

    this.sinceInput = $mapComponent.find('#since-date');
    this.untilInput = $mapComponent.find('#until-date');
    this.certainInput = $mapComponent.find('#certain-date');
    this.revolInput = $mapComponent.find('#revol-amount');
    this.showPeriodBtn = $mapComponent.find('#show-period-btn');
    this.showCertainBtn = $mapComponent.find('#show-certain-btn');

    let now = new Date();
    this.sinceInput.val(now.toISOString().slice(0, 19));
    this.certainInput.val(now.toISOString().slice(0, 19));
    now.setHours(now.getHours() + 2);
    this.untilInput.val(now.toISOString().slice(0, 19));

    this.since = new Date(this.sinceInput.val());
    this.until = new Date(this.untilInput.val());
    this.certain = new Date(this.certainInput.val());

    this.initMap();
    this.makeHandlers();
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('google-map'), {
      center: { lat: 0, lng: -180 },
      zoom: 1,
    });
    this.paths = [];
    this.markers = [];
  }

  createPath(points) {
    let colors = ['#ff0000', '#00ff00', '#0000ff', '#008080', '#ffd700',
                  '#800080', '#f6546a', '#40e0d0', '#3b5998', '#8b0000',
                  ];

    let path = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: colors[randInt(0, colors.length)],
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    return path;
  }

  satelliteMarker(pos) {
    return new google.maps.Marker({
      position: pos,
      map: this.map,
      icon: {
        url: '/saticon.png',
        size: new google.maps.Size(30, 30),
      },
    });
  }

  makeHandlers() {
    let $showPeriodBtn = this.showPeriodBtn;
    let $showCertainBtn = this.showCertainBtn;
    let $sinceInput = this.sinceInput;
    let $revolInput = this.revolInput;
    let $untilInput = this.untilInput;
    let $certainInput = this.certainInput;

    $showPeriodBtn.click(e => {
      e.preventDefault();
      let since = new Date($sinceInput.val());
      let until = new Date($untilInput.val());
      if (until - since < 0) return;
      this.since = since;
      this.until = until;

      this.periodTraces();
    });

    $showCertainBtn.click(e => {
      e.preventDefault();
      let date = new Date($certainInput.val());
      let nrevs = $revolInput.val();

      this.certainDate = date;
      this.nrevs = nrevs;

      this.dateRevsTraces();
    });
  }

  propagateAll(sat, orbs, traces, ts0, ts1) {
    let prevClosest = null;
    let step = (ts1 - ts0) / 50;
    traces[sat] = [];
    for (let ts = ts0; ts <= ts1; ts += step) {
      let closest = this.closest(orbs, ts);
      if (closest !== prevClosest)
        satellite.prepareSatrec(closest);
      let point = this.coords(closest, ts);
      traces[sat].push(point);
      prevClosest = closest;
    }
  }

  satelliteIcon(orbs, ts0, ts1) {
    let now = new Date().getTime();
    if (now < ts0 || now > ts1) return;
    console.log('in satelliteIcon');
    let closest = this.closest(orbs, now);
    let point = this.coords(closest, now);
    let pos = gLatLngDeg(point);
    let marker = this.satelliteMarker(pos);
    this.markers.push(marker);
    marker.setMap(this.map);
  }

  periodTraces() {
    this.clearMap();

    let ts0 = this.since.getTime();
    let ts1 = this.until.getTime();
    let traces = {};

    let promises = [];
    for (let sat of this.activeSatallites) {
      let p = fetcher.fetchPeriod(sat, ts0, ts1).then(orbs => {
        this.propagateAll(sat, orbs, traces, ts0, ts1);
        this.satelliteIcon(orbs, ts0, ts1);
      });
      promises.push(p);
    }

    Promise.all(promises).then(_ => this.render(traces));
  }

  dateRevsTraces() {
    this.clearMap();

    let ts = this.certainDate.getTime();
    let nrevs = this.nrevs;
    let traces = {};
    let now = new Date().getTime();

    Promise.all(this.activeSatallites.map(sat =>
      fetcher.fetchRevolutions(sat, ts, nrevs).then(orbs => {
        console.log(orbs);
        let orbsInDay = orbs[0].no;
        let window = 24 * 3600 * 1000 * nrevs / orbsInDay / 1.99;
        let ts0 = ts - window;
        let ts1 = ts + window;

        this.propagateAll(sat, orbs, traces, ts0, ts1);
        this.satelliteIcon(orbs, ts0, ts1);
      })
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
    let posAndVel = satellite.propagate(point, ...dateProps);
    let gmst = satellite.gstimeFromDate(...dateProps);
    console.log(posAndVel.position);
    let posGeodetic = satellite.eciToGeodetic(posAndVel.position, gmst);
    return posGeodetic;
  }

  render(traces) {
    for (let satnum in traces) {
      let gpoints = traces[satnum].map(p => gLatLngDeg(p));
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
    for (let marker of this.markers)
      marker.setMap(null);

    this.paths = [];
    this.markers = [];
  }

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
    }
  }

  hideSatellite(satnum) {
    let ri = this.activeSatallites.indexOf(satnum);
    if (ri !== -1) {
      this.activeSatallites.splice(ri, 1);
    }
  }
}
