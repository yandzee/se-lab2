'use strict';

class Satellite {
  constructor(satnum, name) {
    this.satnum = satnum;
    this.name = name;

    this.satInfo = null;
  }

  static load() {
    if (Satellite.satellites == null)
      Satellite.satellites = {};

    return fetch(window.location.origin + '/satellites')
      .then(data => data.json())
      .then(satellites => {
        for (let sat of satellites) {
          let s = new Satellite(sat.satnum, sat.title);
          Satellite.satellites[sat.satnum] = s;
        }

        return satellites;
      });
  }

  static get(satnum) {
    return Satellite.satellites[satnum];
  }

  info() {
    if (this.satInfo)
      return Promise.resolve(Object.assign({}, this.satInfo));

    let params = serialize({ satnum: this.satnum });

    return fetch(window.location.origin + '/info?' + params)
      .then(data => data.json())
      .then(info => {
        this.satInfo = Object.assign({}, info);
        return info;
      });
  }

  period(ts0, ts1) {
    let params = serialize({ satnum: this.satnum, ts0, ts1 });
    return fetch(window.location.origin + '/period?' + params)
      .then(data => data.json())
      .then(orbs => OrbElement.fromOrbs(orbs));
  }

  revols(ts, nrevs) {
    let params = serialize({ satnum: this.satnum, ts, nrevs });
    return fetch(window.location.origin + '/revol?' + params)
      .then(data => data.json())
      .then(orbs => OrbElement.fromOrbs(orbs));
  }
}

class OrbElement {
  constructor(orb) {
    this.ts = orb.timestamp;
    this.no = orb.no;
    this.prepared = false;
    this.raw = orb;
    this.satnum = orb.satnum;
  }

  static fromOrbs(orbs) {
    return orbs.map(orb => new OrbElement(orb));
  }

  timeDist(ts) {
    return Math.abs(ts - this.ts);
  }

  predict(ts) {
    if (!this.prepared) {
      this.prepared = true;
      satellite.prepareSatrec(this.raw);
    }

    return this.coords(ts);
  }

  coords(ts) {
    let date = new Date(ts);
    let dateProps = [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ];
    let posAndVel = satellite.propagate(this.raw, ...dateProps);
    let gmst = satellite.gstimeFromDate(...dateProps);
    let posGeodetic = satellite.eciToGeodetic(posAndVel.position, gmst);
    return posGeodetic;
  }
}
