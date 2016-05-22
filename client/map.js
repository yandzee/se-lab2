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
    this._traceMaker = this._periodTrace;

    this._initMap();
    this._makeHandlers();
  }

  static gLatLngDeg(p) {
    let c = 180 / Math.PI;
    return new google.maps.LatLng(c * p.latitude, c * p.longitude);
  }

  showSatellite(satnum) {
    if (satnum in this.traces)
      return;
    this._addTrace(satnum);
  }

  hideSatellite(satnum) {
    if (!(satnum in this.traces))
      return;
    this._removeTrace(satnum);
  }

  showMyPosition() {
    if (!navigator.geolocation)
      return;
    navigator.geolocation.getCurrentPosition(coords => {
      coords = coords.coords;
      let mrk = new google.maps.Marker({
        position: new google.maps.LatLng(coords.latitude, coords.longitude),
        map: this.map,
        icon: {
          url: '/assets/mypos.png',
          size: new google.maps.Size(200, 200),
          scaledSize: new google.maps.Size(26, 26),
          anchor: { x: 13, y: 13 },
        },
      });
      mrk.setMap(this.map);
      this.myPosMarker = mrk;
    });
  }

  hideMyPosition() {
    if (!this.myPosMarker)
      return;
    this.myPosMarker.setMap(null);
  }

  _initMap() {
    this.map = new google.maps.Map(document.getElementById('google-map'), {
      center: { lat: 0, lng: -180 },
      zoom: 1,
    });
  }

  _createPath(points, color) {
    let path = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    return path;
  }

  _satelliteMarker() {
    return new google.maps.Marker({
      map: this.map,
      icon: {
        url: '/assets/saticon.png',
        size: new google.maps.Size(30, 30),
        anchor: { x: 15, y: 15, },
      },
    });
  }

  _makeHandlers() {
    let $showPeriodBtn = this.showPeriodBtn;
    let $showCertainBtn = this.showCertainBtn;
    let $sinceInput = this.sinceInput;
    let $revolInput = this.revolInput;
    let $untilInput = this.untilInput;
    let $certainInput = this.certainInput;

    let revolHandler = e => {
      let date = new Date($certainInput.val());
      let nrevs = parseInt($revolInput.val(), 10);
      nrevs = nrevs < 1 ? 1 : nrevs;
      if (isNaN(nrevs))
        return;
      $revolInput.val(nrevs);
      this.certainDate = date;
      this.nrevs = nrevs;
      this._traceMaker = this._dateRevsTrace;
      this._refreshTraces();
    };

    let intervalHandler = e => {
      let daysLimit = 10;
      let since = new Date($sinceInput.val());
      let until = new Date($untilInput.val());
      if (until < since || until - since > 1000 * 60 * 3600 * daysLimit)
        return;

      this.since = since;
      this.until = until;

      this._traceMaker = this._periodTrace;
      this._refreshTraces();
    };

    $sinceInput.on('input', intervalHandler);
    $sinceInput.on('focusin', intervalHandler);

    $untilInput.on('input', intervalHandler);
    $untilInput.on('focusin', intervalHandler);

    $certainInput.on('input', revolHandler);
    $certainInput.on('focusin', revolHandler);

    $revolInput.on('input', revolHandler);
    $revolInput.on('focusin', revolHandler);
  }

  _propagateAll(sat, orbs, ts0, ts1) {
    const steps = 30;
    let no = orbs[orbs.length / 2 | 0].no;
    let revTime = 24 * 3600 * 1000 / no;
    let step = revTime / steps;
    let points = [];

    for (let ts = ts0; ts <= ts1; ts += step) {
      let closest = this._closest(orbs, ts);
      let point = closest.predict(ts);
      points.push(point);
    }

    return points;
  }

  _refreshTraces() {
    for (let satnum in this.traces) {
      let oldColor = this.traces[satnum].color;
      this._removeTrace(satnum);
      this._addTrace(satnum, oldColor);
    }
  }

  _computeTrace(satnum, color) {
    color = color || randomColor();
    return this._traceMaker(satnum).then(d => {
      let { points, marker, updater } = d;
      let path = this._createPath(points, color);
      return { color, path, marker, updater };
    });
  }

  _createTrace(satnum, color) {
    return this._computeTrace(satnum, color).then(d => {
      this.traces[satnum] = d;
      let updater = d.updater;
      let timer = setInterval(_ => {
        let res = updater();
        if (!res)
          clearInterval(timer);
      }, 2000);
      this.traces[satnum].timer = timer;
      return this.traces[satnum];
    });
  }

  _addTrace(satnum, color) {
    return this._createTrace(satnum, color)
      .then(_ => this._showPath(satnum))
      .catch(_ => {
        this._emit('error');
      });
  }

  _removeTrace(satnum) {
    this._hidePath(satnum);
    delete this.traces[satnum];
  }

  _periodTrace(satnum) {
    let ts0 = +this.since;
    let ts1 = +this.until;
    if (ts1 < ts0) return;
    let points;
    return Satellite.get(satnum).period(ts0, ts1).then(orbs => {
      points = this._propagateAll(satnum, orbs, ts0, ts1);
      points = points.map(MapComponent.gLatLngDeg);
      let marker = this._satelliteIcon(satnum);
      let updater = this._createUpdater(marker, orbs, ts0, ts1);
      return { points, marker, updater };
    });
  }

  _dateRevsTrace(satnum) {
    let ts = +this.certainDate;
    let nrevs = this.nrevs;
    let points;
    let now = Date.now();

    return Satellite.get(satnum).revols(ts, nrevs).then(orbs => {
      let orbsInDay = orbs[0].no;
      let window = 24 * 3600 * 1000 * nrevs / orbsInDay / 2;
      let ts0 = ts - window;
      let ts1 = ts + window;
      points = this._propagateAll(satnum, orbs, ts0, ts1);
      points = points.map(MapComponent.gLatLngDeg);
      let marker = this._satelliteIcon(satnum);
      let updater = this._createUpdater(marker, orbs, ts0, ts1);

      return { points, marker, updater };
    });
  }

  _createUpdater(marker, orbs, ts0, ts1) {
    return _ => {
      if (!marker)
        return false;
      let now = Date.now();
      if (now < ts0 || now > ts1) {
        marker.setMap(null);
        return false;
      }

      let closest = this._closest(orbs, Date.now());
      let point = closest.predict(Date.now());
      let pos = MapComponent.gLatLngDeg(point);
      marker.setPosition(pos);
      return true;
    };
  }

  _createLabel(title, satnum) {
    let c = document.createElement('div');
    c.innerHTML = '<strong>' + title + '</strong><br>(' + satnum + ')';
    let info = new google.maps.InfoWindow({
      content: c,
    });

    return info;
  }

  _satelliteIcon(satnum) {
    let marker = this._satelliteMarker();
    let satTitle = Satellite.get(satnum).name;
    let lbl = this._createLabel(satTitle, satnum);
    google.maps.event.addListener(marker, 'click', () => {
      lbl.open(this.map, marker);
    });
    return marker;
  }

  _closest(orbs, ts) {
    return orbs.reduce((o1, o2) =>
      o2.timeDist(ts) < o1.timeDist(ts) ? o2 : o1);
  }

  _showPath(satnum) {
    if (!this.traces[satnum])
      return;
    let map = this.map;
    let { path, marker } = this.traces[satnum];
    path.setMap(map);
    if (marker)
      marker.setMap(map);
  }

  _hidePath(satnum) {
    if (!this.traces[satnum])
      return;
    let { path, marker, timer } = this.traces[satnum];
    path.setMap(null);
    if (marker)
      marker.setMap(null);
    clearInterval(timer);
  }
}
