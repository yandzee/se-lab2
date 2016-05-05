'use strict';

let fetcher = (exports => {
  let fetchSatellites = () => {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/satellites',
            data => resolve(data));
    });
  };

  let fetchPeriod = (satnum, ts0, ts1) => {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/period', { satnum, ts0, ts1 },
        data => resolve(data));
    });
  };

  let fetchRevolutions = (satnum, ts, nrevs) => {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/revol', { satnum, ts, nrevs },
        data => resolve(data));
    });
  };

  let fetchInfo = (satnum) => {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/info', { satnum },
        data => resolve(data));
    });
  };

  let fetchAzimuth = (satnum) => {
    return new Promise((resolve, reject) => {
      $.get('http://www.n2yo.com/sat/allpassesjson.php', { s: satnum }, data => {
        let { startAz, startUTC, endAz, endUTC, } = data;
        resolve({ startAz, startUTC, endAz, endUTC, });
      });
    });
  };

  exports.fetchSatellites  = fetchSatellites;
  exports.fetchPeriod      = fetchPeriod;
  exports.fetchRevolutions = fetchRevolutions;
  exports.fetchInfo        = fetchInfo;
  exports.fetchAzimuth     = fetchAzimuth;

  return exports;
})({});
