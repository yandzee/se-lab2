'use strict';

class Satellite {
  constructor(satnum, name) {
    this.satnum = satnum;
    this.name = name;

    this.satInfo = null;
  }

  info() {
    if (this.satInfo) return new Promise((resolve, reject) => {
      resolve(this.satInfo);
    });

    return fetcher.fetchInfo(this.satnum).then(info => {
      this.assignInfo(info);
      return info;
    });
  }

  assignInfo(info) {
    this.satInfo = info;
  }

  period(ts0, ts1) {
    return fetcher.fetchPeriod(this.satnum, ts0, ts1).then(orbs => 
      OrbElement.fromOrbs(orbs)
    );
  }

  revols(ts, nrevs) {
    return fetcher.fetchRevolutions(ts, nrevs).then(orbs => {
      OrbElement.fromOrbs(orbs)
    })
  }

  static load() {
    if (Satellite.satellites == null)
      Satellite.satellites = {};

    return fetcher.fetchSatellites().then(satellites => {
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
}

class OrbElement {
  constructor(orb) {
    this.ts = orb.timestamp;
    this.no = orb.no;
    this.prepared = false;
    this.raw = orb;
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

  static fromOrbs(orbs) {
    return orbs.map(orb => new OrbElement(orb));
  }
}