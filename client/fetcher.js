'use strict';

class Fetcher {
  fetchSatellites() {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/satellites',
            data => resolve(data));
    });
  }

  fetchRevolutions(satnum, ts, nrevs) {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/revol', { satnum, ts, nrevs },
        data => resolve(data));
    });
  }
}
