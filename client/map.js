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

    this.traces = {};

    this.traceMaker = this.periodTrace;

    this.satOrbs = {};

    this.initMap();
    this.makeHandlers();

    this.showMyPosition();
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('google-map'), {
      center: { lat: 0, lng: -180 },
      zoom: 1,
    });
  }

  createPath(points, color) {
    let path = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    return path;
  }

  satelliteMarker() {
    return new google.maps.Marker({
      map: this.map,
      icon: {
        url: '/saticon.png',
        size: new google.maps.Size(30, 30),
        anchor: { x: 15, y: 15, },
      },
    });
  }

  showMyPosition() {
    if (!navigator.geolocation)
      return;
    navigator.geolocation.getCurrentPosition(coords => {
      this.coords = coords = coords.coords;
      let mrk = new google.maps.Marker({
        position: new google.maps.LatLng(coords.latitude, coords.longitude),
        map: this.map,
        icon: {
          url: '/mypos.png',
          size: new google.maps.Size(200, 200),
          scaledSize: new google.maps.Size(26, 26),
          anchor: { x: 13, y: 13 },
        },
      });
      mrk.setMap(this.map);
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
      let date = new Date($certainInput.val());
      this.certainDate = date;
      this.traceMaker = this.dateRevsTrace;
      this.refreshTraces();
    };

    let revolHandler = e => {
      let nrevs = parseInt($revolInput.val(), 10);
      nrevs = !nrevs || nrevs < 1 ? 1 : nrevs;
      $revolInput.val(nrevs);
      this.nrevs = nrevs;
      this.traceMaker = this.dateRevsTrace;
      this.refreshTraces();
    };

    let sinceHandler = e => {
      let since = new Date($sinceInput.val());
      this.since = since;
      this.traceMaker = this.periodTrace;
      this.refreshTraces();
    };

    let untilHandler = e => {
      let until = new Date($untilInput.val());
      this.until = until;
      this.traceMaker = this.periodTrace;
      this.refreshTraces();
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

  propagateAll(sat, orbs, ts0, ts1) {
    const steps = 30;
    let no = orbs[orbs.length / 2 | 0].no;
    let revTime = 24 * 3600 * 1000 / no;
    let step = revTime / steps;
    let points = [];

    for (let ts = ts0; ts <= ts1; ts += step) {
      let closest = this.closest(orbs, ts);
      let point = closest.predict(ts);
      points.push(point);
    }

    return points;
  }

  showPath(satnum) {
    let map = this.map;
    let { path, marker } = this.traces[satnum];
    path.setMap(map);
    if (marker)
      marker.setMap(map);
  }

  hidePath(satnum) {
    let { path, marker, timer } = this.traces[satnum];
    path.setMap(null);
    if (marker)
      marker.setMap(null);
    clearInterval(timer);
  }

  refreshTraces() {
    for (let satnum in this.traces) {
      let oldColor = this.traces[satnum].color;
      this.removeTrace(satnum);
      this.addTrace(satnum, oldColor);
    }
  }

  computeTrace(satnum, color) {
    color = color || randomColor();
    return this.traceMaker(satnum).then(d => {
      let { points, marker, updater } = d;
      let path = this.createPath(points, color);
      return { color, path, marker, updater };
    });
  }

  createTrace(satnum, color) {
    return this.computeTrace(satnum, color).then(d => {
      this.traces[satnum] = d;
      let updater = d.updater;
      let timer = setInterval(_ => {
        let res = updater();
        if (res)
          clearInterval(timer);
      }, 2000);
      this.traces[satnum].timer = timer;
      return this.traces[satnum];
    });
  }

  addTrace(satnum, color) {
    this.createTrace(satnum, color).then(_ => this.showPath(satnum));
  }

  removeTrace(satnum) {
    this.hidePath(satnum);
    delete this.traces[satnum];
  }

  periodTrace(satnum) {
    let ts0 = this.since.getTime();
    let ts1 = this.until.getTime();
    if (ts1 < ts0) return;
    let points;
    let promises = [];
    return Satellite.get(satnum).period(ts0, ts1).then(orbs => {
      points = this.propagateAll(satnum, orbs, ts0, ts1);
      points = points.map(gLatLngDeg);
      let marker = this.satelliteIcon(satnum);
      let updater = this.createUpdater(marker, orbs, ts0, ts1);
      return { points, marker, updater };
    });
  }

  dateRevsTrace(satnum) {
    let ts = this.certainDate.getTime();
    let nrevs = this.nrevs;
    let points;
    let now = Date.now();

    return Satellite.get(satnum).revols(ts, nrevs).then(orbs => {
      let orbsInDay = orbs[0].no;
      let window = 24 * 3600 * 1000 * nrevs / orbsInDay / 2;
      let ts0 = ts - window;
      let ts1 = ts + window;
      points = this.propagateAll(satnum, orbs, ts0, ts1);
      points = points.map(gLatLngDeg);
      let marker = this.satelliteIcon(satnum);
      let updater = this.createUpdater(marker, orbs, ts0, ts1);

      return { points, marker, updater };
    });
  }

  createUpdater(marker, orbs, ts0, ts1) {
    return _ => {
      if (!marker)
        return 1;
      let now = Date.now();
      if (now < ts0 || now > ts1) {
        marker.setMap(null);
        return 1;
      }

      let closest = this.closest(orbs, Date.now());
      let point = closest.predict(Date.now());
      let pos = gLatLngDeg(point);
      marker.setPosition(pos);
    };
  }

  updateMarkers() {
    if (!this.satOrbs)
      return;
    for (let mrk of this.markers) {
      if (!this.satOrbs[mrk.satnum])
        continue;
      let closest = this.closest(this.satOrbs[mrk.satnum], Date.now());
      let point = closest.predict(Date.now());
      let pos = gLatLngDeg(point);
      mrk.setPosition(pos);
    }
  }

  createLabel(title, satnum) {
    let c = document.createElement('div');
    c.innerHTML = '<strong>' + title + '</strong><br>(' + satnum + ')';
    let info = new google.maps.InfoWindow({
      content: c,
    });

    return info;
  }

  satelliteIcon(satnum) {
    let marker = this.satelliteMarker();
    let satTitle = Satellite.get(satnum).name;
    let lbl = this.createLabel(satTitle, satnum);
    google.maps.event.addListener(marker, 'click', () => {
      lbl.open(this.map, marker);
    });
    return marker;
  }

  closest(orbs, ts) {
    return orbs.reduce((o1, o2) =>
      o2.timeDist(ts) < o1.timeDist(ts) ? o2 : o1);
  }

  showSatellite(satnum) {
    if (satnum in this.traces)
      return;
    this.addTrace(satnum);
  }

  hideSatellite(satnum) {
    if (!(satnum in this.traces))
      return;
    this.removeTrace(satnum);
  }
}
