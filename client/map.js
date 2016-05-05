'use strict';

class MapComponent extends EventEmitter {
  constructor($mapComponent) {
    super();
    this.activeSatallites = [];

    this.sinceInput = $mapComponent.find('#since-date');
    this.untilInput = $mapComponent.find('#until-date');
    this.certainInput = $mapComponent.find('#certain-date');
    this.revolInput = $mapComponent.find('#revol-amount');
    this.startAz = $mapComponent.find('#start-az');
    this.endAz = $mapComponent.find('#end-az');
    this.showPeriodBtn = $mapComponent.find('#show-period-btn');
    this.showCertainBtn = $mapComponent.find('#show-certain-btn');

    let now = new Date();
    this.sinceInput.val(now.toISOString().slice(0, 19));
    this.certainInput.val(now.toISOString().slice(0, 19));
    now.setHours(now.getHours() + 2);
    this.untilInput.val(now.toISOString().slice(0, 19));

    this.since = new Date(this.sinceInput.val());
    this.until = new Date(this.untilInput.val());
    this.certainDate = new Date(this.certainInput.val());

    this.updateTraces = this.periodTraces;

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
        anchor: { x: 15, y: 15, },
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

    let certainHandler = e => {
      console.log('in certainInput input handler');
      let date = new Date($certainInput.val());
      console.log(date);
      this.certainDate = date;
      this.updateTraces = this.dateRevsTraces;
      this.updateTraces();
    };

    let revolHandler = e => {
      console.log('in revolInput input handler');
      let nrevs = parseInt($revolInput.val(), 10);
      nrevs = nrevs == null ? 1 : nrevs;
      this.nrevs = nrevs;
      this.updateTraces = this.dateRevsTraces;
      this.updateTraces();
    };

    let sinceHandler = e => {
      console.log('in sinceInput input handler');
      let since = new Date($sinceInput.val());
      this.since = since;
      this.updateTraces = this.periodTraces;
      this.updateTraces();
    };

    let untilHandler = e => {
      console.log('in untilInput input handler');
      let until = new Date($untilInput.val());
      this.until = until;
      this.updateTraces = this.periodTraces;
      this.updateTraces();
    };

    $sinceInput.on('input', sinceHandler);
    $sinceInput.on('focusin', sinceHandler);

    $untilInput.on('input', untilHandler);
    $untilInput.on('focusin', untilHandler);

    $certainInput.on('input', certainHandler);
    $certainInput.on('focusin', certainHandler);

    $revolInput.on('input', revolHandler);
    $revolInput.on('focusin', revolHandler);
  }

  propagateAll(sat, orbs, traces, ts0, ts1) {
    let step = (ts1 - ts0) / 50;
    traces[sat] = [];
    for (let ts = ts0; ts <= ts1; ts += step) {
      let closest = this.closest(orbs, ts);
      let point = closest.predict(ts);
      traces[sat].push(point);
    }
  }

  periodTraces() {
    this.clearMap();

    let ts0 = this.since.getTime();
    let ts1 = this.until.getTime();
    if (ts1 < ts0) return;
    let traces = {};

    let promises = [];
    for (let sat of this.activeSatallites) {
      let p = Satellite.get(sat).period(ts0, ts1).then(orbs => {
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
      Satellite.get(sat).revols(ts, nrevs).then(orbs => {
        let orbsInDay = orbs[0].no;
        let window = 24 * 3600 * 1000 * nrevs / orbsInDay / 1.99;
        let ts0 = ts - window;
        let ts1 = ts + window;
        this.propagateAll(sat, orbs, traces, ts0, ts1);
        this.satelliteIcon(orbs, ts0, ts1);
      })
    )).then(_ => this.render(traces));
  }

  satelliteIcon(orbs, ts0, ts1) {
    let now = new Date().getTime();
    if (now < ts0 || now > ts1) return;
    let closest = this.closest(orbs, now);
    let point = closest.predict(now);
    let pos = gLatLngDeg(point);
    let marker = this.satelliteMarker(pos);
    this.markers.push(marker);
    marker.setMap(this.map);
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
    return orbs.reduce((o1, o2) =>
      o2.timeDist(ts) < o1.timeDist(ts) ? o2 : o1);
  }

  showSatellite(satnum) {
    if (this.activeSatallites.indexOf(satnum) === -1) {
      this.activeSatallites.push(satnum);
    }

    this.updateTraces();
  }

  hideSatellite(satnum) {
    let ri = this.activeSatallites.indexOf(satnum);
    if (ri !== -1) {
      this.activeSatallites.splice(ri, 1);
    }

    this.updateTraces();
  }
}
